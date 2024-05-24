import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import {
  buyAndSellStock,
  IMarginCalculationRequest,
  ITouchlineDetails,
  onlyUnique,
  predicateBy,
  predicateByDesc,
} from '../models/trade.model';
import { AuthService } from '../services/auth.service';
import { EncService } from '../services/enc.service';
import { ServiceService } from '../services/service.service';
import { StrikeService } from '../services/strike.service';
import { TradeService } from '../services/trade.service';
import { UserService } from '../services/user.service';
import { getIST } from '../services/utils';

@Component({
  selector: 'app-all-positions',
  templateUrl: './all-positions.component.html',
  styleUrls: ['./all-positions.component.css'],
})
export class AllPositionsComponent {
  allPositions: any = [];
  stockList: any = [];
  selectedWatchListElement: any = undefined;
  buyOrSellModel = new buyAndSellStock();
  totalBuyOrSellQty: number = 0;
  tradeSocket: any;
  selectedWatchListSection: any;
  totalOrderList: any = [];
  loading = false;
  subscribedSymbols: any[] = [];
  // orderList: Array<object> = [];
  openOrderList: any = [];
  selectedDate: Date = getIST();
  timer: any;
  niftyStrikes: any = [];
  finNiftyStrikes: any = [];
  bankNiftyStrikes: any = [];
  constructor(
    private tradeService: TradeService,
    private strikeService: StrikeService,
    private encService: EncService,
    private services: ServiceService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    if (!(this.authService.isAdminUser() || this.authService.isManager()))
      this.router.navigateByUrl('/');
    // if (this.userService.userDetails) {
    //   if (this.userService.userDetails.userType != 'ADMIN')
    //     this.router.navigateByUrl('/trade');
    // } else {
    //   this.router.navigateByUrl('/trade');
    // }
    this.strikeService.getStocks().subscribe((res: any) => {
      this.stockList = res;
    });
  }
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
  ngOnInit(): void {
    if (this.getSocket() == undefined) this.getSocket();

    setTimeout(() => {
      this.getOrderList();
    }, 300);

    this.strikeService.getExpiry().subscribe((res: any) => {
      let _expiry = res[0];
      this.strikeService
        .getStrikes('NIFTY', _expiry, 'CE')
        .subscribe((res: any) => {
          this.niftyStrikes = res;
        });
      this.strikeService
        .getStrikes('BANKNIFTY', _expiry, 'CE')
        .subscribe((res: any) => {
          this.bankNiftyStrikes = res;
        });
    });

    this.strikeService.getExpiryByCalendarId(3).subscribe((res: any) => {
      let _expiry = res[0];
      this.strikeService
        .getStrikes('FINNIFTY', _expiry, 'CE')
        .subscribe((res: any) => {
          this.finNiftyStrikes = res;
        });
    });
  }
  filterPositions(positionList: any) {
    return positionList.filter(
      (item: any) => !(item.orderType == 'cnc' && item.quantity == 0)
    );
  }
  populateQty(item: any) {
    let symbol = item.symbol;

    if (item.strategy == 'straddle')
      symbol = `${
        this.stockList.find((s: any) => s.displayName == item.symbol).name
      }${moment(item.expiry).format('YYMMDD')}${item.strike}CE`;
    if (item.strategy == 'ironfly')
      symbol = `${
        this.stockList.find((s: any) => s.displayName == item.symbol).name
      }${moment(item.expiry).format('YYMMDD')}${item.strike}CE`;
    var lotSize = this.tradeService.allStockList.find(
      (s) => s.symbol == symbol
    )?.lotSize;

    if (lotSize) {
      var numbers = [];
      let quantity = item.quantity;
      if (quantity > 0)
        for (var i = 1; i <= quantity / lotSize; i++) {
          numbers.push(i * lotSize);
        }
      if (quantity < 0)
        for (var i = Number(quantity) / lotSize; i < 0; i++) {
          numbers.push(i * lotSize);
        }
    }
    return numbers;
  }
  exitOrder(data: any, userId: number) {
    //#region new code

    this.selectedWatchListSection = data.strategy;

    let buyOrSell = new buyAndSellStock();
    buyOrSell.orderType = data.orderType;
    buyOrSell.triggerPrice = data.ltp;
    buyOrSell.isExitOrder = true;
    buyOrSell.userId = userId;
    var lotSize = this.tradeService.allStockList.find(
      (s) => s.symbol == data.symbol
    )?.lotSize;
    if (data.strategy == 'straddle') {
      lotSize = this.tradeService.allStockList.find(
        (s) => s.symbol == data.ceSymbol
      )?.lotSize;
    } else if (data.strategy == 'ironfly') {
      lotSize = this.tradeService.allStockList.find(
        (s) => s.symbol == data.symbol1
      )?.lotSize;
    }
    let quantity = null;
    if (data.selectedQuantity > 0) {
      quantity = data.selectedQuantity;
      buyOrSell.sell = true;
    } else {
      quantity = data.selectedQuantity - 2 * data.selectedQuantity;
      buyOrSell.sell = false;
    }

    if (lotSize) buyOrSell.quantity = quantity / lotSize;

    this.calTotalQty();
    this.selectedWatchListElement = {
      lotSize: lotSize,
      ltp: data.ltp,
      symbol: data.symbol,
      symbolId: data.symbolId,
      strike: data.strike,
      expiry: data.expiry,
      alias: data.alias,
      strategy: data.strategy,
    };

    this.buyOrSellModel = buyOrSell;
    return;
    //#endregion
  }
  calTotalQty() {
    setTimeout(() => {
      if (
        this.buyOrSellModel['quantity'] > this.selectedWatchListElement.maxQty
      ) {
        this.buyOrSellModel['quantity'] = this.selectedWatchListElement.maxQty;
      }
      if (this.buyOrSellModel['quantity'] <= 0) {
        this.buyOrSellModel.quantity = 1;
      }
      this.totalBuyOrSellQty = this.buyOrSellModel['quantity']
        ? this.buyOrSellModel['quantity']
        : 1;
    }, 100);
  }
  resetPriceVal(price: any, targetPrice: any) {
    this.buyOrSellModel.price = 0;
    this.buyOrSellModel.triggerPrice = 0;
    if (price) {
      this.buyOrSellModel.price = this.selectedWatchListElement['ltp'];
    }
    if (targetPrice) {
      this.buyOrSellModel.targetPrice = this.selectedWatchListElement['ltp'];
    }
  }
  buyOrSellStock(userId?: number) {
    let obj: any = this.buyOrSellModel;
    if (!userId) userId = this.buyOrSellModel.userId;
    if (obj.quantity > 50) obj.quantity = 50;
    obj.operationType = obj.sell ? 'sell' : 'buy';

    let orders = this.totalOrderList
      .filter((x: any) => x.status == 'executed')
      .map((val: any) => {
        var lotSize = this.tradeService.allStockList.find(
          (s: any) => s.symbol == val.symbol
        )?.lotSize;

        if (val.strategy == 'straddle') {
          lotSize = this.tradeService.allStockList.find(
            (s: any) =>
              s.symbol ==
              `${
                this.stockList.find((s: any) => s.displayName == val.symbol)
                  .name
              }${moment(val.expiry).format('YYMMDD').toUpperCase()}${
                val.strike
              }CE`
          )?.lotSize;
        } else if (val.strategy == 'ironfly') {
          lotSize = this.tradeService.allStockList.find(
            (s: any) =>
              s.symbol ==
              `${
                this.stockList.find((s: any) => s.displayName == val.symbol)
                  .name
              }${moment(val.expiry).format('YYMMDD').toUpperCase()}${
                val.strike
              }CE`
          )?.lotSize;
        }

        return {
          symbol: val.symbol,
          operationType: val.operationType,
          price: val.price,
          triggerPrice: val.triggerPrice,
          strike: val.strike,
          expiry: val.expiry,
          strategy: val.strategy,
          lotSize: lotSize,
          quantity:
            val.operationType == 'sell' ? -1 * val.quantity : val.quantity,
        };
      });

    orders.push({
      symbol: this.selectedWatchListElement.symbol,
      operationType: obj.operationType,
      price: this.selectedWatchListElement.ltp,
      triggerPrice: this.selectedWatchListElement.ltp,
      strike: this.selectedWatchListElement.strike,
      expiry: this.selectedWatchListElement.expiry,
      lotSize: this.selectedWatchListElement.lotSize,
      strategy: this.selectedWatchListSection,
      quantity:
        (obj.operationType == 'sell'
          ? -1 * this.totalBuyOrSellQty
          : this.totalBuyOrSellQty) * this.selectedWatchListElement.lotSize,
    });

    var grped = _.groupBy(orders, 'symbol');
    let final: any = [];
    _.map(grped, (values, key) => {
      final.push({
        symbol: key,
        price: values[0].price,
        triggerPrice: values[0].price,
        quantity: _.sum(values.map((x) => x.quantity)),
        strike: values[0].strike,
        expiry: values[0].expiry,
        strategy: values[0].strategy,
        transactionType: values[0].operationType,
        lotSize: values[0].lotSize,
      });
    });

    if (final.length == 0) {
      return;
    }

    var symbolsToGet = final;

    if (symbolsToGet.length > 0) {
      if (this.buyOrSellModel.isExitOrder) {
        obj.strategy = this.selectedWatchListElement.strategy;
        this.placeTradeOrder(obj, userId);
        return;
      }
      // var values: IMarginCalculationRequest[] = symbolsToGet.map((val: any) => {
      //   if (val.strategy == 'straddle') {
      //     val.quantity = val.quantity / val.lotSize;
      //   }
      //   if (val.strategy == 'options') {
      //     val.quantity = val.quantity / val.lotSize;
      //   }
      //   return {
      //     price: val.price,
      //     quantity: val.quantity < 0 ? -1 * val.quantity : val.quantity,
      //     symbol: val.symbol,
      //     lotSize: val.lotSize,
      //     strategy: val.strategy,
      //     strike: val.strike,
      //     expiry: this.tradeService.allStockList.find(
      //       (s: any) => s.symbol == val.symbol
      //     )?.expiry,
      //     transactionType: val.transactionType,
      //     triggerPrice: val.price,
      //   };
      // });

      // this.placeTradeOrder(obj, userId);
    } else {
      let margin = 0;
      final.forEach((f: any) => {
        margin += (f.quantity < 0 ? f.quantity * -1 : f.quantity) * f.price;
      });

      if (this.selectedWatchListElement.ceSymbolId) {
        let selectedItemObj: any = this.selectedWatchListElement;
        if (
          obj.rateType == 'limit' &&
          selectedItemObj.ceLtp <= obj.price &&
          obj.operationType == 'buy'
        ) {
          obj.price = selectedItemObj.ceLtp;
          // status = "executed"
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ceLtp > obj.price &&
          obj.operationType == 'buy'
        ) {
          status = 'open';
        } else if (
          obj.rateType == 'slm' &&
          selectedItemObj.ceLtp == obj.triggerPrice
        ) {
          // status = "executed"
          obj['price'] = obj.triggerPrice;
        } else if (
          obj.rateType == 'slm' &&
          (selectedItemObj.ceLtp < obj.triggerPrice ||
            selectedItemObj.ceLtp > obj.triggerPrice)
        ) {
          status = 'open';
          obj['price'] = obj.triggerPrice;
        } else if (obj.rateType == 'market') {
          // status = "executed"
          obj['price'] = selectedItemObj.ceLtp;
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ceLtp >= obj.price &&
          obj.operationType == 'sell'
        ) {
          obj.price = selectedItemObj.ceLtp;
          // status = "executed"
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ceLtp < obj.price &&
          obj.operationType == 'sell'
        ) {
          status = 'open';
        }
        obj['time'] = getIST();
        obj['status'] = 'open';
        obj['quantity'] = this.totalBuyOrSellQty;
        obj['symbol'] = selectedItemObj.ceSymbol;
        obj['symbolId'] = selectedItemObj.ceSymbolId;
        setTimeout(() => {
          this.selectedWatchListElement = null;
        }, 100);
        obj.userId = userId;
        obj.guid = this.generateUID();

        this.openOrderList.push(obj);
        let inputParam = {
          userId: userId,
          list: [obj],
        };

        let symbolVal: any = this.tradeService.allStockList.find(
          (s: any) => s.symbol == obj.ceSymbol
        );
        if (symbolVal != undefined) {
          obj.symbolId = symbolVal.symbolId;
          obj.alias = symbolVal.alias;
          obj.expiry = symbolVal.expiry;
          obj.strike = symbolVal.strike;
          if (
            this.subscribedSymbols.find((s) => s == obj.symbol) == undefined
          ) {
            this.subscribedSymbols.push(obj.symbol);
          }
        }
        if (obj.rateType == 'market') {
          status = 'executed';
        }
        this.totalOrderList.push(obj);
        this.loading = true;
        this.tradeService.buyOrSell(inputParam).subscribe(
          (data: any) => {
            this.getOrderList();
          },
          (err: any) => {
            this.loading = false;
          }
        );
      } else {
        let selectedItemObj: any = this.selectedWatchListElement;
        if (
          obj.rateType == 'limit' &&
          selectedItemObj.ltp <= obj.price &&
          obj.operationType == 'buy'
        ) {
          obj.price = selectedItemObj.ltp;
          // status = "executed"
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ltp > obj.price &&
          obj.operationType == 'buy'
        ) {
          status = 'open';
        } else if (
          obj.rateType == 'slm' &&
          selectedItemObj.ltp == obj.triggerPrice
        ) {
          // status = "executed"
          obj['price'] = obj.triggerPrice;
        } else if (
          obj.rateType == 'slm' &&
          (selectedItemObj.ltp < obj.triggerPrice ||
            selectedItemObj.ltp > obj.triggerPrice)
        ) {
          status = 'open';
          obj['price'] = obj.triggerPrice;
        } else if (obj.rateType == 'market') {
          // status = "executed"
          obj['price'] = selectedItemObj.ltp;
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ltp >= obj.price &&
          obj.operationType == 'sell'
        ) {
          obj.price = selectedItemObj.ltp;
          // status = "executed"
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ltp < obj.price &&
          obj.operationType == 'sell'
        ) {
          status = 'open';
        }
        obj['time'] = getIST();
        obj['status'] = 'open';
        if (
          this.selectedWatchListSection == 'options' ||
          this.selectedWatchListSection == 'straddle' ||
          this.selectedWatchListSection == 'ironfly'
        )
          obj['quantity'] =
            this.totalBuyOrSellQty * this.selectedWatchListElement.lotSize;
        else obj['quantity'] = this.totalBuyOrSellQty;

        obj['symbol'] = selectedItemObj.symbol;
        obj['symbolId'] = selectedItemObj.symbolId;
        setTimeout(() => {
          this.selectedWatchListElement = null;
        }, 100);
        obj.userId = userId;
        obj.guid = this.generateUID();
        this.openOrderList.push(obj);
        let inputParam = {
          userId: userId,
          list: [obj],
        };

        let symbolVal: any = this.tradeService.allStockList.find(
          (s: any) => s.symbol == obj.symbol
        );
        if (symbolVal != undefined) {
          obj.symbolId = symbolVal.symbolId;
          obj.alias = symbolVal.alias;
          obj.expiry = symbolVal.expiry;
          obj.strike = symbolVal.strike;
          if (
            this.subscribedSymbols.find((s) => s == obj.symbol) == undefined
          ) {
            this.subscribedSymbols.push(obj.symbol);
          }
        }
        if (obj.rateType == 'market') {
          status = 'executed';
        }
        this.totalOrderList.push(obj);
        this.loading = true;
        this.getTradeSocket().send(
          `{ "method" : "addtrade", "data":` + JSON.stringify([obj]) + `}`
        );
        this.tradeService.buyOrSell(inputParam).subscribe(
          (data: any) => {
            this.getOrderList();
          },
          (err: any) => {
            this.loading = false;
          }
        );
      }
    }
  }
  generateUID() {
    // I generate the UID from two parts here
    // to ensure the random number provide enough bits.
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    var _firstPart = ('000' + firstPart.toString(36)).slice(-3);
    var _secondPart = ('000' + secondPart.toString(36)).slice(-3);
    return _firstPart + _secondPart;
  }
  getTradeSocket() {
    if (this.tradeSocket === undefined) {
      this.tradeSocket = this.services.GetTradeSocketConn();
    }
    return this.tradeSocket;
  }
  placeTradeOrder(obj: any, userId?: number) {
    // console.log(this.selectedWatchListElement)
    obj.status = 'open';
    obj.strategy = this.selectedWatchListSection;
    obj.type = 'exit';
    obj.createdBy = this.authService.getUserId();
    let selectedItemObj: any = this.selectedWatchListElement;
    if (
      obj.rateType == 'limit' &&
      selectedItemObj.ltp <= obj.price &&
      obj.operationType == 'buy'
    ) {
      obj.price = selectedItemObj.ltp;
      // status = "executed"
    } else if (
      obj.rateType == 'limit' &&
      selectedItemObj.ltp > obj.price &&
      obj.operationType == 'buy'
    ) {
    } else if (
      obj.rateType == 'slm' &&
      selectedItemObj.ltp == obj.triggerPrice
    ) {
      // status = "executed"
      obj['price'] = obj.triggerPrice;
    } else if (
      obj.rateType == 'slm' &&
      (selectedItemObj.ltp < obj.triggerPrice ||
        selectedItemObj.ltp > obj.triggerPrice)
    ) {
      obj.status = 'open';
      obj['price'] = obj.triggerPrice;
    } else if (obj.rateType == 'market') {
      obj['price'] = selectedItemObj.ltp;
    } else if (
      obj.rateType == 'limit' &&
      selectedItemObj.ltp >= obj.price &&
      obj.operationType == 'sell'
    ) {
      obj.price = selectedItemObj.ltp;
      // status = "executed"
    } else if (
      obj.rateType == 'limit' &&
      selectedItemObj.ltp < obj.price &&
      obj.operationType == 'sell'
    ) {
      // obj.status = 'open';
    }
    obj.expiry = selectedItemObj.expiry;
    obj['time'] = getIST();
    // obj['status'] = 'open';
    if (
      obj.strategy == 'options' ||
      obj.strategy == 'straddle' ||
      obj.strategy == 'ironfly'
    )
      obj['quantity'] =
        this.totalBuyOrSellQty * this.selectedWatchListElement.lotSize;
    else obj['quantity'] = this.totalBuyOrSellQty;

    obj.symbol = selectedItemObj.symbol;

    setTimeout(() => {
      this.selectedWatchListElement = null;
    }, 100);
    obj.userId = userId;
    obj.guid = this.generateUID();

    // if (obj.rateType == 'market') {
    //   obj.status = 'executed';
    // }

    obj.userId = userId;
    obj.guid = this.generateUID();
    this.openOrderList.push(obj);
    let inputParam = {
      userId: userId,
      createdBy:obj.createdBy,
      list: [
        {
          symbol: obj.symbol,
          strike: selectedItemObj.strike,
          expiry: obj.expiry,
          orderType: obj.orderType,
          quantity: obj.quantity,
          price: obj.price,
          triggerPrice: obj.triggerPrice,
          rateType: obj.rateType,
          status: obj.status,
          time: obj.time,
          operationType: obj.operationType,
          guid: obj.guid,
          strategy: obj.strategy,
          callPutFut: obj.callPutFut,
          type:obj.type
        },
      ],
    };

    let symbolVal: any = this.tradeService.allStockList.find(
      (s: any) => s.symbol == obj.symbol
    );
    if (symbolVal != undefined) {
      obj.symbolId = symbolVal.symbolId;
      obj.alias = selectedItemObj.alias;
      obj.expiry = selectedItemObj.expiry;
      obj.strike = selectedItemObj.strike;
      if (this.subscribedSymbols.find((s) => s == obj.symbol) == undefined) {
        this.subscribedSymbols.push(obj.symbol);
      }
    }

    this.getTradeSocket().send(
      `{ "method" : "addtrade", "data":` + JSON.stringify(inputParam.list) + `}`
    );
    // if (obj.rateType == 'market') {
    //   obj.status = 'executed';
    // }
    this.totalOrderList.push(obj);
    // this.loading = true;
    this.tradeService.buyOrSell(inputParam).subscribe(
      (data: any) => {
        this.getOrderList();
      },
      (err: any) => {
        this.loading = false;
      }
    );
  }

  getOrderList() {
    this.tradeService.allTrades(this.selectedDate, undefined).subscribe(
      (data: any) => {
        let symbols: any[] = [];
        data = data.filter((d: any) => d.status == 'executed');

        data.forEach((v: any) => {
          if (v.strategy == 'straddle' || v.strategy == 'ironfly') {
            var symbol = `${
              this.stockList.find((s: any) => s.displayName == v.symbol).name
            }${moment(v.expiry).format('YYMMDD').toUpperCase()}${v.strike}CE`;
            if (!symbols.some((s) => s == symbol)) symbols.push(symbol);

            symbol = `${
              this.stockList.find((s: any) => s.displayName == v.symbol).name
            }${moment(v.expiry).format('YYMMDD').toUpperCase()}${v.strike}PE`;
            if (!symbols.some((s) => s == symbol)) symbols.push(symbol);
          } else {
            if (!symbols.some((s) => s == v.symbol)) symbols.push(v.symbol);
          }
        });

        let newSymbols = symbols.filter(
          (x) => !this.tradeService.allStockList.some((s) => s.symbol == x)
        );
        if (newSymbols.length > 0) {
          this.strikeService
            .getSymbolsDetails(newSymbols)
            .subscribe((res: any) => {
              res.forEach((element: any) => {
                if (
                  this.tradeService.allStockList.find((s) => s == element) ==
                  undefined
                )
                  this.tradeService.allStockList.push(element);
              });
              localStorage.setItem(
                'allStockList',
                this.encService.encrypt(
                  JSON.stringify(this.tradeService.allStockList)
                )
              );
            });
        }

        data.forEach((v: any) => {
          if (v.strategy == 'straddle') {
            v.alias = `${
              this.stockList.find((s: any) => s.displayName == v.symbol).name
            } ${moment(v.expiry).format('MMM').toUpperCase()} ${v.strike} SD`;
          } else if (v.strategy == 'ironfly') {
            v.alias = `${
              this.stockList.find((s: any) => s.displayName == v.symbol).name
            } ${moment(v.expiry).format('MMM').toUpperCase()} ${v.strike} IF`;
          } else {
            let symbolVal: any = this.tradeService.allStockList.find(
              (s: any) => s.symbol == v.symbol
            );
            if (symbolVal != undefined) {
              v.symbolId = symbolVal.symbolId;
              v.alias = symbolVal.alias;
              v.expiry = symbolVal.expiry;
              v.strike = symbolVal.strike;
              if (
                this.subscribedSymbols.find((s) => s == v.symbol) == undefined
              ) {
                this.subscribedSymbols.push(v.symbol);
              }
            }
          }
        });

        const filterorderListBasedOnSymbol: any = [
          ...new Set(data.map((item: any) => item.symbol)),
        ];
        data
          .filter((x: any) => x.strategy == 'straddle')
          .forEach((order: any) => {
            order.ceSymbol = `${
              this.stockList.find((s: any) => s.displayName == order.symbol)
                .name
            }${moment(order.expiry).format('YYMMDD')}${order.strike}CE`;
            order.peSymbol = `${
              this.stockList.find((s: any) => s.displayName == order.symbol)
                .name
            }${moment(order.expiry).format('YYMMDD')}${order.strike}PE`;

            if (
              !filterorderListBasedOnSymbol.some(
                (s: any) => s == order.ceSymbol
              )
            ) {
              filterorderListBasedOnSymbol.push(order.ceSymbol);
            }
            if (
              !filterorderListBasedOnSymbol.some(
                (s: any) => s == order.peSymbol
              )
            ) {
              filterorderListBasedOnSymbol.push(order.peSymbol);
            }
          });
        data
          .filter((x: any) => x.strategy == 'ironfly')
          .forEach((order: any) => {
            let strikes = [];
            if (order.symbol == 'NIFTY 50') strikes = this.niftyStrikes;
            else if (order.symbol == 'NIFTY BANK')
              strikes = this.bankNiftyStrikes;
            else if (order.symbol == 'NIFTY FIN SERVICE')
              strikes = this.finNiftyStrikes;
            let strikeIndex = strikes.findIndex((s: any) => s == order.strike);
            order.symbol1 = `${
              this.stockList.find((s: any) => s.displayName == order.symbol)
                .name
            }${moment(order.expiry).format('YYMMDD')}${order.strike}CE`;
            order.symbol2 = `${
              this.stockList.find((s: any) => s.displayName == order.symbol)
                .name
            }${moment(order.expiry).format('YYMMDD')}${order.strike}PE`;
            order.symbol3 = `${
              this.stockList.find((s: any) => s.displayName == order.symbol)
                .name
            }${moment(order.expiry).format('YYMMDD')}${
              strikes[strikeIndex + 2]
            }CE`;
            order.symbol4 = `${
              this.stockList.find((s: any) => s.displayName == order.symbol)
                .name
            }${moment(order.expiry).format('YYMMDD')}${
              strikes[strikeIndex - 2]
            }PE`;

            if (
              !filterorderListBasedOnSymbol.some((s: any) => s == order.symbol1)
            ) {
              filterorderListBasedOnSymbol.push(order.symbol1);
            }
            if (
              !filterorderListBasedOnSymbol.some((s: any) => s == order.symbol2)
            ) {
              filterorderListBasedOnSymbol.push(order.symbol2);
            }
            if (
              !filterorderListBasedOnSymbol.some((s: any) => s == order.symbol3)
            ) {
              filterorderListBasedOnSymbol.push(order.symbol3);
            }
            if (
              !filterorderListBasedOnSymbol.some((s: any) => s == order.symbol4)
            ) {
              filterorderListBasedOnSymbol.push(order.symbol4);
            }
          });
        if (filterorderListBasedOnSymbol.length > 0) {
          this.subscribeSymbols(filterorderListBasedOnSymbol);
          this.strikeService
            .getLiveTouchLine(filterorderListBasedOnSymbol)
            .subscribe((__touchline: any) => {
              let _touchline = __touchline.data;
              data
                .filter((x: any) => x.strategy == 'straddle')
                .forEach((order: any) => {
                  order.ceSymbolId = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.ceSymbol
                  )?.symbolId;

                  order.peSymbolId = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.peSymbol
                  )?.symbolId;
                  order.ceLtp = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.ceSymbol
                  )?.ltp;
                  order.peLtp = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.peSymbol
                  )?.ltp;

                  order.ltp = order.ceLtp + order.peLtp;
                });

              data
                .filter((x: any) => x.strategy == 'ironfly')
                .forEach((order: any) => {
                  order.symbol1Id = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol1
                  )?.symbolId;
                  order.symbol2Id = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol2
                  )?.symbolId;
                  order.symbol3Id = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol3
                  )?.symbolId;
                  order.symbol4Id = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol4
                  )?.symbolId;

                  order.ltp1 = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol1
                  )?.ltp;
                  order.ltp2 = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol2
                  )?.ltp;
                  order.ltp3 = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol3
                  )?.ltp;
                  order.ltp4 = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol4
                  )?.ltp;

                  order.ltp = order.ltp1 + order.ltp2 - order.ltp3 - order.ltp4;
                });

              data
                .filter((x: any) => x.strategy == 'options')
                .forEach((order: any) => {
                  order.ltp = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol
                  )?.ltp;
                  order.symbolId = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol
                  )?.symbolId;
                });

              var result: any = [];

              if (this.categorizaton == 'symbols') {
                let positionList = this.newPositionListData(data);
                result.push({
                  openOrderlist: data.filter((v: any) => v.status == 'open'),
                  orderList: data.filter((v: any) => v.status == 'executed'),
                  userId: undefined,
                  positionList: positionList,
                });
                this.allPositions = result;
              } else {
                var grpedOrders = _.groupBy(data, 'userId');
                _.map(grpedOrders, (orders, userId) => {
                  let orderList = orders.filter(
                    (t: any) => t.status == 'executed'
                  );
                  let positionList = this.newPositionListData(orderList);

                  result.push({
                    openOrderlist: orders.filter(
                      (v: any) => v.status == 'open'
                    ),
                    orderList: orderList,
                    userId: userId,
                    walletBalance: orders[0].walletBalance,
                    positionList: positionList,
                  });
                });

                // console.log(result)
                this.allPositions = result;
              }
            });
        }

        // this.totalOrderList = data;
        // // this.getTradeOrders()

        // this.openOrderList = data.filter((v: any) => v.status == 'open');

        // this.orderList = data.filter((t: any) => t.status == 'executed');

        // const filterorderListBasedOnSymbol = [
        //   ...new Set(this.orderList.map((item: any) => item.symbol)),
        // ];
        // this.orderList
        //   .filter((x: any) => x.strategy == 'straddle')
        //   .forEach((order: any) => {
        //     order.ceSymbol = `${
        //       this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //     }${moment(order.expiry).format('YYMMDD')}${order.strike}CE`;
        //     order.peSymbol = `${
        //       this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //     }${moment(order.expiry).format('YYMMDD')}${order.strike}PE`;

        //     if (
        //       !filterorderListBasedOnSymbol.some((s) => s == order.ceSymbol)
        //     ) {
        //       filterorderListBasedOnSymbol.push(order.ceSymbol);
        //     }
        //     if (
        //       !filterorderListBasedOnSymbol.some((s) => s == order.peSymbol)
        //     ) {
        //       filterorderListBasedOnSymbol.push(order.peSymbol);
        //     }
        //   });
        // if (filterorderListBasedOnSymbol.length > 0) {
        //   this.subscribeSymbols(filterorderListBasedOnSymbol);
        //   this.strikeService
        //     .getTouchLine(filterorderListBasedOnSymbol)
        //     .subscribe((_touchline: any) => {
        //       this.orderList
        //         .filter((x: any) => x.strategy == 'straddle')
        //         .forEach((order: any) => {
        //           order.ceSymbolId = _touchline.find(
        //             (t: ITouchlineDetails) => t.symbol == order.ceSymbol
        //           )?.symbolId;

        //           order.peSymbolId = _touchline.find(
        //             (t: ITouchlineDetails) => t.symbol == order.peSymbol
        //           )?.symbolId;
        //           order.ceLtp = _touchline.find(
        //             (t: ITouchlineDetails) => t.symbol == order.ceSymbol
        //           )?.ltp;
        //           order.peLtp = _touchline.find(
        //             (t: ITouchlineDetails) => t.symbol == order.peSymbol
        //           )?.ltp;

        //           order.ltp = order.ceLtp + order.peLtp;
        //         });
        //       this.orderList
        //         .filter((x: any) => x.strategy != 'straddle')
        //         .forEach((order: any) => {
        //           order.ltp = _touchline.find(
        //             (t: ITouchlineDetails) => t.symbol == order.symbol
        //           )?.ltp;
        //           order.symbolId = _touchline.find(
        //             (t: ITouchlineDetails) => t.symbol == order.symbol
        //           )?.symbolId;
        //         });

        //       this.positionList = this.newPositionListData(this.orderList);
        //     });
        // }
        //  else {
        //   this.getPositionListData()
        // }
      },
      () => {},
      () => {}
    );
  }

  newPositionListData(_orderList: any[]) {
    let orders: any = [];
    let masterPositionList: any = [];
    let grped = _.groupBy(_orderList, 'orderType');
    _.map(grped, (values, key) => {
      orders.push({ orderType: key, orders: values });
    });

    orders.forEach((ord: any) => {
      let positionList: any = [];

      const filteroderListBasedOnSymbol = ord.orders
        .map(
          (item: any) => `${item.alias}-${moment(item.expiry).format('DDMMYY')}`
        )
        .filter(onlyUnique);

      // setTimeout(() => {
      filteroderListBasedOnSymbol.forEach((v: any) => {
        let totalQty = 0;
        let netValue = 0;
        // let symbolVal: any = this.tradeService.allStockList.find((s: any) => s.symbol == v);
        // if (symbolVal != undefined) {
        let obj: any = {
          symbol: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol,
          ceSymbol: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceSymbol,
          ceSymbolId: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceSymbolId,
          peSymbol: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peSymbol,
          peSymbolId: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peSymbolId,
          ceLtp: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceLtp,
          peLtp: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peLtp,
          symbolId: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbolId,
          symbol1: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol1,
          symbol1Id: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol1Id,
          ltp1: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp1,
          symbol2: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol2,
          symbol2Id: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol2Id,
          ltp2: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp2,
          symbol3: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol3,
          symbol3Id: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol3Id,
          ltp3: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp3,
          symbol4: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol4,
          symbol4Id: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol4Id,
          ltp4: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp4,
          distinguisher: v,
        };

        let filterOrder = ord.orders.filter(
          (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
        );
        filterOrder.forEach((h: any) => {
          let cal = h.quantity * h.price;
          if (h.operationType == 'buy') {
            totalQty = totalQty + h.quantity;
            netValue = netValue + cal;
          } else if (h.operationType == 'sell') {
            totalQty = totalQty - h.quantity;
            netValue = netValue - cal;
          }
          obj.orderType = h.orderType;
          obj.ltp = h.ltp;
          // obj.alias = this.tradeService.allStockList.find(
          //   (s) => s.symbol == obj.symbol
          // )?.alias;
          obj.alias = h.alias;
          obj.expiry = h.expiry;
          obj.strike = h.strike;
          // obj.expiry = this.tradeService.allStockList.find(
          //   (s) => s.symbol == obj.symbol
          // )?.expiry;
          // obj.strike = this.tradeService.allStockList.find(
          //   (s) => s.symbol == obj.symbol
          // )?.strike;
          obj.strategy = h.strategy;
        });
        obj.quantity = totalQty;
        obj.selectedQuantity = totalQty;

        if (totalQty != 0) {
          obj.avg = netValue / totalQty;
          obj.pandl = (parseFloat(obj.ltp) - obj.avg) * obj.quantity;
        } else {
          obj.avg = 0;
          obj.pandl = -1 * netValue;
        }

        let positionIndex = positionList.findIndex(
          (m: any) => m.distinguisher == v
        );

        if (positionIndex >= 0) {
          obj.id = positionList[positionIndex]['id'];
          positionList[positionIndex] = obj;
        } else {
          positionList.push(obj);
        }
        // console.log(positionList, positionIndex,v)

        // }
      });

      masterPositionList.push(...positionList);
    });

    let finalPositions: any = masterPositionList.filter(
      (p: any) => p.strategy == 'options'
    );
    let ironFlyPositions = masterPositionList.filter(
      (p: any) => p.strategy == 'ironfly'
    );
    let grpdIronFlyPositions = _.groupBy(ironFlyPositions, 'distinguisher');

    _.map(grpdIronFlyPositions, (values, key) => {
      finalPositions.push({
        alias: `${values[0].alias.slice(0, values[0].alias.length - 3)} IF`,
        avg: _.sum(values.map((x) => x.avg)),
        expiry: values[0].expiry,
        ltp: _.sum(values.map((x) => x.ltp)),
        orderType: values[0].orderType,
        pandl: _.sum(values.map((x) => x.pandl)),
        quantity: values[0].quantity,
        selectedQuantity: values[0].quantity,
        strategy: values[0].strategy,
        strike: values[0].strike,
        symbol: values[0].symbol,
        symbol1Id: values[0].symbol1Id,
        symbol2Id: values[0].symbol2Id,
        symbol3Id: values[0].symbol3Id,
        symbol4Id: values[0].symbol4Id,
        symbol1: values[0].symbol1,
        symbol2: values[0].symbol2,
        symbol3: values[0].symbol3,
        symbol4: values[0].symbol4,
        ltp1: values[0].ltp1,
        ltp2: values[0].ltp2,
        ltp3: values[0].ltp3,
        ltp4: values[0].ltp4,
      });
    });
    let straddlePositions = masterPositionList.filter(
      (p: any) => p.strategy == 'straddle'
    );
    let grpdStraddlePositions = _.groupBy(straddlePositions, 'distinguisher');

    _.map(grpdStraddlePositions, (values, key) => {
      finalPositions.push({
        alias: `${values[0].alias.slice(0, values[0].alias.length - 3)} SD`,
        avg: _.sum(values.map((x) => x.avg)),
        expiry: values[0].expiry,
        ltp: _.sum(values.map((x) => x.ltp)),
        orderType: values[0].orderType,
        pandl: _.sum(values.map((x) => x.pandl)),
        quantity: values[0].quantity,
        selectedQuantity: values[0].quantity,
        strategy: values[0].strategy,
        strike: values[0].strike,
        symbol: values[0].symbol,
        ceSymbolId: values[0].ceSymbolId,
        peSymbolId: values[0].peSymbolId,
        ceSymbol: values[0].ceSymbol,
        peSymbol: values[0].peSymbol,
        ceLtp: values[0].ceLtp,
        peLtp: values[0].peLtp,
      });
    });

    finalPositions.sort(predicateBy('alias'));
    return finalPositions;
  }
  subscribeSymbols(symbols: string[]) {
    this.getSocket()?.send(
      `{ "method" : "addsymbol", "symbols" : ` + JSON.stringify(symbols) + `}`
    );
  }
  socket: any;

  getSocket() {
    if (this.socket === undefined) {
      this.socket = this.services.GetTradeSocketConn();
      this.socket?.on('message', (e: any) => {
        this.socketMessageListener(e);
      });
      this.socket?.on('disconnect', () => {
        this.socket = undefined;
      });
      this.socket?.on('reconnect', () => {});
      // this.socket?.on("ack", () => {
      //   this.refreshData()
      // });
    }
    return this.socket;
  }
  socketMessageListener(e: any) {
    var dataVal = JSON.parse(e);
    this.handleData(dataVal);
  }
  getpnlsum(positionList: any, data: any) {
    var pandl = _.sum(
      positionList.map((x: any) => {
        return x.pandl;
      })
    );
    data.pandl = pandl;
    data.totalQty = _.sum(
      positionList.map((x: any) => {
        return x.quantity;
      })
    );
    return pandl;
  }

  handleData(data: any) {
    if (data.trade != undefined) {
      let trade = data.trade;
      let symbolId = Number(trade[0]);
      this.allPositions.forEach((data: any) => {
        data.positionList?.forEach((pos: any) => {
          if (pos.symbolId == symbolId) {
            let totalQty = 0;
            let netValue = 0;
            pos.ltp = trade[2];
            let filterOrder = data.orderList.filter(
              (s: any) => s.symbol == pos.symbol
            );
            filterOrder.forEach((h: any) => {
              let cal = h.quantity * h.price;
              if (h.operationType == 'buy') {
                totalQty = totalQty + h.quantity;
                netValue = netValue + cal;
              } else if (h.operationType == 'sell') {
                totalQty = totalQty - h.quantity;
                netValue = netValue - cal;
              }
            });
            if (totalQty != 0) {
              // pos.avg = netValue / totalQty;
              pos.pandl = (pos.ltp - pos.avg) * pos.quantity;
            } else {
              // pos.avg = 0;
              pos.pandl = -1 * netValue;
            }
          } else if (pos.ceSymbolId == symbolId) {
            let totalQty = 0;
            let netValue = 0;
            pos.ceLtp = Number(trade[2]);
            pos.ltp = pos.peLtp + pos.ceLtp;
            let filterOrder = data.orderList.filter(
              (s: any) => s.alias == pos.alias
            );
            filterOrder.forEach((h: any) => {
              let cal = h.quantity * h.price;
              if (h.operationType == 'buy') {
                totalQty = totalQty + h.quantity;
                netValue = netValue + cal;
              } else if (h.operationType == 'sell') {
                totalQty = totalQty - h.quantity;
                netValue = netValue - cal;
              }
            });
            // console.log(pos.alias,totalQty, netValue)

            if (totalQty != 0) {
              pos.avg = netValue / totalQty;
              pos.pandl = (pos.ltp - pos.avg) * pos.quantity;
            } else {
              pos.avg = 0;
              pos.pandl = -1 * netValue;
            }
          } else if (pos.peSymbolId == symbolId) {
            let totalQty = 0;
            let netValue = 0;
            pos.peLtp = Number(trade[2]);
            pos.ltp = pos.peLtp + pos.ceLtp;
            let filterOrder = data.orderList.filter(
              (s: any) => s.alias == pos.alias
            );
            filterOrder.forEach((h: any) => {
              let cal = h.quantity * h.price;
              if (h.operationType == 'buy') {
                totalQty = totalQty + h.quantity;
                netValue = netValue + cal;
              } else if (h.operationType == 'sell') {
                totalQty = totalQty - h.quantity;
                netValue = netValue - cal;
              }
            });
            if (totalQty != 0) {
              // pos.avg = netValue / totalQty;
              pos.pandl = (pos.ltp - pos.avg) * pos.quantity;
            } else {
              // pos.avg = 0;
              pos.pandl = -1 * netValue;
            }
          }
        });
      });
    }
  }
  cancel() {
    this.selectedWatchListElement = null;
    this.buyOrSellModel.sell = false;
  }
  sortChange(event: any) {
    var value = event.target.value;

    switch (value) {
      case 'userId-asc': {
        this.allPositions.sort(predicateBy('userId'));
        break;
      }
      case 'userId-desc': {
        this.allPositions.sort(predicateByDesc('userId'));
        break;
      }
      case 'totalQty-asc': {
        this.allPositions.sort(predicateBy('totalQty'));
        break;
      }
      case 'totalQty-desc': {
        this.allPositions.sort(predicateByDesc('totalQty'));
        break;
      }
      case 'pandl-asc': {
        this.allPositions.sort(predicateBy('pandl'));
        break;
      }
      case 'pandl-desc': {
        this.allPositions.sort(predicateByDesc('pandl'));
        break;
      }
    }
  }
  categorizaton = 'positions';
  categoryChange(event: any) {
    var value = event.target.value;
    this.categorizaton = value;
    this.getOrderList();
  }
}
