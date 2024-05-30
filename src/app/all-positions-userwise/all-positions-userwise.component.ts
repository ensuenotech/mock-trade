import { Component } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { StrikeService } from '../services/strike.service';
import { AuthService } from '../services/auth.service';
import { EncService } from '../services/enc.service';
import { ServiceService } from '../services/service.service';
import { Router } from '@angular/router';
import { getIST } from '../services/utils';
import * as moment from 'moment';
import {
  ITouchlineDetails,
  buyAndSellStock,
  onlyUnique,
  predicateBy,
  predicateByDesc,
} from '../models/trade.model';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-all-positions-userwise',
  templateUrl: './all-positions-userwise.component.html',
  styleUrls: ['./all-positions-userwise.component.css'],
})
export class AllPositionsUserwiseComponent {
  allPositions: any = [];
  selectedDate: Date = getIST();
  stockList: any = [];
  subscribedSymbols: any[] = [];
  niftyStrikes: any = [];
  finNiftyStrikes: any = [];
  bankNiftyStrikes: any = [];
  loading = false;
  constructor(
    private tradeService: TradeService,
    private strikeService: StrikeService,
    private authService: AuthService,
    private encService: EncService,
    private services: ServiceService,
    private router: Router
  ) {
    if (!(this.authService.isAdminUser() || this.authService.isManager()))
      this.router.navigateByUrl('/');
  }
  ngOnInit() {
    this.strikeService.getStocks().subscribe((res: any) => {
      this.stockList = res;

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

      this.getOrderList();
    });
  }
  getOrderList() {
    this.tradeService.allTrades( undefined).subscribe(
      (data: any) => {
        let symbols: any[] = [];
        data = data.filter((d: any) => d.status == 'executed');

        data.forEach((v: any) => {
          v.lotSizeSymbol = v.symbol;
          if (v.strategy == 'straddle' || v.strategy == 'ironfly') {
            var symbol = `${
              this.stockList.find((s: any) => s.displayName == v.symbol).name
            }${moment(v.expiry).format('YYMMDD').toUpperCase()}${v.strike}CE`;

            v.lotSizeSymbol = symbol;

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

          v.lotSize = this.tradeService.allStockList.find(
            (s: any) => s.symbol == v.lotSizeSymbol
          )?.lotSize;
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
                .filter((x: any) => x.strategy == 'options')
                .forEach((order: any) => {
                  order.ltp = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol
                  )?.ltp;
                  order.symbolId = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol
                  )?.symbolId;
                });

              // var result: any = [];

              let positionList = this.newPositionListData(data);

              // result.push({
              //   // openOrderlist: data.filter(
              //   //   (v: any) => v.status == 'open'
              //   // ),
              //   orderList: positionList.orders,
              //   walletBalance: positionList.walletBalance,
              //   userId: positionList.userId,
              //   positionList: positionList.positions,
              //   showPositions: false,
              // });
              this.allPositions = positionList;
              this.allPositions.forEach((element: any) => {
                element.pandl = this.getpnlsum(element.positionList, element);
              });
              this.allPositions.sort(predicateByDesc('positionsLength'));
            });
        }
      },
      () => {},
      () => {
        this.loading = false;
      }
    );
  }
  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  handleSort(orderBy: any, event: any) {
    event.target.children[0].classList.toggle('fa-caret-down');
    event.target.children[0].classList.toggle('fa-caret-up');
    const order = event.target.attributes['data-sort'].value;
    if (order === 'desc') {
      event.target.attributes['data-sort'].value = 'asc';
      this.allPositions.sort(predicateByDesc(orderBy));
    } else {
      event.target.attributes['data-sort'].value = 'desc';
      this.allPositions.sort(predicateBy(orderBy));
    }
  }
  async exitAll(_positions: any) {
    this.loading = true;

    let positions = _positions.positionList.filter((x: any) => x.quantity != 0);

    let totalCount = positions.length;

    for (var i = 0; i < totalCount; i++) {
      var totalqty = positions[i].quantity / positions[i].lotSize;
      positions[i].quantity = Math.ceil(totalqty) * positions[i].lotSize;
      this.exitOrderPlacement(positions[i], _positions.userId);
      await this.delay(1000);
    }
    this.loading = false;
    setTimeout(() => {
      this.getOrderList();
    }, 1000);
    Swal.fire('Success', '', 'success');
  }
  newPositionListData(_orderList: any[]) {
    let masterPositionList: any = [];
    let grped = _.groupBy(_orderList, 'userId');
    _.map(grped, (orders, userId) => {
      let positionList: any = [];

      const filteroderListBasedOnSymbol = orders
        .map(
          (item: any) => `${item.alias}-${moment(item.expiry).format('DDMMYY')}`
        )
        .filter(onlyUnique);

      // setTimeout(() => {
      filteroderListBasedOnSymbol.forEach((v: any) => {
        //  if(userId=="2")console.log(orders.find(
        //   (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
        // ).lotSize)

        let totalQty = 0;
        let netValue = 0;
        // let symbolVal: any = this.tradeService.allStockList.find((s: any) => s.symbol == v);
        // if (symbolVal != undefined) {
        let obj: any = {
          symbol: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol,
          ceSymbol: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceSymbol,
          ceSymbolId: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceSymbolId,
          peSymbol: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peSymbol,
          peSymbolId: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peSymbolId,
          ceLtp: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceLtp,
          peLtp: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peLtp,
          symbolId: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbolId,
          symbol1: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol1,
          symbol1Id: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol1Id,
          ltp1: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp1,
          symbol2: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol2,
          symbol2Id: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol2Id,
          ltp2: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp2,
          symbol3: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol3,
          symbol3Id: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol3Id,
          ltp3: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp3,
          symbol4: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol4,
          symbol4Id: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol4Id,
          ltp4: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ltp4,
          distinguisher: v,
          lotSize: orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).lotSize,
        };

        let filterOrder = orders.filter(
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
          obj.lotSize = h.lotSize;
          obj.alias = h.alias;
          obj.expiry = h.expiry;
          obj.strike = h.strike;

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
      });

      let finalPositions = positionList.filter(
        (p: any) => p.strategy == 'options'
      );
      let straddlePositions = positionList.filter(
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
          lotSize: values[0].lotSize,
        });
      });

      masterPositionList.push({
        userId: userId,
        walletBalance: orders[0].walletBalance,
        trialAfter: orders[0].trialAfter,
        trialBy: orders[0].trialBy,
        profit: orders[0].profit,
        sl: orders[0].sl,
        positionList: finalPositions,
        orderList: orders,
        showPositions: false,
        positionsLength: finalPositions.filter((x: any) => x.quantity != 0)
          .length,
      });
      if (userId == '4302') console.log(orders[0].profit, orders);

      // orders.push({ userId: key, orders: values });
    });

    // finalPositions.sort(predicateBy('alias'));
    return masterPositionList;
  }

  subscribeSymbols(symbols: string[]) {
    this.getSocket()?.send(
      `{ "method" : "addsymbol", "symbols" : ` + JSON.stringify(symbols) + `}`
    );
  }

  //#region  Socket
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
  handleData(data: any) {
    if (data.trade != undefined) {
      let trade = data.trade;
      let symbolId = Number(trade[0]);

      this.allPositions.forEach((data: any) => {
        data.positionList.forEach((pos: any) => {
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
        data.pandl = this.getpnlsum(data.positionList, data);
      });
    }
  }
  //#endregion
  getpnlsum(positionList: any, data: any) {
    var pandl = _.sum(
      positionList.map((x: any) => {
        return x.pandl;
      })
    );
    data.pandl = pandl;

    data.pandlPercentage = (data.pandl * 100) / data.walletBalance;
    let ptotalQty = _.sum(
      positionList
        .filter((x: any) => x.quantity > 0)
        .map((x: any) => {
          return x.quantity;
        })
    );
    let ntotalQty = _.sum(
      positionList
        .filter((x: any) => x.quantity < 0)
        .map((x: any) => {
          return x.quantity;
        })
    );
    data.showExit = !(ptotalQty == 0 && ntotalQty == 0);

    //  data.showExit = positionList.filter((x: any) => {
    //          x.quantity!=0
    //       }).length>0
    //       console.log(positionList.filter((x: any) => {
    //         x.quantity!=0
    //      }))
    return pandl;
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
  exitOrderPlacement(position: any, userId: any) {
    debugger;
    var quotient = position.quantity / (position.lotSize * 20);
    var remainder = position.quantity % (position.lotSize * 20);
    remainder = remainder < 0 ? remainder * -1 : remainder;
    var guid = this.generateUID();
    for (var i = 1; i <= quotient; i++) {
      let obj = new buyAndSellStock();
      obj.alias = position.alias;
      obj.expiry = position.expiry;
      obj.strategy = position.strategy;
      obj.quantity =
        position.quantity > 0 ? position.quantity : -1 * position.quantity;
      obj.guid = `${guid}_${i}`;
      obj.isExitOrder = true;
      obj.operationType = position.quantity > 0 ? 'sell' : 'buy';
      obj.orderType = position.orderType;
      obj.price = position.ltp;
      obj.rateType = 'market';
      obj.sell = position.quantity > 0 ? true : false;
      obj.status = 'open';
      obj.symbol = position.symbol;
      obj.symbolId = position.symbolId;
      obj.userId = userId;
      obj.targetPrice = position.ltp;
      obj.strike = position.strike;
      obj.type = 'exit';
      obj.quantity = position.lotSize * 20;

      let inputParam = {
        userId: userId,
        createdBy: this.authService.getUserId(),
        list: [obj],
      };
      this.getSocket().send(
        `{ "method" : "addtrade", "data":` + JSON.stringify([obj]) + `}`
      );

      this.tradeService.buyOrSell(inputParam).subscribe(
        (data: any) => {
          this.getOrderList();
          //commenting getorderlist in order to fetch list outside
        },
        (err: any) => {
          // this.loading = false;
        }
      );
    }

    if (remainder > 0) {
      let robj = new buyAndSellStock();
      robj.alias = position.alias;
      robj.expiry = position.expiry;
      robj.strategy = position.strategy;
      robj.quantity =
        position.quantity > 0 ? position.quantity : -1 * position.quantity;
      robj.guid = `${guid}_0`;
      robj.isExitOrder = true;
      robj.operationType = position.quantity > 0 ? 'sell' : 'buy';
      robj.orderType = position.orderType;
      robj.price = position.ltp;
      robj.rateType = 'market';
      robj.sell = position.quantity > 0 ? true : false;
      robj.status = 'open';
      robj.symbol = position.symbol;
      robj.symbolId = position.symbolId;
      robj.userId = userId;
      robj.targetPrice = position.ltp;
      robj.strike = position.strike;
      robj.type = 'exit';
      robj.quantity = remainder;
      let inputParam = {
        userId: userId,
        createdBy: this.authService.getUserId(),
        list: [robj],
      };

      this.getSocket().send(
        `{ "method" : "addtrade", "data":` + JSON.stringify([robj]) + `}`
      );

      this.tradeService.buyOrSell(inputParam).subscribe(
        (data: any) => {
          // this.loading = false;
          this.getOrderList();
        },
        (err: any) => {
          // this.loading = false;
        }
      );
    }
  }
  getColor(data: any) {
    var colors = 'bg-white text-gray-500';
    if (data.pandlPercentage >= 15) return 'bg-green-500 text-white';
    if (data.pandlPercentage > data.profit) return 'bg-green-500 text-white';
    if (data.pandlPercentage < data.sl) return 'bg-red-500 text-white';
    return colors;
  }
}
