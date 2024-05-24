import { Component } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getIST } from '../services/utils';
import * as moment from 'moment';
import { StrikeService } from '../services/strike.service';
import { EncService } from '../services/enc.service';
import {
  ITouchlineDetails,
  onlyUnique,
  predicateBy,
} from '../models/trade.model';
import { ServiceService } from '../services/service.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-all-positions-symbolwise',
  templateUrl: './all-positions-symbolwise.component.html',
  styleUrls: ['./all-positions-symbolwise.component.css'],
})
export class AllPositionsSymbolwiseComponent {
  allPositions: any = [];
  selectedDate: Date = getIST();
  stockList: any = [];
  subscribedSymbols: any[] = [];
  niftyStrikes: any = [];
  finNiftyStrikes: any = [];
  bankNiftyStrikes: any = [];
  loading = true;
  constructor(
    private tradeService: TradeService,
    private strikeService: StrikeService,
    private authService: AuthService,
    private encService: EncService,
    private services: ServiceService,
    private router: Router
  ) {
    if (!(this.authService.isAdminUser())) this.router.navigateByUrl('/');
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

        //#region  IRON FLY
        //###iron fly disonnected as of now

        // data.filter((x: any) => x.strategy == 'ironfly')
        //   .forEach((order: any) => {
        //     let strikes = [];
        //     if (order.symbol == 'NIFTY 50') strikes = this.niftyStrikes;
        //     else if (order.symbol == 'NIFTY BANK')
        //       strikes = this.bankNiftyStrikes;
        //     else if (order.symbol == 'NIFTY FIN SERVICE')
        //       strikes = this.finNiftyStrikes;
        //     let strikeIndex = strikes.findIndex((s: any) => s == order.strike);
        //     order.symbol1 = `${this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //       }${moment(order.expiry).format('YYMMDD')}${order.strike}CE`;
        //     order.symbol2 = `${this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //       }${moment(order.expiry).format('YYMMDD')}${order.strike}PE`;
        //     order.symbol3 = `${this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //       }${moment(order.expiry).format('YYMMDD')}${strikes[strikeIndex + 2]
        //       }CE`;
        //     order.symbol4 = `${this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //       }${moment(order.expiry).format('YYMMDD')}${strikes[strikeIndex - 2]
        //       }PE`;

        //     if (!filterorderListBasedOnSymbol.some((s: any) => s == order.symbol1)) {
        //       filterorderListBasedOnSymbol.push(order.symbol1);
        //     }
        //     if (!filterorderListBasedOnSymbol.some((s: any) => s == order.symbol2)) {
        //       filterorderListBasedOnSymbol.push(order.symbol2);
        //     }
        //     if (!filterorderListBasedOnSymbol.some((s: any) => s == order.symbol3)) {
        //       filterorderListBasedOnSymbol.push(order.symbol3);
        //     }
        //     if (!filterorderListBasedOnSymbol.some((s: any) => s == order.symbol4)) {
        //       filterorderListBasedOnSymbol.push(order.symbol4);
        //     }
        //   });

        //#endregion

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

              //#region  IRON FLY
              // data.filter((x: any) => x.strategy == 'ironfly')
              //   .forEach((order: any) => {
              //     order.symbol1Id = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol1
              //     )?.symbolId;
              //     order.symbol2Id = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol2
              //     )?.symbolId;
              //     order.symbol3Id = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol3
              //     )?.symbolId;
              //     order.symbol4Id = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol4
              //     )?.symbolId;

              //     order.ltp1 = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol1
              //     )?.ltp;
              //     order.ltp2 = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol2
              //     )?.ltp;
              //     order.ltp3 = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol3
              //     )?.ltp;
              //     order.ltp4 = _touchline.find(
              //       (t: ITouchlineDetails) => t.symbol == order.symbol4
              //     )?.ltp;

              //     order.ltp =
              //       order.ltp1 +
              //       order.ltp2 -
              //       order.ltp3 -
              //       order.ltp4;
              //   });

              //#endregion IRON FLY

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

              let positionList = this.newPositionListData(data);
              result.push({
                // openOrderlist: data.filter(
                //   (v: any) => v.status == 'open'
                // ),
                orderList: data.filter(
                  (v: any) => v.status == 'executed'
                ),
                // userId: undefined,
                positionList: positionList,
              });
              this.allPositions = result;
              // console.log(result);
            });
        }
      },
      () => {},
      () => {
        this.loading = false;
      }
    );
  }
  getTotals() {
    if (this.allPositions?.length>0) {
    // console.log(  this.allPositions[0].positionList
    //   .filter((x: any) => x.strategy != 'straddle' && x.ceSymbolId)
    //   .map((_x: any) => _x.quantity))
      return {
        sd: _.sum(
          this.allPositions[0].positionList
            .filter((x: any) => x.strategy == 'straddle')
            .map((x: any) => x.quantity)
        ),
        ce: _.sum(
          this.allPositions[0].positionList
            .filter((x: any) => x.strategy != 'straddle' && x.symbol.endsWith("CE"))
            .map((x: any) => x.quantity)
        ),
        pe: _.sum(
          this.allPositions[0].positionList
            .filter((x: any) => x.strategy != 'straddle' && x.symbol.endsWith("PE"))
            .map((x: any) => x.quantity)
        ),
      };
    }
    return {
      sd: 0,
      ce: 0,
      pe: 0,
    };
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

      masterPositionList.push(...positionList);
    });

    let finalPositions: any = masterPositionList.filter(
      (p: any) => p.strategy == 'options'
    );

    //#region IRON FLY
    // let ironFlyPositions = masterPositionList.filter(
    //   (p: any) => p.strategy == 'ironfly'
    // );
    // let grpdIronFlyPositions = _.groupBy(ironFlyPositions, 'distinguisher');

    // _.map(grpdIronFlyPositions, (values, key) => {
    //   finalPositions.push({
    //     alias: `${values[0].alias.slice(0, values[0].alias.length - 3)} IF`,
    //     avg: _.sum(values.map((x) => x.avg)),
    //     expiry: values[0].expiry,
    //     ltp: _.sum(values.map((x) => x.ltp)),
    //     orderType: values[0].orderType,
    //     pandl: _.sum(values.map((x) => x.pandl)),
    //     quantity: values[0].quantity,
    //     selectedQuantity: values[0].quantity,
    //     strategy: values[0].strategy,
    //     strike: values[0].strike,
    //     symbol: values[0].symbol,
    //     symbol1Id: values[0].symbol1Id,
    //     symbol2Id: values[0].symbol2Id,
    //     symbol3Id: values[0].symbol3Id,
    //     symbol4Id: values[0].symbol4Id,
    //     symbol1: values[0].symbol1,
    //     symbol2: values[0].symbol2,
    //     symbol3: values[0].symbol3,
    //     symbol4: values[0].symbol4,
    //     ltp1: values[0].ltp1,
    //     ltp2: values[0].ltp2,
    //     ltp3: values[0].ltp3,
    //     ltp4: values[0].ltp4,
    //   });
    // });

    //#endregion IRON FLY

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
    data.totalQty = _.sum(
      positionList.map((x: any) => {
        return x.quantity;
      })
    );
    return pandl;
  }
}
