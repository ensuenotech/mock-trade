import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import * as moment from 'moment/moment';
import * as _ from 'lodash';
// import { Guid } from 'guid-typescript/dist/guid';
import {
  buyAndSellStock,
  IEditOrderRequest,
  IGetOrder,
  IGetPosition,
  IMarginCalculationRequest,
  ISymbolDetails,
  ITouchlineDetails,
  ITradeRequest,
  onlyUnique,
  predicateBy,
  predicateByDesc,
  transactionType,
} from '../models/trade.model';
import { ServiceService } from '../services/service.service';
import { UserService } from '../services/user.service';
import { getIST, parseJwt } from '../services/utils';

import { TradeService } from '../services/trade.service';
import { EncService } from '../services/enc.service';
import { StrikeService } from '../services/strike.service';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { data } from 'jquery';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css'],
})
export class TradeComponent implements OnInit {
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    // Update the variable when the window is resized
    this.updateVariableBasedOnWindowSize();
  }

  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  buyOrSellModel = new buyAndSellStock();
  loading: boolean = false;
  userId: any = 0;
  stockList: any = [];
  // AllstockList = []
  selectedWatchListSection = 'straddle';
  selectedSection = 'orders';
  searchControl = new FormControl();
  tradeList: any = [];
  showSearchList: boolean = false;
  mocktradeList: any = [];
  // mocktradeListWatchlist: any = [];
  mocktradeListWatchlist: any = [];
  mocktradeListStraddle: any = [];
  mocktradeListIronfly: any = [];
  mocktradeListOptions: any = [];
  pageNumber: number = 1;
  watchListSize: number = 5;
  watchListArray: Array<number> = [];
  positionList: any = [];
  orderListDisplay: any = [];
  orderList: Array<object> = [];
  // socket: any;
  tradeSocket: any;
  subscribedSymbols: any[] = [];
  totalBuyOrSellQty: number = 0;
  selectedWatchListElement: any = undefined;
  // isChecked: boolean = false;
  showMarketDepthList?: number = undefined;
  marketStartTime: number = 915;
  marketCloseTime: number = 1530;
  openOrderList: any = [];
  totalOrderList: any = [];
  showMoreOption = false;
  showMoreOptionForPosition = false;
  walletBalance = 0;
  dayStartWalletBalance = 0;
  pandldata: any = [];
  brokerage: number = 0;
  buyingAmount: number = 0;
  sellingAmount: number = 0;
  sortState: any = [
    { column: 'symbol', state: 'asc' },
    { column: 'changePercentage', state: 'asc' },
    { column: 'ltp', state: 'asc' },
  ];
  finniftyExpiries: any = [];
  bankNiftyExpiries: any = [];
  midCPNiftyExpiries: any = [];
  niftyStrikes: any = [];
  finNiftyStrikes: any = [];
  bankNiftyStrikes: any = [];
  midcpNiftyStrikes: any = [];
  NIFTYPRICES!: {
    symbolId: number;
    futSymbolId: number;
    ltp: number;
    previousClose: number;
    changePercentage: number;
    futLtp: number;
    futPreviousClose: number;
    futChangePercentage: number;
    if: number;
  };
  NIFTYBANKPRICES!: {
    symbolId: number;
    futSymbolId: number;
    ltp: number;
    previousClose: number;
    changePercentage: number;
    futLtp: number;
    futPreviousClose: number;
    futChangePercentage: number;
    if: number;
  };
  NIFTYFINSERVICEPRICES!: {
    symbolId: number;
    futSymbolId: number;
    ltp: number;
    previousClose: number;
    changePercentage: number;
    futLtp: number;
    futPreviousClose: number;
    futChangePercentage: number;
    if: number;
  };
  MIDCPNIFTYPRICES!: {
    symbolId: number;
    futSymbolId: number;
    ltp: number;
    previousClose: number;
    changePercentage: number;
    futLtp: number;
    futPreviousClose: number;
    futChangePercentage: number;
    if: number;
  };
  expiries: any = [];
  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private _snackBar: MatSnackBar,
    private strikeService: StrikeService,
    private services: ServiceService,
    private encService: EncService,
    private tradeService: TradeService,
    private authService: AuthService
  ) {
    this.strikeService.getStocks().subscribe((res: any) => {
      this.stockList = res;
    });

    this.userId = this.authService.getUserId();
    this.userService.getWalletBalance(this.userId).subscribe((wb: any) => {
      this.dayStartWalletBalance = wb;
      this.walletBalance = wb;
    });
  }
  private timeout?: number;

  search(event: any) {
    let searchTerm = event.target.value;
    if (searchTerm.length < 3) return;

    window.clearTimeout(this.timeout);

    this.timeout = window.setTimeout(
      () => this.constructNewGrid(searchTerm),
      500
    );
  }

  constructNewGrid(searchTerm: string): void {
    this.strikeService.getSymbols(searchTerm).subscribe((res: any) => {
      res = res.filter(
        (x: any) => moment(x.expiry).toDate() >= moment().toDate()
      );
      res.sort(predicateBy('symbolId'));
      this.tradeList = res.splice(0, 25);
      this.getLTP(res.map((x: any) => x.symbol));
      this.showSearchList = true;
    });
    // this.strikeService.search(searchTerm, null).subscribe((res: any) => {
    //   // res = res.filter(
    //   //   (x: any) => moment(x.expiry).toDate() >= moment().toDate()
    //   // );
    //   res.sort(predicateBy('symbolId'));
    //   // this.tradeList = res.splice(0, 25);
    //   this.tradeList = res;
    //   this.getLTP(res.map((x: any) => x.symbol));
    //   this.showSearchList = true;
    // });
  }

  getTradeSocket() {
    if (this.tradeSocket === undefined) {
      this.tradeSocket = this.services.GetTradeSocketConn();
      this.tradeSocket.on('tradeexecuted', (e: any) => {
        let trade = JSON.parse(e);
        this.toastr.success(`Trade Executed`, `${trade.guid}`);

        // console.log(trade)
        // console.log(this.totalOrderList)
        // console.log(this.totalOrderList.find((x:any)=>x.guid==trade.guid))

        if (trade.OrderAverageTradedPrice) {
          if (!this.totalOrderList.some((x: any) => x.guid == trade.guid)) {
            this.totalOrderList.push(trade);
          }
          if (!this.orderListDisplay.some((x: any) => x.guid == trade.guid)) {
            this.orderListDisplay.push(trade);
          }
          setTimeout(() => {
            this.getOrderList();
          }, 1000);
        }

        this.totalOrderList
          .filter((t: any) => trade.guid == t.guid)
          .forEach((t: any) => {
            if (
              t.strategy == 'straddle' &&
              t.rateType == 'limit' &&
              t.status == 'open'
            ) {
              t.status = 'executed';
            }
            t.status = 'executed';
            t.price = trade.price;
          });

        this.orderListDisplay
          .filter((t: any) => trade.guid == t.guid)
          .forEach((t: any) => {
            t.status = 'executed';
            t.price = trade.price;
          });

        this.openOrderList = this.totalOrderList.filter(
          (t: any) => t.status == 'open' || t.status == 'new'
        );
        this.orderListDisplay = this.totalOrderList.filter(
          (t: any) => !(t.status == 'open' || t.status == 'new')
        );
        this.orderList = this.totalOrderList.filter(
          (t: any) => t.status == 'executed'
        );
        // console.log(this.orderList)
        this.positionList = this.newPositionListData(this.orderList);

        // console.log(trade.price);
        // this.orderListDisplay.find((t: any) => trade.guid == t.guid).price =
        //   trade.price;
        // console.log(this.orderList.length)
      });
      this.tradeSocket.on('traderejected', (e: any) => {
        let trade = JSON.parse(e);

        this.toastr.error(`Trade Rejected`, `${trade.guid}`, {
          timeOut: 1000,
          closeButton: true,
        });
        // console.log(this.totalOrderList)
        // console.log(this.totalOrderList.filter((x:any)=>x.guid==trade.guid))
        if (this.totalOrderList.find((t: any) => trade.guid == t.guid)) {
          this.totalOrderList.find((t: any) => trade.guid == t.guid).status =
            'rejected';
        }
        this.getOrderList();
      });

      this.tradeSocket.on('ltp', (e: any) => {
        let data = JSON.parse(e);

        this.totalOrderList
          .filter((x: any) => x.strategy == 'straddle')
          .forEach((order: any) => {
            if (data.symbol == order.ceSymbol) {
              order.ceSymbolId = data.symbolId;
              order.ceLtp = data.ltp;
            }
            if (data.symbol == order.peSymbol) {
              order.peSymbolId = data.symbolId;
              order.peLtp = data.ltp;
            }
            if (order.ceLtp && order.peLtp)
              order.ltp = order.ceLtp + order.peLtp;
          });

        this.totalOrderList
          .filter((x: any) => x.strategy == 'options')
          .forEach((order: any) => {
            if (data.symbol == order.symbol) {
              order.symbolId = data.symbolId;
              order.ltp = data.ltp;
            }
          });
        this.positionList
          ?.filter((p: any) => p.quantity != 0)
          .forEach((pos: any) => {
            if (data.symbolId == pos.ceSymbolId) {
              pos.ceLtp = parseFloat(data.ltp);
            }
            if (data.symbolId == pos.peSymbolId) {
              pos.peLtp = parseFloat(data.ltp);
            }
            if (pos.ceLtp && pos.peLtp) pos.ltp = pos.ceLtp + pos.peLtp;

            if (data.symbolId == pos.symbolId) {
              pos.ltp = parseFloat(data.ltp);
            }

            if (pos.quantity != 0) {
              pos.pandl = (pos.ltp - pos.avg) * pos.quantity;
            }
          });
        // this.positionList = this.newPositionListData(this.orderList);
      });
      this.tradeSocket.on('disconnect', () => {
        this.tradeSocket = undefined;
      });
      // this.tradeSocket.on('ask', (e: any) => {});
      // this.tradeSocket.on('bid', (e: any) => {
      //   // console.log(e)
      // });
      this.tradeSocket?.on('message', (e: any) => {
        this.socketMessageListener(e);
      });
      this.tradeSocket.on('reconnect', () => {
        this.getTradeSocket().send(
          `{ "method" : "handshake", "userId":` +
            JSON.stringify(this.userId) +
            `}`
        );
        this.subscribeSymbols(this.subscribedSymbols);
      });
      this.tradeSocket.on('connect', () => {
        this.getTradeSocket().send(
          `{ "method" : "handshake", "userId":` +
            JSON.stringify(this.userId) +
            `}`
        );
      });
      this.tradeSocket?.on('ack', () => {
        this.toastr.info(`Connected`, ``, {
          timeOut: 1000,
          closeButton: true,
        });
        // this.refreshData()
      });
    }
    return this.tradeSocket;
  }
  socketMessageListener(e: any) {
    var dataVal = JSON.parse(e);
    this.handleData(dataVal);
  }
  refresh() {
    if (this.getTradeSocket() == undefined) this.getTradeSocket();

    setTimeout(() => {
      this.getOrderList(true);
      this.getWatchList();
      this.loadStocksWatchlist();
      // this.loadIFWatchlist();
      this.loadSDWatchlist(true);
    }, 1000);
  }
  ngOnInit(): void {
    this.strikeService.getExpiryByCalendarId(3).subscribe((res: any) => {
      this.finniftyExpiries = res;
      this.selectedFINNIFTYExpiry = res[0];
    });
    this.strikeService.getExpiry().subscribe((res: any) => {
      this.expiries = res;
      this.selectedExpiry = res[0];
    });
    this.strikeService.getExpiryByCalendarId(4).subscribe((res: any) => {
      this.midCPNiftyExpiries = res;
      this.selectedMIDCPNIFTYExpiry = res[0];
    });
    this.refresh();
    this.updateVariableBasedOnWindowSize();
  }

  timeCal(data: any) {
    let hours: any = data.getHours();
    let minutes: any = data.getMinutes();
    // let seconds: any = data.getSeconds()
    if (hours < 10) {
      hours = '0' + hours;
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    // if (seconds < 10) { seconds = "0" + seconds; }
    return parseInt(hours.toString() + minutes.toString());
  }

  removeSearchList() {
    this.showSearchList = false;
    this.searchControl.reset();
    // this.tradeList = []
  }
  selectedSymbol: string = 'NIFTY 50';
  selectedWatchList(page: any) {
    this.pageNumber = page;
    this.selectedSymbol = this.mocktradeList[page - 1].name;
  }
  selectedExpiry: any;
  selectedBankNiftyExpiry: any;
  selectedFINNIFTYExpiry: any;
  selectedMIDCPNIFTYExpiry: any;
  selectExpiry(expiry: any) {
    if (this.selectedSymbol == 'NIFTY FIN SERVICE')
      this.selectedFINNIFTYExpiry = expiry;
    else if (this.selectedSymbol == 'NIFTY BANK')
      this.selectedBankNiftyExpiry = expiry;
    else if (this.selectedSymbol == 'MIDCPNIFTY')
      this.selectedMIDCPNIFTYExpiry = expiry;
    else this.selectedExpiry = expiry;

    this.loadStocksWatchlist(
      this.selectedWatchListSection == 'options' ? true : false
    );
    this.loadSDWatchlist(
      this.selectedWatchListSection == 'straddle' ? true : false
    );
    // this.loadIFWatchlist(
    //   this.selectedWatchListSection == 'ironfly' ? true : false
    // );
    // this.loadIFWatchlist(
    //   this.selectedWatchListSection == 'ironfly' ? true : false
    // );
  }

  getWatchList(loadoncompletion = false) {
    this.mocktradeListWatchlist = [];
    this.watchListArray = [];

    for (let i = 1; i <= 1; i++) {
      let watchList = {
        name: i.toString(),
        watchLists: [],
      };
      this.mocktradeListWatchlist.push(watchList);

      this.watchListArray.push(i);
    }

    this.tradeService.watchListGet(this.userId).subscribe((data: any) => {
      if (data == null || data.length == 0) {
        return;
      }
      let symbols: any[] = [];

      data.forEach((v: any, index: any) => {
        if (index <= 5) v.name = index + 1;
        let watchList = v.watchLists;
        watchList.forEach((element: any) => {
          symbols.push(element.symbol);
          element.display = true;
          let lotSizeVal: any = this.tradeService.allStockList.find(
            (s: any) => s.symbolId == element.symbolId
          );
          element.lotSize = lotSizeVal ? lotSizeVal.lotSize : 0;
          element.alias = this.tradeService.allStockList.find(
            (s) => s.symbol == element.symbol
          )?.alias;
          element.expiry = this.tradeService.allStockList.find(
            (s) => s.symbol == element.symbol
          )?.expiry;
          element.display = this.tradeService.allStockList.some(
            (s) => s.symbol == element.symbol
          );
          (element.strike = this.tradeService.allStockList.find(
            (s) => s.symbol == element.symbol
          )?.strike),
            (element.marketDepth = []);
        });
      });

      let newSymbols = symbols.filter(
        (s) => !this.tradeService.allStockList.some((st) => st.symbol == s)
      );

      if (newSymbols.length > 0) {
        this.strikeService.getSymbolsDetails(symbols).subscribe((res: any) => {
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

          data.forEach((v: any) => {
            let watchList = v.watchLists;

            watchList.forEach((element: any) => {
              let lotSizeVal: any = this.tradeService.allStockList.find(
                (s: any) => s.symbolId == element.symbolId
              );
              element.display = true;
              element.lotSize = lotSizeVal ? lotSizeVal.lotSize : 0;
              element.alias = this.tradeService.allStockList.find(
                (s) => s.symbol == element.symbol
              )?.alias;
              element.expiry = this.tradeService.allStockList.find(
                (s) => s.symbol == element.symbol
              )?.expiry;
              element.display = this.tradeService.allStockList.some(
                (s) => s.symbol == element.symbol
              );
              (element.strike = this.tradeService.allStockList.find(
                (s) => s.symbol == element.symbol
              )?.strike),
                (element.marketDepth = []);
            });
            // v.watchLists = watchList.filter((w: any) => w.display);
          });
        });
        this.strikeService
          .getLiveTouchLine(symbols)
          .subscribe((_touchline: any) => {
            data.forEach((v: any, i: any) => {
              v.watchLists.forEach((element: ITouchlineDetails) => {
                let touchline = _touchline.data.find(
                  (t: any) => t.symbolId == element.symbolId
                );
                if (touchline) {
                  element.ltp = touchline.ltp;
                }
              });
            });
          });
        this.strikeService.getTouchLine(symbols).subscribe(
          (_touchline: any) => {
            data.forEach((v: any, i: any) => {
              v.watchLists.forEach((element: ITouchlineDetails) => {
                let touchline = _touchline.find(
                  (t: any) => t.symbolId == element.symbolId
                );
                if (touchline) {
                  // element.ltp = touchline.ltp;
                  element.previousClose = touchline.previousClose;
                  element.changePercentage = touchline.changePercentage;
                }
              });
            });
          },
          (error) => {}
        );
      }
      this.subscribeSymbols(symbols);
      if (data.length > 0) {
        this.mocktradeListWatchlist[0] = data[0];
        this.mocktradeListWatchlist[1] = data[1];
        this.mocktradeListWatchlist[2] = data[2];
        this.mocktradeListWatchlist[3] = data[3];

        // this.mocktradeListWatchlist[0].name='NIFTY 50'
        // this.mocktradeListWatchlist[1].name='NIFTY BANK'
        // this.mocktradeListWatchlist[2].name='NIFTY FIN SERVICE'
        // this.mocktradeListWatchlist[3] = data[3];
        // this.mocktradeListWatchlist[4] = data[4];
      }
      let currentTime = this.timeCal(getIST());

      if (currentTime > this.marketCloseTime) {
        this.mocktradeListWatchlist.forEach((v: any) => {
          const filterWatchListBasedOnSymbol = [
            ...new Set(v['watchLists'].map((item: any) => item.symbol)),
          ];
          if (filterWatchListBasedOnSymbol.length > 0) {
            this.ltpUpdate(filterWatchListBasedOnSymbol);
          }
        });
      }
      this.sortWatchlists();
      if (loadoncompletion) this.mocktradeList = this.mocktradeListWatchlist;
    });
  }

  ltpUpdate(filterWatchListBasedOnSymbol: any) {
    let symbols = filterWatchListBasedOnSymbol;
    this.strikeService.getTouchLine(symbols).subscribe(
      (data: any) => {
        this.mocktradeList.forEach((v: any) => {
          if (v['watchLists'].length > 0) {
            v['watchLists'].forEach((h: any) => {
              let findIndex = data.findIndex((p: any) => p.symbol == h.symbol);
              if (findIndex >= 0) {
                h.ltp = data[findIndex].ltp;
                h.changePercentage = Number(data[findIndex].changePercentage);
                h.low = data[findIndex].low;
                h.high = data[findIndex].high;
                h.previousClose = data[findIndex].previousClose;
                h.open = data[findIndex].open;
              }
            });
          }
        });
      },
      (err: any) => {}
    );
  }

  handleData(data: any) {
    if (data.trade != undefined) {
      let trade = data.trade;
      let symbolId = Number(trade[0]);
      this.mocktradeList?.forEach((item: any) => {
        if (item?.watchLists.length > 0) {
          let findIndex = item['watchLists'].find(
            (v: any) => v.symbolId == symbolId
          );
          if (findIndex) {
            findIndex['ltp'] = parseFloat(trade[2]);
            // this.updateLIVELTP(findIndex.alias, findIndex.ltp)

            findIndex['changePercentage'] = Number(trade[11]);
            findIndex['low'] = parseFloat(trade[8]);
            findIndex['high'] = parseFloat(trade[7]);
            findIndex['marketDepth'] = [
              {
                askPrice: trade[12],
                askQty: trade[13],
                bidPrice: trade[14],
                bidQty: trade[15],
              },
            ];
          }

          let findCE = item['watchLists'].find(
            (v: any) => v.ceSymbolId == symbolId
          );
          if (findCE) {
            findCE.ceLtp = parseFloat(trade[2]);
            findCE.ltp = findCE.ceLtp + findCE.peLtp;
            // this.updateLIVELTP(findCE.alias, findCE.ltp);
            (findCE.changePercentage =
              ((findCE.ceLtp -
                findCE.cePreviousClose +
                (findCE.peLtp - findCE.pePreviousClose)) *
                100) /
              (findCE.cePreviousClose + findCE.pePreviousClose)),
              (findCE.previousClose =
                findCE.cePreviousClose + findCE.pePreviousClose);
            // findCE.changePercentage = Number(trade[11]);
            // findCE['low'] = parseFloat(trade[8]);
            // findCE['high'] = parseFloat(trade[7]);
            (findCE.marketDepth[0].ceAskPrice = trade[12]),
              (findCE.marketDepth[0].ceAskQty = trade[13]),
              (findCE.marketDepth[0].ceBidPrice = trade[14]),
              (findCE.marketDepth[0].ceBidQty = trade[15]),
              (findCE.marketDepth[0].askPrice =
                Number(findCE.marketDepth[0]?.ceAskPrice ?? 0) +
                Number(findCE.marketDepth[0]?.peAskPrice ?? 0));
            findCE.marketDepth[0].askQty =
              Number(findCE.marketDepth[0]?.ceAskQty ?? 0) +
              Number(findCE.marketDepth[0]?.peAskQty ?? 0);
            findCE.marketDepth[0].bidPrice =
              Number(findCE.marketDepth[0]?.ceBidPrice ?? 0) +
              Number(findCE.marketDepth[0]?.peBidPrice ?? 0);
            findCE.marketDepth[0].bidQty =
              Number(findCE.marketDepth[0]?.ceBidQty ?? 0) +
              Number(findCE.marketDepth[0]?.peBidQty ?? 0);
          }
          let findPE = item['watchLists'].find(
            (v: any) => v.peSymbolId == symbolId
          );
          if (findPE) {
            findPE.peLtp = parseFloat(trade[2]);
            findPE.ltp = findPE.ceLtp + findPE.peLtp;
            // this.updateLIVELTP(findPE.alias, findPE.ltp);

            (findPE.changePercentage =
              ((findPE.ceLtp -
                findPE.cePreviousClose +
                (findPE.peLtp - findPE.pePreviousClose)) *
                100) /
              (findPE.cePreviousClose + findPE.pePreviousClose)),
              // findPE['changePercentage'] = Number(trade[11]);
              // findPE['low'] = parseFloat(trade[8]);
              // findPE['high'] = parseFloat(trade[7]);
              (findPE.previousClose =
                findPE.cePreviousClose + findPE.pePreviousClose);
            (findPE.marketDepth[0].peAskPrice = trade[12]),
              (findPE.marketDepth[0].peAskQty = trade[13]),
              (findPE.marketDepth[0].peBidPrice = trade[14]),
              (findPE.marketDepth[0].peBidQty = trade[15]),
              (findPE.marketDepth[0].askPrice =
                Number(findPE.marketDepth[0]?.peAskPrice ?? 0) +
                Number(findPE.marketDepth[0]?.ceAskPrice ?? 0));
            findPE.marketDepth[0].askQty =
              Number(findPE.marketDepth[0]?.peAskQty ?? 0) +
              Number(findPE.marketDepth[0]?.ceAskQty ?? 0);
            findPE.marketDepth[0].bidPrice =
              Number(findPE.marketDepth[0]?.peBidPrice ?? 0) +
              Number(findPE.marketDepth[0]?.ceBidPrice ?? 0);
            findPE.marketDepth[0].bidQty =
              Number(findPE.marketDepth[0]?.peBidQty ?? 0) +
              Number(findPE.marketDepth[0]?.ceBidQty ?? 0);
          }
        }
      });

      this.positionList
        ?.filter((p: any) => p.quantity != 0)
        .forEach((pos: any) => {
          if (symbolId == pos.ceSymbolId) {
            pos.ceLtp = parseFloat(trade[2]);
          }
          if (symbolId == pos.peSymbolId) {
            pos.peLtp = parseFloat(trade[2]);
          }
          if (pos.ceLtp && pos.peLtp) pos.ltp = pos.ceLtp + pos.peLtp;

          if (symbolId == pos.symbolId) {
            pos.ltp = parseFloat(trade[2]);
          }

          if (pos.quantity != 0) {
            pos.pandl = (pos.ltp - pos.avg) * pos.quantity;
          }
        });

      if (this.NIFTYPRICES && this.NIFTYPRICES.futSymbolId == symbolId) {
        this.NIFTYPRICES.futLtp = Number(trade[2]);
        this.NIFTYPRICES.futChangePercentage =
          (Number(trade[10]) * 100) / this.NIFTYPRICES.futPreviousClose;
        this.NIFTYPRICES.if = this.calculateImpliedFuture(
          this.NIFTYPRICES.futLtp,
          this.NIFTYPRICES.ltp
        );
      } else if (this.NIFTYPRICES && this.NIFTYPRICES.symbolId == symbolId) {
        this.NIFTYPRICES.ltp = Number(trade[2]);
        this.NIFTYPRICES.changePercentage =
          (Number(trade[10]) * 100) / this.NIFTYPRICES.previousClose;
        this.NIFTYPRICES.if = this.calculateImpliedFuture(
          this.NIFTYPRICES.futLtp,
          this.NIFTYPRICES.ltp
        );
      } else if (
        this.NIFTYBANKPRICES &&
        this.NIFTYBANKPRICES.futSymbolId == symbolId
      ) {
        this.NIFTYBANKPRICES.futLtp = Number(trade[2]);
        this.NIFTYBANKPRICES.futChangePercentage =
          (Number(trade[10]) * 100) / this.NIFTYBANKPRICES.futPreviousClose;
        this.NIFTYBANKPRICES.if = this.calculateImpliedFuture(
          this.NIFTYBANKPRICES.futLtp,
          this.NIFTYBANKPRICES.ltp
        );
      } else if (
        this.NIFTYBANKPRICES &&
        this.NIFTYBANKPRICES.symbolId == symbolId
      ) {
        this.NIFTYBANKPRICES.ltp = Number(trade[2]);
        this.NIFTYBANKPRICES.changePercentage =
          (Number(trade[10]) * 100) / this.NIFTYBANKPRICES.previousClose;
        this.NIFTYBANKPRICES.if = this.calculateImpliedFuture(
          this.NIFTYBANKPRICES.futLtp,
          this.NIFTYBANKPRICES.ltp
        );
      } else if (
        this.NIFTYFINSERVICEPRICES &&
        this.NIFTYFINSERVICEPRICES.futSymbolId == symbolId
      ) {
        this.NIFTYFINSERVICEPRICES.futLtp = Number(trade[2]);
        this.NIFTYFINSERVICEPRICES.futChangePercentage =
          (Number(trade[10]) * 100) /
          this.NIFTYFINSERVICEPRICES.futPreviousClose;
        this.NIFTYFINSERVICEPRICES.if = this.calculateImpliedFuture(
          this.NIFTYFINSERVICEPRICES.futLtp,
          this.NIFTYFINSERVICEPRICES.ltp
        );
      } else if (
        this.NIFTYFINSERVICEPRICES &&
        this.NIFTYFINSERVICEPRICES.symbolId == symbolId
      ) {
        this.NIFTYFINSERVICEPRICES.ltp = Number(trade[2]);
        this.NIFTYFINSERVICEPRICES.changePercentage =
          (Number(trade[10]) * 100) / this.NIFTYFINSERVICEPRICES.previousClose;
        this.NIFTYFINSERVICEPRICES.if = this.calculateImpliedFuture(
          this.NIFTYFINSERVICEPRICES.futLtp,
          this.NIFTYFINSERVICEPRICES.ltp
        );
      } else if (
        this.MIDCPNIFTYPRICES &&
        this.MIDCPNIFTYPRICES.futSymbolId == symbolId
      ) {
        this.MIDCPNIFTYPRICES.futLtp = Number(trade[2]);
        this.MIDCPNIFTYPRICES.futChangePercentage =
          (Number(trade[10]) * 100) / this.MIDCPNIFTYPRICES.futPreviousClose;
        this.MIDCPNIFTYPRICES.if = this.calculateImpliedFuture(
          this.MIDCPNIFTYPRICES.futLtp,
          this.MIDCPNIFTYPRICES.ltp
        );
      } else if (
        this.MIDCPNIFTYPRICES &&
        this.MIDCPNIFTYPRICES.symbolId == symbolId
      ) {
        this.MIDCPNIFTYPRICES.ltp = Number(trade[2]);
        this.MIDCPNIFTYPRICES.changePercentage =
          (Number(trade[10]) * 100) / this.MIDCPNIFTYPRICES.previousClose;
        this.MIDCPNIFTYPRICES.if = this.calculateImpliedFuture(
          this.MIDCPNIFTYPRICES.futLtp,
          this.MIDCPNIFTYPRICES.ltp
        );
      }

      // this.openOrderList.filter(p => p.symbolId).forEach((pos) => {
      //   if (pos.rateType == 'slm') {
      //     let ltp = trade[2]
      //     if (pos.operationType == "buy") {
      //       if (pos.triggerPrice <= ltp)
      //         pos.status = 'executed'
      //     }
      //     else {
      //       if (pos.triggerPrice >= ltp)
      //         pos.status = 'executed'
      //     }
      //   }
      // })
      // if (update) {
      // this.updateOrderListLtp(data["trade"])
      // this.orderListStatusUpdate(data["trade"])
      // this.positionListUpdate(data["trade"])
      // }
    }
  }

  addSymbolInWatchList(item: any, type: any) {
    // this.loading = true
    this.showSearchList = false;
    this.searchControl.reset();
    let symbols = [item.symbol];
    let newSymbols = symbols.filter(
      (x) => !this.tradeService.allStockList.some((s) => s.symbol == x)
    );
    if (newSymbols.length > 0) {
      this.strikeService.getSymbolsDetails(symbols).subscribe((res: any) => {
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

    this.strikeService.getTouchLine(symbols).subscribe(
      (data: any) => {
        data.forEach((element: any) => {
          let obj = element;
          obj.lotSize = item.lotSize;
          obj.displayOrder =
            this.mocktradeList[this.pageNumber - 1]['watchLists'].length;
          obj.id = null;
          obj.alias = this.tradeService.allStockList.find(
            (s) => s.symbol == obj.symbol
          )?.alias;
          obj.expiry = this.tradeService.allStockList.find(
            (s) => s.symbol == element.symbol
          )?.expiry;
          obj.strike = this.tradeService.allStockList.find(
            (s) => s.symbol == element.symbol
          )?.strike;

          // if (
          //   this.mocktradeListWatchlist[this.pageNumber - 1]['watchLists'].find(
          //     (s: any) => s.alias == obj.alias && s.expiry == obj.expiry
          //   ) == undefined
          // ) {
          if (
            !this.mocktradeListWatchlist[this.pageNumber - 1][
              'watchLists'
            ].some((x: any) => x.symbol == obj.symbol)
          )
            this.mocktradeListWatchlist[this.pageNumber - 1]['watchLists'].push(
              obj
            );
          // }

          if (type) {
            this.buyOrSellStockPopUp(obj, type);
          }
        });
        this.saveWatchList();
      },
      (err: any) => {}
    );
  }

  saveWatchList(newSymbol: boolean = true) {
    if (this.selectedWatchListSection == 'watchlist') {
      this.mocktradeListWatchlist.forEach((v: any, i: any) => {
        if (v) v.name = i + 1;
      });
      let obj = {
        userId: parseInt(this.userId),
        list: this.mocktradeListWatchlist.filter((x: any) => x != null),
      };
      this.tradeService.watchListSave(obj).subscribe(
        (data: any) => {
          this.loading = false;
          // this.getWatchList()
          if (newSymbol)
            this._snackBar.open(
              'Symbol Added Successfully In WatchList.',
              'Dismiss',
              {
                duration: 2000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              }
            );
          this.getWatchList(true);
          this.toastr.success('Symbol Added Successfully In WatchList.');
        },
        (err: any) => {}
      );
    }
  }
  buyOrSellStockPopUp(item: any, type: any) {
    this.showSearchList = false;
    this.searchControl.reset();
    this.buyOrSellModel = new buyAndSellStock();
    this.totalBuyOrSellQty = 1;
    this.selectedWatchListElement = Object.create(item);

    // this.selectedWatchListElement = item
    this.buyOrSellModel.strike = item.strike;
    this.selectedWatchListElement.strategy = this.selectedWatchListSection;
    if (this.selectedWatchListElement.alias.endsWith('SD')) {
      this.selectedWatchListElement.symbol = this.stockList.find(
        (s: any) => s.name == this.selectedWatchListElement.alias.split(' ')[0]
      )?.displayName;
    } else if (this.selectedWatchListElement.alias.endsWith('IF')) {
      this.selectedWatchListElement.symbol = this.stockList.find(
        (s: any) => s.name == this.selectedWatchListElement.alias.split(' ')[0]
      )?.displayName;
    } else if (
      this.selectedWatchListElement.symbol.endsWith('CE') ||
      this.selectedWatchListElement.symbol.endsWith('PE') ||
      this.selectedWatchListElement.symbol.endsWith('FUT')
    ) {
      this.selectedWatchListElement.maxQty = 30;
    } else {
      this.selectedWatchListElement.maxQty = 50;
    }
    this.selectedWatchListElement.maxQty = 20;

    if (this.selectedWatchListSection == 'stocks')
      this.buyOrSellModel.orderType = 'cnc';
    this.buyOrSellModel.sell = type == 'sell' ? true : false;
    setTimeout(() => {
      this.inputQuantity?.nativeElement.focus();
    }, 300);
  }

  resetPriceVal(price: any) {
    this.buyOrSellModel.price = 0;
    this.buyOrSellModel.triggerPrice = 0;
    if (price == 'price') {
      this.buyOrSellModel.price = this.selectedWatchListElement['ltp'];
    }
    if (price == 'target-price') {
      this.buyOrSellModel.targetPrice = this.selectedWatchListElement['ltp'];
    }
    if (price == 'trigger-price') {
      this.buyOrSellModel.triggerPrice = this.selectedWatchListElement['ltp'];
    }
  }

  showListRowDetail(i: any) {
    if (this.showMarketDepthList == i) {
      this.showMarketDepthList = undefined;
    } else {
      this.showMarketDepthList = i;
    }
  }

  cancel() {
    this.selectedWatchListElement = null;
    this.buyOrSellModel.sell = false;
  }

  deleteDataFromWatchList(index: any, item: any) {
    this.loading = true;
    this.mocktradeList[this.pageNumber - 1]['watchLists'].splice(index, 1);
    this.tradeService.deleteWatchList(item.id).subscribe(
      (data: any) => {
        // this.toastr.success("Symbol Deleted Successfully From WatchList.")
        this._snackBar.open(
          'Symbol Deleted Successfully From WatchList.',
          'Dismiss',
          {
            duration: 2000,
            horizontalPosition: this.horizontalPosition,
            verticalPosition: this.verticalPosition,
          }
        );
        this.loading = false;
        this.getWatchList();
      },
      (err: any) => {
        this.loading = false;
      }
    );
  }

  calTotalQty(event?: any) {
    if (this.buyOrSellModel['quantity'] == null) {
      return;
    }
    let maxQty = this.selectedWatchListElement?.maxQty;
    maxQty = 100;
    // this.selectedWatchListElement.maxQty = 100
    setTimeout(() => {
      if (this.buyOrSellModel['quantity'] > maxQty) {
        this.buyOrSellModel['quantity'] = maxQty;
      }
      if (this.buyOrSellModel['quantity'] <= 0) {
        this.buyOrSellModel.quantity = 1;
      }
      this.totalBuyOrSellQty = this.buyOrSellModel['quantity']
        ? this.buyOrSellModel['quantity']
        : 1;
    }, 100);
  }
  async placeTradeOrder(obj: any) {
    // console.log(this.selectedWatchListElement)
    obj.status = 'open';
    obj.strategy = this.selectedWatchListSection;
    obj.type = obj.isExitOrder ? 'exit' : 'fresh';
    obj.createdBy = this.userId;
    let selectedItemObj: any = Object.create(this.selectedWatchListElement);
    this.selectedWatchListElement = null;
    if (obj.rateType == 'STOPLIMIT' && obj.price == 0) {
      alert('Please check prices');
      return;
    }

    if (
      obj.rateType == 'limit' &&
      selectedItemObj.ltp <= obj.price &&
      obj.operationType == 'buy'
    ) {
      obj.price = this.buyOrSellModel.price;
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
      obj['price'] = obj.price;
    } else if (obj.rateType == 'market') {
      obj['price'] = selectedItemObj.ltp;
    } else if (
      obj.rateType == 'limit' &&
      selectedItemObj.ltp >= obj.price &&
      obj.operationType == 'sell'
    ) {
      obj.price = this.buyOrSellModel.price;
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
      obj['quantity'] = this.totalBuyOrSellQty * selectedItemObj.lotSize;
    else obj['quantity'] = this.totalBuyOrSellQty;
    obj.symbol = selectedItemObj.symbol;

    if (obj.strategy == 'watchlist') obj.strategy = 'options';
    else if (obj.strategy == 'straddle') {
      obj.ceSymbol = `${
        this.stockList.find((s: any) => s.displayName == obj.symbol).name
      }${moment(obj.expiry).format('YYMMDD')}${obj.strike}CE`;
      obj.peSymbol = `${
        this.stockList.find((s: any) => s.displayName == obj.symbol).name
      }${moment(obj.expiry).format('YYMMDD')}${obj.strike}PE`;
    }

    var lotSize = selectedItemObj.lotSize;

    obj.userId = this.userId;

    // this.getTradeSocket().send(
    //   `{ "method" : "addtrade", "data":` + JSON.stringify([obj]) + `}`
    // );

    // if (obj.rateType == 'market') {
    //   obj.status = 'executed';
    // }

    obj.userId = this.userId;
    let guid = this.generateUID();

    this.openOrderList.push(obj);

    var quotient = this.totalBuyOrSellQty / 20;
    var remainder = this.totalBuyOrSellQty % 20;

    // console.log(quotient, remainder)

    for (var i = 1; i <= quotient; i++) {
      obj.guid = `${guid}_${i}`;
      obj.quantity = lotSize * 20;
      let inputParam = {
        userId: this.userId,
        createdBy: obj.createdBy,
        list: [
          {
            symbol: obj.symbol,
            strike: obj.strike,
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
            createdBy: obj.createdBy,
            type: obj.type,
          },
        ],
      };
      // console.log(inputParam.list)
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
      // if (obj.rateType == 'market') {
      //   obj.status = 'executed';
      // }
      this.totalOrderList.push(obj);
      // Switch for MOCK
      if (environment.mode == 'live') {
        this.tradeService.buyOrSell(inputParam).subscribe(
          (_data: any) => {
            let data: { guid: string; id: Number }[] = _data;
            data.forEach((element) => {
              if (
                this.totalOrderList.some(
                  (t: { guid: string; id: Number }) => t.guid == element.guid
                )
              )
                this.totalOrderList.find(
                  (t: { guid: string; id: Number }) => t.guid == element.guid
                ).id = element.id;
            });
            this.loading = false;

            this.getOrderList();
          },
          (err: any) => {
            this.loading = false;
            this.getOrderList();
          }
        );
      }
      this.getTradeSocket().send(
        `{ "method" : "addtrade", "data":` +
          JSON.stringify(inputParam.list) +
          `}`
      );
      await this.delay(1000);
    }

    if (remainder > 0) {
      const robj = Object.create(obj);
      robj.guid = `${guid}_r`;
      robj.quantity = lotSize * remainder;
      let inputParam = {
        userId: this.userId,
        createdBy: robj.createdBy,
        list: [
          {
            symbol: robj.symbol,
            strike: robj.strike,
            expiry: robj.expiry,
            orderType: robj.orderType,
            quantity: robj.quantity,
            price: robj.price,
            triggerPrice: robj.triggerPrice,
            rateType: robj.rateType,
            status: robj.status,
            time: robj.time,
            operationType: robj.operationType,
            guid: robj.guid,
            userId: this.userId,
            strategy: robj.strategy,
            callPutFut: robj.callPutFut,
            createdBy: robj.createdBy,
            type: robj.type,
          },
        ],
      };

      let symbolVal: any = this.tradeService.allStockList.find(
        (s: any) => s.symbol == robj.symbol
      );
      if (symbolVal != undefined) {
        robj.symbolId = symbolVal.symbolId;
        robj.alias = selectedItemObj.alias;
        robj.expiry = selectedItemObj.expiry;
        robj.strike = selectedItemObj.strike;
        if (this.subscribedSymbols.find((s) => s == robj.symbol) == undefined) {
          this.subscribedSymbols.push(robj.symbol);
        }
      }
      // if (obj.rateType == 'market') {
      //   obj.status = 'executed';
      // }
      this.totalOrderList.push(robj);
      // Switch for MOCK
      if (environment.mode == 'live') {
        this.tradeService.buyOrSell(inputParam).subscribe(
          (_data: any) => {
            let data: { guid: string; id: Number }[] = _data;
            data.forEach((element) => {
              if (
                this.totalOrderList.some(
                  (t: { guid: string; id: Number }) => t.guid == element.guid
                )
              )
                this.totalOrderList.find(
                  (t: { guid: string; id: Number }) => t.guid == element.guid
                ).id = element.id;
            });
            this.loading = false;

            this.getOrderList();
          },
          (err: any) => {
            this.loading = false;
          }
        );
      }

      this.getTradeSocket().send(
        `{ "method" : "addtrade", "data":` +
          JSON.stringify(inputParam.list) +
          `}`
      );
      // setTimeout(() => {
      //   this.selectedWatchListElement = null;
      // }, 100);
    }

    let symbols: any[] = [];

    if (obj.strategy == 'straddle' || obj.strategy == 'ironfly') {
      var symbol = `${
        this.stockList.find((s: any) => s.displayName == obj.symbol)?.name
      }${moment(obj.expiry).format('YYMMDD').toUpperCase()}${obj.strike}CE`;
      if (!symbols.some((s) => s == symbol)) symbols.push(symbol);

      symbol = `${
        this.stockList.find((s: any) => s.displayName == obj.symbol)?.name
      }${moment(obj.expiry).format('YYMMDD').toUpperCase()}${obj.strike}PE`;
      if (!symbols.some((s) => s == symbol)) symbols.push(symbol);
    } else {
      if (!symbols.some((s) => s == obj.symbol)) symbols.push(obj.symbol);
    }

    this.getLTP(symbols);

    // this.loading = true;

    return;
    // this.tradeService.buyOrSell(inputParam).subscribe(
    //   (data: any) => {
    //     this.loading = false;

    //     // if (obj.strategy == 'straddle' && obj.rateType != 'limit')
    //     //   this.getOrderList();
    //     // else if (obj.strategy != 'straddle') {
    //     this.getOrderList();
    //     // }
    //   },
    //   (err: any) => {
    //     this.loading = false;
    //   }
    // );
  }
  _buyOrSellStock() {
    if (this.buyOrSellModel.isBasket ?? false) {
      if (this.buyOrSellModel.basketName == 'new') {
        console.log('new basket name', this.buyOrSellModel.newBasketName);
        if (this.buyOrSellModel.newBasketName)
          this.tradeService
            .createBasket(this.buyOrSellModel.newBasketName)
            .subscribe((basketId: any) => {
              let obj: any = this.buyOrSellModel;
              obj.operationType = this.buyOrSellModel.sell ? 'sell' : 'buy';
              let selectedItemObj: any = this.selectedWatchListElement;
              if (
                obj.rateType == 'limit' &&
                selectedItemObj.ltp <= obj.price &&
                obj.operationType == 'buy'
              ) {
                obj.price = selectedItemObj.ltp;
              } else if (
                obj.rateType == 'slm' &&
                selectedItemObj.ltp == obj.triggerPrice
              ) {
                obj.price = obj.triggerPrice;
              } else if (
                obj.rateType == 'slm' &&
                (selectedItemObj.ltp < obj.triggerPrice ||
                  selectedItemObj.ltp > obj.triggerPrice)
              ) {
                obj.price = obj.triggerPrice;
              } else if (obj.rateType == 'market') {
                obj.price = selectedItemObj.ltp;
              } else if (
                obj.rateType == 'limit' &&
                selectedItemObj.ltp >= obj.price &&
                obj.operationType == 'sell'
              ) {
                obj.price = selectedItemObj.ltp;
              }
              obj.status = 'basket';
              obj.quantity = this.totalBuyOrSellQty;
              obj.symbol = selectedItemObj.symbol;
              obj.symbolId = selectedItemObj.symbolId;
              obj.basketId = basketId;
              obj.expiry = this.selectedWatchListElement.expiry;
              obj.strategy =
                this.selectedWatchListSection == 'watchlist'
                  ? 'options'
                  : this.selectedWatchListSection;
              setTimeout(() => {
                this.selectedWatchListElement = null;
              }, 100);
              let inputParam = {
                list: [obj],
              };

              this.tradeService
                .saveBasketOrder(inputParam)
                .subscribe(() => this.reloadBaskets());
              this._snackBar.open('Order Added to Basket', 'Dismiss', {
                duration: 2000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              });
            });
      } else {
        let obj: any = this.buyOrSellModel;
        let basketId = this.baskets.find(
          (b: any) => b.id == this.buyOrSellModel.basketName
        )?.id;
        obj.operationType = this.buyOrSellModel.sell ? 'sell' : 'buy';
        let selectedItemObj: any = this.selectedWatchListElement;
        if (
          obj.rateType == 'limit' &&
          selectedItemObj.ltp <= obj.price &&
          obj.operationType == 'buy'
        ) {
          obj.price = selectedItemObj.ltp;
        } else if (
          obj.rateType == 'slm' &&
          selectedItemObj.ltp == obj.triggerPrice
        ) {
          obj.price = obj.triggerPrice;
        } else if (
          obj.rateType == 'slm' &&
          (selectedItemObj.ltp < obj.triggerPrice ||
            selectedItemObj.ltp > obj.triggerPrice)
        ) {
          obj.price = obj.triggerPrice;
        } else if (obj.rateType == 'market') {
          obj.price = selectedItemObj.ltp;
        } else if (
          obj.rateType == 'limit' &&
          selectedItemObj.ltp >= obj.price &&
          obj.operationType == 'sell'
        ) {
          obj.price = selectedItemObj.ltp;
        }
        obj.quantity = this.totalBuyOrSellQty;
        obj.symbol = selectedItemObj.symbol;
        obj.symbolId = selectedItemObj.symbolId;
        obj.basketId = basketId;
        obj.expiry = this.selectedWatchListElement.expiry;
        obj.strategy =
          this.selectedWatchListSection == 'watchlist'
            ? 'options'
            : this.selectedWatchListSection;
        setTimeout(() => {
          this.selectedWatchListElement = null;
        }, 100);
        let inputParam = {
          list: [obj],
        };

        this.tradeService
          .saveBasketOrder(inputParam)
          .subscribe(() => this.reloadBaskets());

        this._snackBar.open('Order Added to Basket', 'Dismiss', {
          duration: 2000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });
      }
    } else
      Swal.fire({
        text: `You are ${this.buyOrSellModel.sell ? 'Selling' : 'Buying'} ${
          this.totalBuyOrSellQty
        } lot(s) of ${this.selectedWatchListElement.alias}`,
        showCancelButton: true,
        showConfirmButton: true,
        icon: 'info',
      }).then((res) => {
        if (res.isConfirmed) {
          this.buyOrSellStock();
        } else {
          return;
        }
      });
  }
  buyOrSellStock() {
    if (!this.buyOrSellModel['quantity']) {
      this.buyOrSellModel['quantity'] = 1;
    }
    if (getIST().getDay() == 0) {
      this._snackBar.open('Markets are closed right now.', 'Dismiss', {
        duration: 2000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
      return;
    }
    let currentTime = this.timeCal(getIST());
    if (
      (currentTime >= this.marketStartTime &&
        currentTime <= this.marketCloseTime) ||
      (currentTime >= this.marketStartTime &&
        currentTime <= this.marketCloseTime + 20 &&
        this.buyOrSellModel.orderType == 'normal')
    ) {
      if (this.buyOrSellModel.rateType == 'STOPLIMIT') {
        if (
          this.buyOrSellModel.sell &&
          this.selectedWatchListElement['ltp'] <
            this.buyOrSellModel.triggerPrice &&
          this.buyOrSellModel.triggerPrice < this.buyOrSellModel.price
        ) {
          Swal.fire('', 'Please check prices', 'error');
          return;
        }
        if (
          !this.buyOrSellModel.sell &&
          this.selectedWatchListElement['ltp'] >
            this.buyOrSellModel.triggerPrice &&
          this.buyOrSellModel.triggerPrice > this.buyOrSellModel.price
        ) {
          Swal.fire('', 'Please check prices', 'error');
          return;
        }
      } else if (
        this.buyOrSellModel.rateType == 'slm' &&
        this.selectedWatchListSection == 'straddle'
      ) {
        if (
          this.buyOrSellModel.sell &&
          this.selectedWatchListElement['ltp'] <
            this.buyOrSellModel.triggerPrice
        ) {
          Swal.fire('', 'Please check prices', 'error');
          return;
        }
        if (
          !this.buyOrSellModel.sell &&
          this.selectedWatchListElement['ltp'] >
            this.buyOrSellModel.triggerPrice
        ) {
          Swal.fire('', 'Please check prices', 'error');
          return;
        }
      } else if (this.buyOrSellModel.rateType == 'limit') {
        if (
          this.buyOrSellModel.sell &&
          this.selectedWatchListElement['ltp'] > this.buyOrSellModel.price
        ) {
          Swal.fire('', 'Please check prices', 'error');
          return;
        }
        if (
          !this.buyOrSellModel.sell &&
          this.selectedWatchListElement['ltp'] < this.buyOrSellModel.price
        ) {
          Swal.fire('', 'Please check prices', 'error');
          return;
        }
      }

      // this.loading = true;
      let obj: any = this.buyOrSellModel;

      if (obj.quantity > 50) obj.quantity = 50;
      obj.operationType = obj.sell ? 'sell' : 'buy';

      let orders = this.totalOrderList
        .filter((x: any) => x.status == 'executed' || x.status == 'open')
        .map((val: any) => {
          var lotSize = this.tradeService.allStockList.find(
            (s: any) => s.symbol == val.symbol
          )?.lotSize;

          if (val.strategy == 'straddle' || val.strategy == 'ironfly') {
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
        strike: this.buyOrSellModel.strike,
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
          transactionType:
            _.sum(values.map((x) => x.quantity)) > 0 ? 'buy' : 'sell',
          lotSize: values[0].lotSize,
        });
      });

      if (final.length == 0) {
        return;
      }
      final.forEach((f: any) => {
        if (
          !f.expiry ||
          (f.expiry &&
            moment(f.expiry).daysInMonth() -
              Math.round(moment(f.expiry).date()) <
              7)
        ) {
          const sym = this.tradeService.allStockList.find(
            (s: any) => s.symbol == f.symbol
          );
          if (sym != undefined)
            f.tradingSymbol = this.tradeService.allStockList.find(
              (s: any) => s.symbol == f.symbol
            )?.tradingSymbol;

          //weekly
        } else if (moment(f.expiry).year() == 1970) {
          f.tradingSymbol = f.symbol;
        } else {
          let month = (moment(f.expiry).month() + 1).toString();
          let date = moment(f.expiry).date().toString();
          let stockName: string = f.symbol;
          stockName = stockName.slice(0, stockName.indexOf('2'));
          if (date.length == 1) date = '0' + date;
          if (month == '10') month = 'O';
          else if (month == '11') month = 'N';
          else if (month == '12') month = 'D';
          f.tradingSymbol = `${stockName}${moment(f.expiry).format(
            'YY'
          )}${month}${date}${f.strike}${f.symbol.slice(
            f.symbol.length - 2,
            f.symbol.length
          )}`;
        }
      });
      var symbolsToGet = final;

      if (symbolsToGet.length > 0) {
        // if (this.buyOrSellModel.isExitOrder) {
        //  val.quantity= obj.quantity
        // obj.strategy = this.selectedWatchListElement;
        // this.placeTradeOrder(obj);
        // return;
        // }

        var values: IMarginCalculationRequest[] = symbolsToGet.map(
          (val: any) => {
            if (val.strategy == 'straddle') {
              val.quantity = val.quantity / val.lotSize;
            }
            if (val.strategy == 'ironfly') {
              val.quantity = val.quantity / val.lotSize;
            }
            if (val.strategy == 'options') {
              val.quantity = val.quantity / val.lotSize;
            }
            return {
              price: val.price,
              quantity:
                (val.quantity < 0 ? -1 * val.quantity : val.quantity) *
                val.lotSize,
              symbol: val.tradingSymbol,
              lotSize: val.lotSize,
              strategy: val.strategy,
              strike: val.strike,
              expiry: this.tradeService.allStockList.find(
                (s: any) => s.symbol == val.symbol
              )?.expiry,
              transactionType: val.transactionType,
              triggerPrice: val.price,
              userId: this.authService.getUserId(),
            };
          }
        );

        this.tradeService.getMargin(values).subscribe((res: any) => {
          // this.loading = false;
          let margin = 0;
          margin += Number(res);

          if (margin > this.dayStartWalletBalance) {
            this._snackBar.open('Insufficient Funds', 'Dismiss', {
              duration: 2000,
              horizontalPosition: this.horizontalPosition,
              verticalPosition: this.verticalPosition,
            });
            return;
          } else {
            this.placeTradeOrder(obj);
          }
        });
        // this.placeTradeOrder(obj);
      } else {
        let margin = 0;
        final.forEach((f: any) => {
          margin += (f.quantity < 0 ? f.quantity * -1 : f.quantity) * f.price;
        });

        this.walletBalance = this.dayStartWalletBalance - margin;

        if (margin > this.dayStartWalletBalance) {
          this._snackBar.open('Insufficient Funds', 'Dismiss', {
            duration: 2000,
            horizontalPosition: this.horizontalPosition,
            verticalPosition: this.verticalPosition,
          });
          return;
        } else {
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
            obj.userId = this.userId;
            obj.guid = this.generateUID();

            this.openOrderList.push(obj);
            let inputParam = {
              userId: this.userId,
              list: [obj],
            };
            this.getTradeSocket().send(
              `{ "method" : "addtrade", "data":` + JSON.stringify([obj]) + `}`
            );
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
            // Switch for MOCK

            if (environment.mode == 'live') {
              // this.loading = true;
              this.tradeService.buyOrSell(inputParam).subscribe(
                (data: any) => {
                  this.getOrderList();
                },
                (err: any) => {
                  // this.loading = false;
                }
              );
            }
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
              this.selectedWatchListSection == 'straddle'
            )
              obj['quantity'] =
                this.totalBuyOrSellQty * this.selectedWatchListElement.lotSize;
            else obj['quantity'] = this.totalBuyOrSellQty;

            obj['symbol'] = selectedItemObj.symbol;
            obj['symbolId'] = selectedItemObj.symbolId;
            setTimeout(() => {
              this.selectedWatchListElement = null;
            }, 100);
            obj.userId = this.userId;
            obj.guid = this.generateUID();
            this.openOrderList.push(obj);
            let inputParam = {
              userId: this.userId,
              list: [obj],
            };
            this.getTradeSocket().send(
              `{ "method" : "addtrade", "data":` + JSON.stringify([obj]) + `}`
            );
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
            // Switch for MOCK
            if (environment.mode == 'live') {
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
        }
      }
    } else {
      // this.loading = false;
      this.cancel();
      this._snackBar.open(
        'Markets are closed right now. Use GTT for placing long standing orders instead.',
        'Dismiss',
        {
          duration: 2000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        }
      );
    }
  }
  subscribeSymbols(symbols: string[]) {
    if (this.getTradeSocket() == undefined) this.getTradeSocket();
    setTimeout(() => {
      this.getTradeSocket().send(
        `{ "method" : "addsymbol", "symbols" : ` + JSON.stringify(symbols) + `}`
      );
    }, 1000);
    // console.log(this.socket?.connected)
    // console.log(this.socket)
  }
  getLTP(symbols: string[]) {
    if (this.getTradeSocket() == undefined) this.getTradeSocket();
    symbols.forEach((symbol) => {
      this.getTradeSocket().send(
        `{ "method" : "ltp", "symbol" : ` + JSON.stringify(symbol) + `}`
      );
      // this.getTradeSocket().send(
      //   `{ "method" : "ask", "symbol" : ` + JSON.stringify(symbol) + `}`
      // );
      // this.getTradeSocket().send(
      //   `{ "method" : "bid", "symbol" : ` + JSON.stringify(symbol) + `}`
      // );
    });
    // console.log(this.socket?.connected)
    // console.log(this.socket)
  }
  getOrderList(updateWallet = false) {
    // this.loading = true;
    this.tradeService.orderListData(this.userId).subscribe(
      (data: any) => {
        // this.loading = false;
        let symbols: any[] = [];
        data.forEach((v: any) => {
          if (v.strategy == 'straddle' || v.strategy == 'ironfly') {
            var symbol = `${
              this.stockList.find((s: any) => s.displayName == v.symbol)?.name
            }${moment(v.expiry).format('YYMMDD').toUpperCase()}${v.strike}CE`;
            if (!symbols.some((s) => s == symbol)) symbols.push(symbol);

            symbol = `${
              this.stockList.find((s: any) => s.displayName == v.symbol)?.name
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

        this.totalOrderList = data;

        this.openOrderList = data.filter(
          (v: any) => v.status == 'open' || v.status == 'new'
        );

        this.orderList = data.filter((t: any) => t.status == 'executed');
        this.orderListDisplay = data.filter(
          (t: any) => !(t.status == 'open' || t.status == 'new')
        );

        // this.brokerage = this.orderList.length * 23.6;
        // this.buyingAmount = _.sum(
        //   this.orderList
        //     .filter((x: any) => x.operationType == 'buy')
        //     .map((x: any) => {
        //       return x.quantity * x.price * 0.000041;
        //     })
        // );
        // this.sellingAmount = _.sum(
        //   this.orderList
        //     .filter((x: any) => x.operationType == 'sell')
        //     .map((x: any) => {
        //       return x.quantity * x.price * 0.0001031;
        //     })
        // );
        // let currentTime = this.timeCal(getIST());
        // if (currentTime > this.marketCloseTime) {
        const filterorderListBasedOnSymbol = [
          ...new Set(this.orderList.map((item: any) => item.symbol)),
        ];
        this.orderList
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
              !filterorderListBasedOnSymbol.some((s) => s == order.ceSymbol)
            ) {
              filterorderListBasedOnSymbol.push(order.ceSymbol);
            }
            if (
              !filterorderListBasedOnSymbol.some((s) => s == order.peSymbol)
            ) {
              filterorderListBasedOnSymbol.push(order.peSymbol);
            }
          });
        // this.orderList
        //   .filter((x: any) => x.strategy == 'ironfly')
        //   .forEach((order: any) => {
        //     let strikes = [];
        //     if (order.symbol == 'NIFTY 50') strikes = this.niftyStrikes;
        //     else if (order.symbol == 'NIFTY BANK')
        //       strikes = this.bankNiftyStrikes;
        //     else if (order.symbol == 'NIFTY FIN SERVICE')
        //       strikes = this.finNiftyStrikes;
        //     let strikeIndex = strikes.findIndex((s: any) => s == order.strike);
        //     order.symbol1 = `${
        //       this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //     }${moment(order.expiry).format('YYMMDD')}${order.strike}CE`;
        //     order.symbol2 = `${
        //       this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //     }${moment(order.expiry).format('YYMMDD')}${order.strike}PE`;
        //     order.symbol3 = `${
        //       this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //     }${moment(order.expiry).format('YYMMDD')}${
        //       strikes[strikeIndex + 2]
        //     }CE`;
        //     order.symbol4 = `${
        //       this.stockList.find((s: any) => s.displayName == order.symbol)
        //         .name
        //     }${moment(order.expiry).format('YYMMDD')}${
        //       strikes[strikeIndex - 2]
        //     }PE`;

        //     if (!filterorderListBasedOnSymbol.some((s) => s == order.symbol1)) {
        //       filterorderListBasedOnSymbol.push(order.symbol1);
        //     }
        //     if (!filterorderListBasedOnSymbol.some((s) => s == order.symbol2)) {
        //       filterorderListBasedOnSymbol.push(order.symbol2);
        //     }
        //     if (!filterorderListBasedOnSymbol.some((s) => s == order.symbol3)) {
        //       filterorderListBasedOnSymbol.push(order.symbol3);
        //     }
        //     if (!filterorderListBasedOnSymbol.some((s) => s == order.symbol4)) {
        //       filterorderListBasedOnSymbol.push(order.symbol4);
        //     }
        //   });
        if (filterorderListBasedOnSymbol.length > 0) {
          // filterorderListBasedOnSymbol.forEach((_f: any) => {
          //   this.mocktradeListStraddle.forEach((_element: any) => {
          //     console.log(_element.watchLists)
          //    console.log( _element.watchLists.find((_x: any) => _x.symbol == _f))
          //   });
          // })

          this.getLTP(symbols);
          this.subscribeSymbols(symbols);
          this.strikeService
            .getLiveTouchLine(symbols)
            .subscribe((__touchline: any) => {
              let _touchline = __touchline.data;
              this.orderList
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

              this.orderList
                .filter((x: any) => x.strategy == 'options')
                .forEach((order: any) => {
                  order.ltp = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol
                  )?.ltp;
                  order.symbolId = _touchline.find(
                    (t: ITouchlineDetails) => t.symbol == order.symbol
                  )?.symbolId;
                });
              // this.orderList
              //   .filter((x: any) => x.strategy == 'ironfly')
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

              //     order.ltp = order.ltp1 + order.ltp2 - order.ltp3 - order.ltp4;
              //   });
              this.positionList = this.newPositionListData(this.orderList);

              // console.log(this.positionList)
              // console.log(this.orderList)
            });
        }
        //  else {
        //   this.getPositionListData()
        // }
      },
      () => {},
      () => {}
    );
  }

  tabChanged(event: MatTabChangeEvent) {
    let segment = event.tab.textLabel.toUpperCase();
    // if (segment == 'ORDERS') this.getOrderList();
    if (segment == 'POSITIONS')
      this.positionList = this.newPositionListData(this.orderList);
    else if (segment == 'BASKETS') {
      this.reloadBaskets();
    }
  }

  updateOrderListLtp(data: any) {
    if (data) {
      let findSymbolArrayInOrderList = this.orderList.filter(
        (s: any) => s.symbolId == parseInt(data[0])
      );
      if (findSymbolArrayInOrderList.length > 0) {
        findSymbolArrayInOrderList.forEach((obj: any) => {
          obj.ltp = parseFloat(data[2]);
          // this.changeDetectorRef.detectChanges()
        });
      }
    }
  }

  orderListStatusUpdate(data: any) {
    if (this.orderList.length > 0 && data) {
      let symbolVal: any = this.tradeService.allStockList.find(
        (s: any) => s.symbolId == parseInt(data[0])
      );
      let filterOderList = this.openOrderList.filter(
        (v: any) => v['symbol'] == symbolVal.symbol
      );
      if (filterOderList.length > 0) {
        filterOderList.forEach((obj: any) => {
          obj.ltp = parseFloat(data[2]);
          if (obj.status == 'open') {
            if (
              obj.rateType == 'limit' &&
              obj.price >= parseFloat(data[2]) &&
              obj.operationType == 'buy'
            ) {
              // obj.status = "executed"
              obj.price = parseFloat(data[2]);
              this.updateOrderList(obj);
            } else if (
              obj.rateType == 'limit' &&
              obj.price <= parseFloat(data[2]) &&
              obj.operationType == 'sell'
            ) {
              // obj.status = "executed"
              obj.price = parseFloat(data[2]);
              this.updateOrderList(obj);
            } else if (
              obj.rateType == 'slm' &&
              obj.price == parseFloat(data[2])
            ) {
              // obj.status = "executed"
              obj.price = parseFloat(data[2]);
              this.updateOrderList(obj);
            }
          }
        });
      }
    }
  }

  updateOrderList(obj: any) {
    obj.userId = this.userId;
    // let inputParam = {
    //   "userId": this.userId,
    //   "list": [obj]
    // }
    // this.tradeService.buyOrSell(inputParam).subscribe(data => {
    // this.getOrderList()
    // this.updateWallet()

    // })
  }

  // positionListUpdate(data: any) {
  //   if (data) {
  //     let findSymbolArrayInPOsition = this.positionList.filter(
  //       (s: any) => s.symbolId == parseInt(data[0])
  //     );
  //     if (findSymbolArrayInPOsition.length > 0) {
  //       findSymbolArrayInPOsition.forEach((obj: any) => {
  //         obj.ltp = parseFloat(data[2]);
  //         if (obj.quantity) {
  //           obj.pandl = (parseFloat(obj.ltp) - obj.avg) * obj.quantity;
  //         }
  //         let positionIndex = this.positionList.findIndex(
  //           (m: any) => m.symbol == obj.symbol && m.orderType == obj.orderType
  //         );
  //         if (positionIndex >= 0) {
  //           obj.id = this.positionList[positionIndex]['id'];
  //           this.positionList[positionIndex] = obj;
  //         } else {
  //           this.positionList.push(obj);
  //         }

  //         // this.changeDetectorRef.detectChanges()
  //       });
  //     }
  //   }
  //   if (this.orderList.length > 0) {
  //     this.positionList = this.newPositionListData(this.orderList);
  //   }
  // }
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

      filteroderListBasedOnSymbol.forEach((v: any) => {
        let totalQty = 0;
        let netValue = 0;
        // let symbolVal: any = this.tradeService.allStockList.find((s: any) => s.symbol == v);
        // if (symbolVal != undefined) {
        let obj: any = {
          symbol: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbol,
          symbolId: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).symbolId,
          ceSymbol: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceSymbol,
          ceSymbolId: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceSymbolId,
          ceLtp: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).ceLtp,
          peSymbol: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peSymbol,
          peSymbolId: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peSymbolId,
          peLtp: ord.orders.find(
            (s: any) => `${s.alias}-${moment(s.expiry).format('DDMMYY')}` == v
          ).peLtp,
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
          checked: true,
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

        if (obj.strategy == 'straddle') {
          obj.lotSize = this.tradeService.allStockList.find(
            (s) =>
              s.symbol ==
              `${
                this.stockList.find((s: any) => s.displayName == obj.symbol)
                  .name
              }${moment(obj.expiry).format('YYMMDD')}${obj.strike}CE`
          )?.lotSize;
        } else {
          obj.lotSize = this.tradeService.allStockList.find(
            (s) => s.symbol == obj.symbol
          )?.lotSize;
        }
        obj.ddlQuantity = this.populateQty({
          lotSize: obj.lotSize,
          quantity: obj.quantity,
        });

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
    let straddlePositions = masterPositionList.filter(
      (p: any) => p.strategy == 'straddle'
    );
    let grpdStraddlePositions = _.groupBy(straddlePositions, 'distinguisher');
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
    _.map(grpdStraddlePositions, (values, key) => {
      finalPositions.push({
        alias: `${values[0].alias.slice(0, values[0].alias.length - 3)} SD`,
        avg: _.sum(values.map((x) => x.avg)),
        expiry: values[0].expiry,
        ltp: values[0].ceLtp + values[0].peLtp,
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
        ddlQuantity: values[0].ddlQuantity,
      });
    });

    finalPositions.sort(predicateBy('alias'));
    // console.log(_.sum(
    //   finalPositions.map((position: any) => {
    //     return position.pandl;
    //   })
    // ))
    this.walletBalance =
      this.dayStartWalletBalance +
      _.sum(
        finalPositions.map((position: any) => {
          return position.pandl;
        })
      );
    return finalPositions;
  }

  savePosition(obj: any) {
    let inputParam = {
      userId: this.userId,
      positions: [
        {
          id: null,
          avg: obj.avg,
          ltp: obj.ltp,
          orderType: obj.orderType,
          pandl: obj.pandl == null ? 0 : obj.pandl,
          quantity: obj.quantity,
          symbol: obj.symbol,
          userId: this.userId,
        },
      ],
    };
    this.tradeService.savePositionData(inputParam).subscribe((arg: any) => {});
  }

  updatePosition(pos: any, obj: any) {
    let inputParam = {
      userId: this.userId,
      positions: [
        {
          id: pos.id,
          avg: pos.avg,
          ltp: pos.ltp,
          orderType: obj.orderType,
          pandl: pos.pandl,
          quantity: 0,
          symbol: obj.symbol,
          userId: this.userId,
        },
      ],
    };

    this.tradeService.savePositionData(inputParam).subscribe((arg: any) => {
      // this.getPositionList()
    });
  }
  showMoreDiv(i: any) {
    this.bodyEvent = false;
    if (this.showMoreOption == i) {
      this.showMoreOption = false;
    } else {
      this.showMoreOption = i;
    }
  }
  bodyEvent = true;
  showMoreDivForPosition(i: any) {
    this.bodyEvent = false;
    if (this.showMoreOptionForPosition == i) {
      this.showMoreOptionForPosition = false;
    } else {
      this.showMoreOptionForPosition = i;
    }
  }

  exitOrder(data: any) {
    data.selectedQuantity = data.quantity;

    //#region new code
    this.selectedWatchListSection = data.strategy;
    this.filterWatchLists(this.selectedWatchListSection);
    let buyOrSell = new buyAndSellStock();
    buyOrSell.orderType = data.orderType;
    buyOrSell.triggerPrice = data.ltp;
    buyOrSell.isExitOrder = true;
    buyOrSell.strike = data.strike;
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
      quantity = -1 * data.selectedQuantity;
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
      maxQty: data.quantity / (lotSize ?? 1),
    };
    this.selectedWatchListElement.maxQty =
      this.selectedWatchListElement.maxQty < 0
        ? -1 * this.selectedWatchListElement.maxQty
        : this.selectedWatchListElement.maxQty;

    this.buyOrSellModel = buyOrSell;
    return;
    //#endregion
  }

  removeOrder(data: any) {
    Swal.fire({
      text: 'Are you sure you want to Delete this?',
      title: 'Confirm',
      showCancelButton: true,
    }).then((res) => {
      if (res.value) {
        this.showMoreOption = false;
        this.loading = true;
        this.getTradeSocket().send(
          `{ "method" : "removetrade", "data":` + JSON.stringify(data) + `}`
        );
        setTimeout(() => {
          this.totalOrderList.find((x: any) => x.guid == data.guid).status =
            'cancelled';
        }, 100);
        this.tradeService.removeTrade(data.id).subscribe((data: any) => {
          this.getOrderList();
          // this.toastr.success("Trade remove successfully.")
          this._snackBar.open('Success', 'Dismiss', {
            duration: 2000,
            horizontalPosition: this.horizontalPosition,
            verticalPosition: this.verticalPosition,
          });
          this.loading = false;
        });
      }
    });
  }

  mobileDevice = false;
  mobileBtn() {
    this.mobileDevice = !this.mobileDevice;
  }
  getpnlsum(type: string) {
    if (type == 'open') {
      return _.sum(
        this.positionList
          .filter((x: any) => x.quantity != 0)
          .map((x: any) => {
            return x.pandl;
          })
      );
    } else {
      return _.sum(
        this.positionList
          .filter((x: any) => x.quantity == 0)
          .map((x: any) => {
            return x.pandl;
          })
      );
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (this.bodyEvent) {
      this.showMoreOptionForPosition = false;
      this.showMoreOption = false;
    }
    this.bodyEvent = true;
  }

  populateQty(item: any) {
    // let symbol = item.symbol;
    // if (item.strategy == 'straddle')
    //   symbol = `${this.stockList.find((s: any) => s.displayName == item.symbol).name
    //     }${moment(item.expiry).format('YYMMDD')}${item.strike}CE`;
    // if (item.strategy == 'ironfly')
    //   symbol = `${this.stockList.find((s: any) => s.displayName == item.symbol).name
    //     }${moment(item.expiry).format('YYMMDD')}${item.strike}CE`;
    // var lotSize = this.tradeService.allStockList.find(
    //   (s) => s.symbol == symbol
    // )?.lotSize;
    var lotSize = item.lotSize;
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

  sort(column: any) {
    var state = this.sortState.find((s: any) => s.column == column)?.state;

    this.mocktradeList.forEach((element: any) => {
      if (state == 'asc') {
        element.watchLists.sort(predicateByDesc(column));
        this.sortState.find((s: any) => s.column == column).state = 'desc';
      } else {
        element.watchLists.sort(predicateBy(column));
        this.sortState.find((s: any) => s.column == column).state = 'asc';
      }
    });
  }
  move(item: any, updown: any, pageNumber: any, index: any) {
    pageNumber -= 1;
    if (updown == 'down') {
      if (index == this.mocktradeList[pageNumber].watchLists.length) return;
      if (
        this.mocktradeList[pageNumber].watchLists[index].displayOrder ==
        this.mocktradeList[pageNumber].watchLists[index + 1].displayOrder
      ) {
        this.mocktradeList[pageNumber].watchLists[index].displayOrder = index;
        this.mocktradeList[pageNumber].watchLists[index + 1].displayOrder =
          index + 1;
      }

      let itemDisplayOrder =
        this.mocktradeList[pageNumber].watchLists[index].displayOrder;
      this.mocktradeList[pageNumber].watchLists[index].displayOrder =
        this.mocktradeList[pageNumber].watchLists[index + 1].displayOrder;
      this.mocktradeList[pageNumber].watchLists[index + 1].displayOrder =
        itemDisplayOrder;
    } else if (updown == 'up') {
      if (index == 0) return;
      if (
        this.mocktradeList[pageNumber].watchLists[index].displayOrder ==
        this.mocktradeList[pageNumber].watchLists[index - 1].displayOrder
      ) {
        this.mocktradeList[pageNumber].watchLists[index].displayOrder = index;
        this.mocktradeList[pageNumber].watchLists[index - 1].displayOrder =
          index - 1;
      }
      let itemDisplayOrder =
        this.mocktradeList[pageNumber].watchLists[index].displayOrder;
      this.mocktradeList[pageNumber].watchLists[index].displayOrder =
        this.mocktradeList[pageNumber].watchLists[index - 1].displayOrder;
      this.mocktradeList[pageNumber].watchLists[index - 1].displayOrder =
        itemDisplayOrder;
    }
    // this.sortWatchlists();
    this.saveWatchList(false);
  }
  sortWatchlists() {
    this.mocktradeList.forEach((mt: any) => {
      mt?.watchLists?.sort(predicateBy('displayOrder'));
    });
  }

  handleSort(orderBy: any, event: any) {
    event.target.children[0].classList.toggle('fa-caret-down');
    event.target.children[0].classList.toggle('fa-caret-up');
    const order = event.target.attributes['data-sort'].value;

    if (order === 'desc') {
      event.target.attributes['data-sort'].value = 'asc';
      this.orderListDisplay.sort(predicateByDesc(orderBy));
    } else {
      event.target.attributes['data-sort'].value = 'desc';
      this.orderListDisplay.sort(predicateBy(orderBy));
    }
  }
  handlePositionsSort(orderBy: any, event: any) {
    event.target.children[0].classList.toggle('fa-caret-down');
    event.target.children[0].classList.toggle('fa-caret-up');
    const order = event.target.attributes['data-sort'].value;
    if (order === 'desc') {
      event.target.attributes['data-sort'].value = 'asc';
      this.positionList.sort(predicateByDesc(orderBy));
    } else {
      event.target.attributes['data-sort'].value = 'desc';
      this.positionList.sort(predicateBy(orderBy));
    }
  }
  currentTime() {
    return moment(getIST()).format('YYYY-MM-DD');
  }
  convertTime(dateTime: any) {
    return moment(dateTime).format('YYYY-MM-DD');
  }
  filterPositions(positionList: any) {
    return positionList.filter(
      (item: any) => !(item.orderType == 'cnc' && item.quantity == 0)
    );
  }
  filterOrderList(orderList: any) {
    return orderList.filter(
      (item: any) =>
        moment(getIST()).format('YYYY-MM-DD') ==
        moment(item.time).format('YYYY-MM-DD')
    );
  }
  download(item: any) {}
  filterSection(selected: any) {
    selected = selected.toLowerCase();
    this.selectedSection = selected;
  }
  filterWatchLists(selected: any) {
    selected = selected.toLowerCase();
    this.selectedWatchListSection = selected;
    if (selected == 'straddle') {
      this.showSearchList = false;
      this.mocktradeList = this.mocktradeListStraddle;
      // this.loadSDWatchlist();
    } else if (selected == 'ironfly') {
      this.showSearchList = false;
      this.mocktradeList = this.mocktradeListIronfly;
      // this.loadSDWatchlist();
    } else if (selected == 'options') {
      this.showSearchList = false;
      this.mocktradeList = this.mocktradeListOptions;
      // this.loadStocksWatchlist();
    } else if (selected == 'watchlist') {
      this.mocktradeList = this.mocktradeListWatchlist;
      // this.getWatchList();
    }
  }
  loadSDWatchlist(loadoncompletion = false) {
    this.mocktradeListStraddle = [];
    this.watchListArray = [];

    for (let i = 1; i <= 4; i++) {
      let watchList = {
        watchLists: [],
      };
      this.mocktradeListStraddle.push(watchList);
      this.watchListArray.push(i);
    }

    if (loadoncompletion) this.mocktradeList = this.mocktradeListStraddle;
    this.strikeService
      .getTouchLine([
        'NIFTY 50',
        'NIFTY BANK',
        'NIFTY FIN SERVICE',
        'NIFTY MID SELECT',
      ])
      .subscribe((_touchline: any) => {
        let niftyTouchline = _touchline.find(
          (x: any) => x.symbol == 'NIFTY 50'
        );
        let bankNiftyTouchline = _touchline.find(
          (x: any) => x.symbol == 'NIFTY BANK'
        );
        let midCpNiftyTouchline = _touchline.find(
          (x: any) => x.symbol == 'NIFTY MID SELECT'
        );
        this.strikeService.getExpiry().subscribe((res: any) => {
          this.expiries = res.slice(0, 2);
          let _expiry = res[0];
          if (
            this.selectedExpiry &&
            this.expiries.find((x: any) => x == this.selectedExpiry)
          ) {
            _expiry = this.selectedExpiry;
          }
          let selectedDate = moment(_expiry).format('YYMMDD');
          this.strikeService
            .getStrikes('NIFTY', _expiry, 'CE')
            .subscribe((res: any) => {
              this.niftyStrikes = res;
              let niftySymbols: any = [];

              let niftyStrikeIndex =
                this.niftyStrikes.findIndex(
                  (st: any) => st > niftyTouchline.ltp
                ) - 1;
              let niftySDSymbols: any = [];
              for (var i = -5; i <= 5; i++) {
                niftySDSymbols.push({
                  symbol: `NIFTY${selectedDate}${
                    this.niftyStrikes[niftyStrikeIndex - i]
                  }CE`,
                  strike: this.niftyStrikes[niftyStrikeIndex - i],
                });
              }

              this.mocktradeListStraddle[0] = {
                name: 'NIFTY 50',
                watchLists: niftySDSymbols.map((x: any, i: number) => {
                  return {
                    symbol: x.symbol,
                    alias: x.symbol + ' SD',
                    tradingSymbol: x.symbol,
                    expiry: _expiry,

                    lotSize: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.lotSize,
                    strike: x.strike,
                    display: true,
                    displayOrder: i,
                  };
                }),
              };

              var groupedElements = _.groupBy(
                this.mocktradeListStraddle[0].watchLists,
                'strike'
              );

              var elements: any = [];
              _.map(groupedElements, (val, key) => {
                let ceSymbol = `NIFTY${selectedDate}${key}CE`;
                let peSymbol = `NIFTY${selectedDate}${key}PE`;
                niftySymbols.push(ceSymbol);
                niftySymbols.push(peSymbol);

                let _element = {
                  alias: `NIFTY ${moment(val[0].expiry)
                    .format('MMM')
                    .toUpperCase()} ${key} SD`,

                  lotSize: val[0].lotSize,
                  expiry: val[0].expiry,

                  ceSymbol: ceSymbol,
                  peSymbol: peSymbol,

                  strike: key,

                  display: true,
                  marketDepth: [
                    {
                      askPrice: 0,
                      bidPrice: 0,
                      askQty: 0,
                      bidQty: 0,
                    },
                  ],
                };
                elements.push(_element);
              });
              this.mocktradeListStraddle[0].watchLists = elements;

              this.subscribeSymbols(niftySymbols);

              this.strikeService
                .getTouchLine(niftySymbols)
                .subscribe((_touchline: any) => {
                  this.mocktradeListStraddle[0].watchLists.forEach(
                    (element: any) => {
                      let ceTouchline = _touchline.find(
                        (t: any) => t.symbol == element.ceSymbol
                      );
                      let peTouchline = _touchline.find(
                        (t: any) => t.symbol == element.peSymbol
                      );

                      element.ceSymbolId = ceTouchline?.symbolId;
                      element.peSymbolId = peTouchline?.symbolId;
                      element.peLtp = peTouchline.ltp;
                      element.ceLtp = ceTouchline.ltp;
                      element.ltp = ceTouchline.ltp + peTouchline.ltp;
                      // this.updateLIVELTP(element.alias, element.ltp)
                      element.cePreviousClose = ceTouchline.previousClose;
                      element.pePreviousClose = peTouchline.previousClose;
                      element.open = peTouchline.open + ceTouchline.open;
                      element.previousClose =
                        peTouchline.previousClose + ceTouchline.previousClose;

                      element.changePercentage =
                        ((ceTouchline.ltp -
                          ceTouchline.previousClose +
                          (peTouchline.ltp - peTouchline.previousClose)) *
                          100) /
                        (ceTouchline.previousClose + peTouchline.previousClose);
                    }
                  );

                  let newSymbols = niftySDSymbols
                    .map((x: any) => {
                      return x.symbol;
                    })
                    .filter(
                      (x: any) =>
                        !this.tradeService.allStockList.some(
                          (s) => s.symbol == x
                        )
                    );
                  if (newSymbols.length > 0) {
                    this.strikeService
                      .getSymbolsDetails(newSymbols)
                      .subscribe((res: any) => {
                        res.forEach((element: any) => {
                          if (
                            this.tradeService.allStockList.find(
                              (s) => s.symbol == element.symbol
                            ) == undefined
                          )
                            this.tradeService.allStockList.push(element);
                        });
                        localStorage.setItem(
                          'allStockList',
                          this.encService.encrypt(
                            JSON.stringify(this.tradeService.allStockList)
                          )
                        );
                        this.mocktradeListStraddle[0].watchLists.forEach(
                          (element: any) => {
                            element.expiry = res.find(
                              (t: any) => t.symbol == element.ceSymbol
                            ).expiry;
                            element.lotSize = res.find(
                              (t: any) => t.symbol == element.ceSymbol
                            ).lotSize;
                          }
                        );
                      });
                  }
                });
            });
        });

        this.strikeService.getExpiryByCalendarId(5).subscribe((res: any) => {
          this.bankNiftyExpiries = res.slice(0, 2);
          let _expiry = res[0];
          if (!this.selectedBankNiftyExpiry)
            this.selectedBankNiftyExpiry = _expiry;

          if (
            this.selectedBankNiftyExpiry &&
            this.bankNiftyExpiries.find(
              (x: any) => x == this.selectedBankNiftyExpiry
            )
          ) {
            _expiry = this.selectedBankNiftyExpiry;
          }
          let selectedDate = moment(_expiry).format('YYMMDD');
          this.strikeService
            .getStrikes('BANKNIFTY', _expiry, 'CE')
            .subscribe((res: any) => {
              let bankNiftySymbols: any = [];

              let bankNiftyStrikes = res;
              this.bankNiftyStrikes = res;
              if (bankNiftyTouchline != undefined) {
                let bankNiftyStrikeIndex =
                  bankNiftyStrikes.findIndex(
                    (st: any) => st > bankNiftyTouchline.ltp
                  ) - 1;
                let bankNiftySDSymbols: any = [];
                for (var i = -5; i <= 5; i++) {
                  bankNiftySDSymbols.push({
                    symbol: `BANKNIFTY${selectedDate}${
                      bankNiftyStrikes[bankNiftyStrikeIndex - i]
                    }CE`,
                    strike: bankNiftyStrikes[bankNiftyStrikeIndex - i],
                  });
                }
                for (var i = -5; i <= 5; i++) {
                  bankNiftySDSymbols.push({
                    symbol: `BANKNIFTY${selectedDate}${
                      bankNiftyStrikes[bankNiftyStrikeIndex - i]
                    }CE`,
                    strike: bankNiftyStrikes[bankNiftyStrikeIndex - i],
                  });
                }

                this.mocktradeListStraddle[1] = {
                  name: 'NIFTY BANK',
                  watchLists: bankNiftySDSymbols.map((x: any, i: any) => {
                    return {
                      symbol: x.symbol,
                      alias: x.symbol + ' SD',
                      tradingSymbol: x.symbol,
                      expiry: this.selectedBankNiftyExpiry,

                      lotSize: this.tradeService.allStockList.find(
                        (s) => s.symbol == x.symbol
                      )?.lotSize,
                      strike: x.strike,
                      display: x.display ?? true,
                      displayOrder: i,
                    };
                  }),
                };

                var groupedBNFElements = _.groupBy(
                  this.mocktradeListStraddle[1].watchLists,
                  'strike'
                );
                var elements: any = [];
                _.map(groupedBNFElements, (val, key) => {
                  let ceSymbol = `BANKNIFTY${selectedDate}${key}CE`;
                  let peSymbol = `BANKNIFTY${selectedDate}${key}PE`;
                  bankNiftySymbols.push(ceSymbol);
                  bankNiftySymbols.push(peSymbol);

                  let _element = {
                    alias: `BANKNIFTY ${moment(_expiry)
                      .format('MMM')
                      .toUpperCase()} ${key} SD`,

                    lotSize: val[0].lotSize,
                    expiry: val[0].expiry,

                    ceSymbol: ceSymbol,
                    peSymbol: peSymbol,

                    strike: key,

                    display: true,
                    marketDepth: [
                      {
                        askPrice: 0,
                        bidPrice: 0,
                        askQty: 0,
                        bidQty: 0,
                      },
                    ],
                  };
                  elements.push(_element);
                });
                this.mocktradeListStraddle[1].watchLists = elements;

                this.subscribeSymbols(bankNiftySymbols);
                this.strikeService
                  .getTouchLine(bankNiftySymbols)
                  .subscribe((_touchline: any) => {
                    this.mocktradeListStraddle[1].watchLists.forEach(
                      (element: any) => {
                        let ceTouchline = _touchline.find(
                          (t: any) => t.symbol == element.ceSymbol
                        );
                        let peTouchline = _touchline.find(
                          (t: any) => t.symbol == element.peSymbol
                        );

                        element.ceSymbolId = ceTouchline?.symbolId;
                        element.peSymbolId = peTouchline?.symbolId;
                        element.peLtp = peTouchline.ltp;
                        element.ceLtp = ceTouchline.ltp;
                        element.ltp = ceTouchline.ltp + peTouchline.ltp;
                        // this.updateLIVELTP(element.alias, element.ltp);
                        element.cePreviousClose = ceTouchline.previousClose;
                        element.pePreviousClose = peTouchline.previousClose;
                        element.open = peTouchline.open + ceTouchline.open;
                        element.previousClose =
                          peTouchline.previousClose + ceTouchline.previousClose;

                        element.changePercentage =
                          ((ceTouchline.ltp -
                            ceTouchline.previousClose +
                            (peTouchline.ltp - peTouchline.previousClose)) *
                            100) /
                          (ceTouchline.previousClose +
                            peTouchline.previousClose);
                      }
                    );
                    let newSymbols = bankNiftySDSymbols
                      .map((x: any) => {
                        return x.symbol;
                      })
                      .filter(
                        (x: any) =>
                          !this.tradeService.allStockList.some(
                            (s) => s.symbol == x
                          )
                      );
                    if (newSymbols.length > 0) {
                      this.strikeService
                        .getSymbolsDetails(newSymbols)
                        .subscribe((res: any) => {
                          res.forEach((element: any) => {
                            if (
                              this.tradeService.allStockList.find(
                                (s) => s.symbol == element.symbol
                              ) == undefined
                            )
                              this.tradeService.allStockList.push(element);
                          });
                          localStorage.setItem(
                            'allStockList',
                            this.encService.encrypt(
                              JSON.stringify(this.tradeService.allStockList)
                            )
                          );
                          this.mocktradeListStraddle[1].watchLists.forEach(
                            (element: any) => {
                              element.expiry = res.find(
                                (t: any) => t.symbol == element.ceSymbol
                              )?.expiry;
                              element.lotSize = res.find(
                                (t: any) => t.symbol == element.ceSymbol
                              )?.lotSize;
                            }
                          );
                        });
                    }
                  });
              }
            });
        });

        //#region MID CP NIDTY STRADDLE
        this.strikeService
          .getExpiryByCalendarId(4)
          .subscribe((_expiry: any) => {
            this.midCPNiftyExpiries = _expiry.slice(0, 2);
            let expiry = _expiry[0];
            let selectedDate = moment(expiry).format('YYMMDD');
            if (this.selectedMIDCPNIFTYExpiry) {
              expiry = this.selectedMIDCPNIFTYExpiry;
              selectedDate = moment(this.selectedMIDCPNIFTYExpiry).format(
                'YYMMDD'
              );
            }
            this.strikeService
              .getStrikes('MIDCPNIFTY', expiry, 'CE')
              .subscribe((res: any) => {
                let symbols: any = [];

                let strikes = res;
                this.midcpNiftyStrikes = res;
                if (midCpNiftyTouchline != undefined) {
                  let strikeIndex =
                    strikes.findIndex(
                      (st: any) => st > midCpNiftyTouchline.ltp
                    ) - 1;
                  let SDSymbols: any = [];
                  for (var i = -5; i <= 5; i++) {
                    SDSymbols.push({
                      symbol: `MIDCPNIFTY${selectedDate}${
                        strikes[strikeIndex - i]
                      }CE`,
                      strike: strikes[strikeIndex - i],
                    });
                  }
                  for (var i = -5; i <= 5; i++) {
                    SDSymbols.push({
                      symbol: `MIDCPNIFTY${selectedDate}${
                        strikes[strikeIndex - i]
                      }CE`,
                      strike: strikes[strikeIndex - i],
                    });
                  }

                  this.mocktradeListStraddle[3] = {
                    name: 'MIDCPNIFTY',
                    watchLists: SDSymbols.map((x: any, i: any) => {
                      return {
                        symbol: x.symbol,
                        alias: x.symbol + ' SD',
                        tradingSymbol: x.symbol,
                        expiry: expiry,

                        lotSize: this.tradeService.allStockList.find(
                          (s) => s.symbol == x.symbol
                        )?.lotSize,
                        strike: x.strike,
                        display: x.display ?? true,
                        displayOrder: i,
                      };
                    }),
                  };

                  var groupedBNFElements = _.groupBy(
                    this.mocktradeListStraddle[3].watchLists,
                    'strike'
                  );
                  var elements: any = [];
                  _.map(groupedBNFElements, (val, key) => {
                    let ceSymbol = `MIDCPNIFTY${selectedDate}${key}CE`;
                    let peSymbol = `MIDCPNIFTY${selectedDate}${key}PE`;
                    symbols.push(ceSymbol);
                    symbols.push(peSymbol);

                    let _element = {
                      alias: `MIDCPNIFTY ${moment(expiry)
                        .format('MMM')
                        .toUpperCase()} ${key} SD`,

                      lotSize: val[0].lotSize,
                      expiry: val[0].expiry,

                      ceSymbol: ceSymbol,
                      peSymbol: peSymbol,

                      strike: key,

                      display: true,
                      marketDepth: [
                        {
                          askPrice: 0,
                          bidPrice: 0,
                          askQty: 0,
                          bidQty: 0,
                        },
                      ],
                    };
                    elements.push(_element);
                  });
                  this.mocktradeListStraddle[3].watchLists = elements;

                  this.subscribeSymbols(symbols);
                  this.strikeService
                    .getTouchLine(symbols)
                    .subscribe((_touchline: any) => {
                      this.mocktradeListStraddle[3].watchLists.forEach(
                        (element: any) => {
                          let ceTouchline = _touchline.find(
                            (t: any) => t.symbol == element.ceSymbol
                          );
                          let peTouchline = _touchline.find(
                            (t: any) => t.symbol == element.peSymbol
                          );

                          element.ceSymbolId = ceTouchline?.symbolId;
                          element.peSymbolId = peTouchline?.symbolId;
                          element.peLtp = peTouchline.ltp;
                          element.ceLtp = ceTouchline.ltp;
                          element.ltp = ceTouchline.ltp + peTouchline.ltp;
                          // this.updateLIVELTP(element.alias, element.ltp);
                          element.cePreviousClose = ceTouchline.previousClose;
                          element.pePreviousClose = peTouchline.previousClose;
                          element.open = peTouchline.open + ceTouchline.open;
                          element.previousClose =
                            peTouchline.previousClose +
                            ceTouchline.previousClose;

                          element.changePercentage =
                            ((ceTouchline.ltp -
                              ceTouchline.previousClose +
                              (peTouchline.ltp - peTouchline.previousClose)) *
                              100) /
                            (ceTouchline.previousClose +
                              peTouchline.previousClose);
                        }
                      );
                      let newSymbols = SDSymbols.map((x: any) => {
                        return x.symbol;
                      }).filter(
                        (x: any) =>
                          !this.tradeService.allStockList.some(
                            (s) => s.symbol == x
                          )
                      );
                      if (newSymbols.length > 0) {
                        this.strikeService
                          .getSymbolsDetails(newSymbols)
                          .subscribe((res: any) => {
                            res.forEach((element: any) => {
                              if (
                                this.tradeService.allStockList.find(
                                  (s) => s.symbol == element.symbol
                                ) == undefined
                              )
                                this.tradeService.allStockList.push(element);
                            });
                            localStorage.setItem(
                              'allStockList',
                              this.encService.encrypt(
                                JSON.stringify(this.tradeService.allStockList)
                              )
                            );
                            this.mocktradeListStraddle[1].watchLists.forEach(
                              (element: any) => {
                                element.expiry = res.find(
                                  (t: any) => t.symbol == element.ceSymbol
                                )?.expiry;
                                element.lotSize = res.find(
                                  (t: any) => t.symbol == element.ceSymbol
                                )?.lotSize;
                              }
                            );
                          });
                      }
                    });
                }
              });
          });

        //#endregion
        this.strikeService
          .getExpiryByCalendarId(3)
          .subscribe((_expiry: any) => {
            this.finniftyExpiries = _expiry.slice(0, 2);
            let finNiftyExpiry = _expiry[0];
            if (
              this.selectedFINNIFTYExpiry &&
              this.finniftyExpiries.find(
                (x: any) => x == this.selectedFINNIFTYExpiry
              )
            ) {
              finNiftyExpiry = this.selectedFINNIFTYExpiry;
            }

            let finNiftySymbols: any = [];
            let finNiftyTouchline = _touchline.find(
              (x: any) => x.symbol == 'NIFTY FIN SERVICE'
            );
            let selectedDate = moment(finNiftyExpiry).format('YYMMDD');
            this.strikeService
              .getStrikes('FINNIFTY', finNiftyExpiry, 'CE')
              .subscribe((res: any) => {
                let finNiftyStrikes = res;
                this.finNiftyStrikes = res;

                let finNiftyStrikeIndex =
                  finNiftyStrikes.findIndex(
                    (st: any) => st > finNiftyTouchline.ltp
                  ) - 1;
                let finNiftySDSymbols: any = [];
                for (var i = -5; i <= 5; i++) {
                  finNiftySDSymbols.push({
                    symbol: `FINNIFTY${selectedDate}${
                      finNiftyStrikes[finNiftyStrikeIndex - i]
                    }CE`,
                    strike: finNiftyStrikes[finNiftyStrikeIndex - i],
                  });
                }

                finNiftySDSymbols.sort(predicateByDesc('strike'));
                var finniftySDWatchlist = {
                  name: 'NIFTY FIN SERVICE',
                  watchLists: finNiftySDSymbols.map((x: any, i: number) => {
                    return {
                      symbol: x.symbol,
                      alias: x.symbol + ' SD',
                      tradingSymbol: x.symbol,
                      expiry: finNiftyExpiry,
                      lotSize: this.tradeService.allStockList.find(
                        (s) => s.symbol == x.symbol
                      )?.lotSize,
                      strike: x.strike,
                      display: x.display ?? true,
                      displayOrder: i,
                    };
                  }),
                };
                var groupedFNElements = _.groupBy(
                  finniftySDWatchlist.watchLists,
                  'strike'
                );
                var elements: any = [];
                _.map(groupedFNElements, (val, key) => {
                  let ceSymbol = `FINNIFTY${selectedDate}${key}CE`;
                  let peSymbol = `FINNIFTY${selectedDate}${key}PE`;
                  finNiftySymbols.push(ceSymbol);
                  finNiftySymbols.push(peSymbol);

                  let _element = {
                    alias: `FINNIFTY ${moment(finNiftyExpiry)
                      .format('MMM')
                      .toUpperCase()} ${key} SD`,

                    lotSize: val[0].lotSize,
                    expiry: finNiftyExpiry,

                    ceSymbol: ceSymbol,
                    peSymbol: peSymbol,

                    strike: key,

                    display: true,
                    marketDepth: [
                      {
                        askPrice: 0,
                        bidPrice: 0,
                        askQty: 0,
                        bidQty: 0,
                      },
                    ],
                  };
                  elements.push(_element);
                });
                finniftySDWatchlist.watchLists = elements;
                this.mocktradeListStraddle[2] = finniftySDWatchlist;
                let newSymbols = finniftySDWatchlist.watchLists
                  .map((x: any) => {
                    return x.ceSymbol;
                  })
                  .filter(
                    (x: any) =>
                      !this.tradeService.allStockList.some((s) => s.symbol == x)
                  );
                if (newSymbols.length > 0) {
                  this.strikeService
                    .getSymbolsDetails(newSymbols)
                    .subscribe((res: any) => {
                      res.forEach((element: any) => {
                        if (
                          this.tradeService.allStockList.find(
                            (s) => s.symbol == element.symbol
                          ) == undefined
                        )
                          this.tradeService.allStockList.push(element);
                      });
                      localStorage.setItem(
                        'allStockList',
                        this.encService.encrypt(
                          JSON.stringify(this.tradeService.allStockList)
                        )
                      );
                      this.mocktradeListStraddle[2].watchLists.forEach(
                        (element: any) => {
                          element.lotSize = res.find(
                            (t: any) => t.symbol == element.ceSymbol
                          ).lotSize;
                        }
                      );
                    });
                }
                this.strikeService
                  .getTouchLine(finNiftySymbols)
                  .subscribe((_touchline: any) => {
                    this.mocktradeListStraddle[2].watchLists.forEach(
                      (element: any) => {
                        let ceTouchline = _touchline.find(
                          (t: any) => t.symbol == element.ceSymbol
                        );
                        let peTouchline = _touchline.find(
                          (t: any) => t.symbol == element.peSymbol
                        );

                        element.ceSymbolId = ceTouchline?.symbolId;
                        element.peSymbolId = peTouchline?.symbolId;
                        element.peLtp = peTouchline.ltp;
                        element.ceLtp = ceTouchline.ltp;
                        element.ltp = ceTouchline.ltp + peTouchline.ltp;
                        // this.updateLIVELTP(element.alias, element.ltp)
                        element.cePreviousClose = ceTouchline.previousClose;
                        element.pePreviousClose = peTouchline.previousClose;
                        element.open = peTouchline.open + ceTouchline.open;
                        element.previousClose =
                          peTouchline.previousClose + ceTouchline.previousClose;

                        element.changePercentage =
                          ((ceTouchline.ltp -
                            ceTouchline.previousClose +
                            (peTouchline.ltp - peTouchline.previousClose)) *
                            100) /
                          (ceTouchline.previousClose +
                            peTouchline.previousClose);
                      }
                    );
                  });
              });
          });
      });
  }
  // loadIFWatchlist(loadoncompletion = false) {
  //   this.mocktradeListIronfly = [];
  //   this.watchListArray = [];

  //   for (let i = 1; i <= 3; i++) {
  //     let watchList = {
  //       watchLists: [],
  //     };
  //     this.mocktradeListIronfly.push(watchList);
  //     this.watchListArray.push(i);
  //   }
  //   if (loadoncompletion) this.mocktradeList = this.mocktradeListIronfly;
  //   this.strikeService
  //     .getTouchLine(['NIFTY 50', 'NIFTY BANK', 'NIFTY FIN SERVICE'])
  //     .subscribe((_touchline: any) => {
  //       let niftyTouchline = _touchline.find(
  //         (x: any) => x.symbol == 'NIFTY 50'
  //       );
  //       let bankNiftyTouchline = _touchline.find(
  //         (x: any) => x.symbol == 'NIFTY BANK'
  //       );
  //       this.strikeService.getExpiry().subscribe((res: any) => {
  //         this.expiries = res.slice(0, 2);
  //         let _expiry = res[0];
  //         if (
  //           this.selectedExpiry &&
  //           this.expiries.find((x: any) => x == this.selectedExpiry)
  //         ) {
  //           _expiry = this.selectedExpiry;
  //         }
  //         let selectedDate = moment(_expiry).format('YYMMDD');
  //         this.strikeService
  //           .getStrikes('NIFTY', _expiry, 'CE')
  //           .subscribe((res: any) => {
  //             let niftyStrikes = res;
  //             let niftySymbols: any = [];

  //             let niftyStrikeIndex =
  //               niftyStrikes.findIndex((st: any) => st > niftyTouchline.ltp) -
  //               1;
  //             let niftyIFSymbols: any = [];
  //             for (var i = -3; i <= 3; i++) {
  //               niftyIFSymbols.push({
  //                 symbol: `NIFTY${selectedDate}${
  //                   niftyStrikes[niftyStrikeIndex - i]
  //                 }`,
  //                 symbol1: `NIFTY${selectedDate}${
  //                   niftyStrikes[niftyStrikeIndex - i]
  //                 }CE`,
  //                 symbol2: `NIFTY${selectedDate}${
  //                   niftyStrikes[niftyStrikeIndex - i]
  //                 }PE`,
  //                 symbol3: `NIFTY${selectedDate}${
  //                   niftyStrikes[niftyStrikeIndex - (i - 2)]
  //                 }CE`,
  //                 symbol4: `NIFTY${selectedDate}${
  //                   niftyStrikes[niftyStrikeIndex - (i + 2)]
  //                 }PE`,
  //                 strike: niftyStrikes[niftyStrikeIndex - i],
  //               });
  //             }

  //             this.mocktradeListIronfly[0] = {
  //               name: 'NIFTY 50',
  //               watchLists: niftyIFSymbols.map((x: any, i: number) => {
  //                 return {
  //                   symbol: x.symbol,
  //                   symbol1: x.symbol1,
  //                   symbol2: x.symbol2,
  //                   symbol3: x.symbol3,
  //                   symbol4: x.symbol4,
  //                   alias: x.symbol + ' IF',
  //                   tradingSymbol: x.symbol,
  //                   expiry: _expiry,

  //                   lotSize: this.tradeService.allStockList.find(
  //                     (s) => s.symbol == x.symbol1
  //                   )?.lotSize,
  //                   strike: x.strike,
  //                   display: true,
  //                   displayOrder: i,
  //                 };
  //               }),
  //             };

  //             var elements: any = [];

  //             this.mocktradeListIronfly[0].watchLists.forEach(
  //               (element: any) => {
  //                 niftySymbols.push(element.symbol1);
  //                 niftySymbols.push(element.symbol2);
  //                 niftySymbols.push(element.symbol3);
  //                 niftySymbols.push(element.symbol4);

  //                 let _element = {
  //                   alias: `NIFTY ${moment(element.expiry)
  //                     .format('MMM')
  //                     .toUpperCase()} ${element.strike} IF`,
  //                   symbol1: element.symbol1,
  //                   symbol2: element.symbol2,
  //                   symbol3: element.symbol3,
  //                   symbol4: element.symbol4,
  //                   lotSize: element.lotSize,
  //                   expiry: element.expiry,

  //                   strike: element.strike,

  //                   display: true,
  //                   marketDepth: [
  //                     {
  //                       askPrice: 0,
  //                       bidPrice: 0,
  //                       askQty: 0,
  //                       bidQty: 0,
  //                     },
  //                   ],
  //                 };
  //                 elements.push(_element);
  //               }
  //             );

  //             this.mocktradeListIronfly[0].watchLists = elements;

  //             this.subscribeSymbols(niftySymbols);

  //             this.strikeService
  //               .getTouchLine(niftySymbols)
  //               .subscribe((_touchline: any) => {
  //                 this.mocktradeListIronfly[0].watchLists.forEach(
  //                   (element: any) => {
  //                     let touchline1 = _touchline.find(
  //                       (t: any) => t.symbol == element.symbol1
  //                     );
  //                     let touchline2 = _touchline.find(
  //                       (t: any) => t.symbol == element.symbol2
  //                     );
  //                     let touchline3 = _touchline.find(
  //                       (t: any) => t.symbol == element.symbol3
  //                     );
  //                     let touchline4 = _touchline.find(
  //                       (t: any) => t.symbol == element.symbol4
  //                     );

  //                     element.symbol1Id = touchline1?.symbolId;
  //                     element.symbol2Id = touchline2?.symbolId;
  //                     element.symbol3Id = touchline3?.symbolId;
  //                     element.symbol4Id = touchline4?.symbolId;

  //                     element.ltp1 = touchline1?.ltp;
  //                     element.ltp2 = touchline2?.ltp;
  //                     element.ltp3 = touchline3?.ltp;
  //                     element.ltp4 = touchline4?.ltp;

  //                     element.open1 = touchline1?.open;
  //                     element.open2 = touchline2?.open;
  //                     element.open3 = touchline3?.open;
  //                     element.open4 = touchline4?.open;

  //                     element.previousClose1 = touchline1?.previousClose;
  //                     element.previousClose2 = touchline2?.previousClose;
  //                     element.previousClose3 = touchline3?.previousClose;
  //                     element.previousClose4 = touchline4?.previousClose;

  //                     element.ltp =
  //                       element.ltp1 +
  //                       element.ltp2 -
  //                       element.ltp3 -
  //                       element.ltp4;

  //                     element.previousClose =
  //                       element.previousClose1 +
  //                       element.previousClose2 -
  //                       element.previousClose3 -
  //                       element.previousClose4;
  //                     element.open =
  //                       element.open1 +
  //                       element.open2 -
  //                       element.open3 -
  //                       element.open4;

  //                     element.changePercentage =
  //                       ((element.ltp1 -
  //                         element.previousClose1 +
  //                         (element.ltp2 - element.previousClose2) -
  //                         (element.ltp3 - element.previousClose3) -
  //                         (element.ltp4 - element.previousClose4)) *
  //                         100) /
  //                       (element.previousClose1 +
  //                         element.previousClose2 -
  //                         element.previousClose3 -
  //                         element.previousClose4);
  //                   }
  //                 );

  //                 let newSymbols = niftyIFSymbols
  //                   .map((x: any) => {
  //                     return x.symbol1;
  //                   })
  //                   .filter(
  //                     (x: any) =>
  //                       !this.tradeService.allStockList.some(
  //                         (s) => s.symbol == x
  //                       )
  //                   );
  //                 if (newSymbols.length > 0) {
  //                   this.strikeService
  //                     .getSymbolsDetails(newSymbols)
  //                     .subscribe((res: any) => {
  //                       res.forEach((element: any) => {
  //                         if (
  //                           this.tradeService.allStockList.find(
  //                             (s) => s.symbol == element.symbol
  //                           ) == undefined
  //                         )
  //                           this.tradeService.allStockList.push(element);
  //                       });
  //                       localStorage.setItem(
  //                         'allStockList',
  //                         this.encService.encrypt(
  //                           JSON.stringify(this.tradeService.allStockList)
  //                         )
  //                       );
  //                       // console.log(this.mocktradeListIronfly[0].watchLists)
  //                       this.mocktradeListIronfly[0].watchLists.forEach(
  //                         (element: any) => {
  //                           // element.expiry = res.find(
  //                           //   (t: any) => t.symbol == element.symbol1
  //                           // ).expiry;
  //                           element.lotSize = res.find(
  //                             (t: any) => t.symbol == element.symbol1
  //                           )?.lotSize;
  //                         }
  //                       );
  //                     });
  //                 }
  //               });
  //           });

  //         this.strikeService
  //           .getStrikes('BANKNIFTY', _expiry, 'CE')
  //           .subscribe((res: any) => {
  //             let bankNiftySymbols: any = [];

  //             let bankNiftyStrikes = res;

  //             if (bankNiftyTouchline != undefined) {
  //               let bankNiftyStrikeIndex =
  //                 bankNiftyStrikes.findIndex(
  //                   (st: any) => st > bankNiftyTouchline.ltp
  //                 ) - 1;
  //               let bankNiftyIFSymbols: any = [];

  //               for (var i = -3; i <= 3; i++) {
  //                 bankNiftyIFSymbols.push({
  //                   symbol: `BANKNIFTY${selectedDate}${
  //                     bankNiftyStrikes[bankNiftyStrikeIndex - i]
  //                   }`,
  //                   symbol1: `BANKNIFTY${selectedDate}${
  //                     bankNiftyStrikes[bankNiftyStrikeIndex - i]
  //                   }CE`,
  //                   symbol2: `BANKNIFTY${selectedDate}${
  //                     bankNiftyStrikes[bankNiftyStrikeIndex - i]
  //                   }PE`,
  //                   symbol3: `BANKNIFTY${selectedDate}${
  //                     bankNiftyStrikes[bankNiftyStrikeIndex - (i - 2)]
  //                   }CE`,
  //                   symbol4: `BANKNIFTY${selectedDate}${
  //                     bankNiftyStrikes[bankNiftyStrikeIndex - (i + 2)]
  //                   }PE`,
  //                   strike: bankNiftyStrikes[bankNiftyStrikeIndex - i],
  //                 });
  //               }

  //               this.mocktradeListIronfly[1] = {
  //                 name: 'NIFTY BANK',
  //                 watchLists: bankNiftyIFSymbols.map((x: any, i: any) => {
  //                   return {
  //                     symbol: x.symbol,
  //                     symbol1: x.symbol1,
  //                     symbol2: x.symbol2,
  //                     symbol3: x.symbol3,
  //                     symbol4: x.symbol4,
  //                     alias: x.symbol + ' IF',
  //                     tradingSymbol: x.symbol,
  //                     expiry: this.selectedExpiry,

  //                     lotSize: this.tradeService.allStockList.find(
  //                       (s) => s.symbol == x.symbol1
  //                     )?.lotSize,
  //                     strike: x.strike,
  //                     display: true,
  //                     displayOrder: i,
  //                   };
  //                 }),
  //               };

  //               var elements: any = [];
  //               this.mocktradeListIronfly[1].watchLists.forEach(
  //                 (element: any) => {
  //                   bankNiftySymbols.push(element.symbol1);
  //                   bankNiftySymbols.push(element.symbol2);
  //                   bankNiftySymbols.push(element.symbol3);
  //                   bankNiftySymbols.push(element.symbol4);

  //                   let _element = {
  //                     alias: `BANKNIFTY ${moment(_expiry)
  //                       .format('MMM')
  //                       .toUpperCase()} ${element.strike} IF`,
  //                     symbol1: element.symbol1,
  //                     symbol2: element.symbol2,
  //                     symbol3: element.symbol3,
  //                     symbol4: element.symbol4,
  //                     lotSize: element.lotSize,
  //                     expiry: element.expiry,

  //                     strike: element.strike,

  //                     display: true,
  //                     marketDepth: [
  //                       {
  //                         askPrice: 0,
  //                         bidPrice: 0,
  //                         askQty: 0,
  //                         bidQty: 0,
  //                       },
  //                     ],
  //                   };
  //                   elements.push(_element);
  //                 }
  //               );
  //               this.mocktradeListIronfly[1].watchLists = elements;

  //               this.subscribeSymbols(bankNiftySymbols);
  //               this.strikeService
  //                 .getTouchLine(bankNiftySymbols)
  //                 .subscribe((_touchline: any) => {
  //                   this.mocktradeListIronfly[1].watchLists.forEach(
  //                     (element: any) => {
  //                       let touchline1 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol1
  //                       );
  //                       let touchline2 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol2
  //                       );
  //                       let touchline3 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol3
  //                       );
  //                       let touchline4 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol4
  //                       );

  //                       element.symbol1Id = touchline1?.symbolId;
  //                       element.symbol2Id = touchline2?.symbolId;
  //                       element.symbol3Id = touchline3?.symbolId;
  //                       element.symbol4Id = touchline4?.symbolId;

  //                       element.ltp1 = touchline1?.ltp;
  //                       element.ltp2 = touchline2?.ltp;
  //                       element.ltp3 = touchline3?.ltp;
  //                       element.ltp4 = touchline4?.ltp;

  //                       element.open1 = touchline1?.open;
  //                       element.open2 = touchline2?.open;
  //                       element.open3 = touchline3?.open;
  //                       element.open4 = touchline4?.open;

  //                       element.previousClose1 = touchline1?.previousClose;
  //                       element.previousClose2 = touchline2?.previousClose;
  //                       element.previousClose3 = touchline3?.previousClose;
  //                       element.previousClose4 = touchline4?.previousClose;

  //                       element.ltp =
  //                         element.ltp1 +
  //                         element.ltp2 -
  //                         element.ltp3 -
  //                         element.ltp4;

  //                       element.previousClose =
  //                         element.previousClose1 +
  //                         element.previousClose2 -
  //                         element.previousClose3 -
  //                         element.previousClose4;
  //                       element.open =
  //                         element.open1 +
  //                         element.open2 -
  //                         element.open3 -
  //                         element.open4;

  //                       element.changePercentage =
  //                         ((element.ltp1 -
  //                           element.previousClose1 +
  //                           (element.ltp2 - element.previousClose2) -
  //                           (element.ltp3 - element.previousClose3) -
  //                           (element.ltp4 - element.previousClose4)) *
  //                           100) /
  //                         (element.previousClose1 +
  //                           element.previousClose2 -
  //                           element.previousClose3 -
  //                           element.previousClose4);
  //                     }
  //                   );
  //                   let newSymbols = bankNiftyIFSymbols
  //                     .map((x: any) => {
  //                       return x.symbol1;
  //                     })
  //                     .filter(
  //                       (x: any) =>
  //                         !this.tradeService.allStockList.some(
  //                           (s) => s.symbol == x
  //                         )
  //                     );
  //                   if (newSymbols.length > 0) {
  //                     this.strikeService
  //                       .getSymbolsDetails(newSymbols)
  //                       .subscribe((res: any) => {
  //                         res.forEach((element: any) => {
  //                           if (
  //                             this.tradeService.allStockList.find(
  //                               (s) => s.symbol == element.symbol
  //                             ) == undefined
  //                           )
  //                             this.tradeService.allStockList.push(element);
  //                         });
  //                         localStorage.setItem(
  //                           'allStockList',
  //                           this.encService.encrypt(
  //                             JSON.stringify(this.tradeService.allStockList)
  //                           )
  //                         );
  //                         this.mocktradeListIronfly[1].watchLists.forEach(
  //                           (element: any) => {
  //                             // element.expiry = res.find(
  //                             //   (t: any) => t.symbol == element.symbol1
  //                             // )?.expiry;
  //                             element.lotSize = res.find(
  //                               (t: any) => t.symbol == element.symbol1
  //                             )?.lotSize;
  //                           }
  //                         );
  //                       });
  //                   }
  //                 });
  //             }
  //           });
  //       });
  //       this.strikeService
  //         .getExpiryByCalendarId(3)
  //         .subscribe((_expiry: any) => {
  //           this.finniftyExpiries = _expiry.slice(0, 2);
  //           let finNiftyExpiry = _expiry[0];
  //           if (
  //             this.selectedFINNIFTYExpiry &&
  //             this.finniftyExpiries.find(
  //               (x: any) => x == this.selectedFINNIFTYExpiry
  //             )
  //           ) {
  //             finNiftyExpiry = this.selectedFINNIFTYExpiry;
  //           }

  //           let finNiftySymbols: any = [];
  //           let finNiftyTouchline = _touchline.find(
  //             (x: any) => x.symbol == 'NIFTY FIN SERVICE'
  //           );

  //           this.strikeService
  //             .getStrikes('FINNIFTY', finNiftyExpiry, 'CE')
  //             .subscribe((res: any) => {
  //               let finNiftyStrikes = res;
  //               let finNiftyselectedDate =
  //                 moment(finNiftyExpiry).format('YYMMDD');

  //               let finNiftyStrikeIndex =
  //                 finNiftyStrikes.findIndex(
  //                   (st: any) => st > finNiftyTouchline.ltp
  //                 ) - 1;
  //               let finNiftyIFSymbols: any = [];
  //               for (var i = -3; i <= 3; i++) {
  //                 finNiftyIFSymbols.push({
  //                   symbol: `FINNIFTY${finNiftyselectedDate}${
  //                     finNiftyStrikes[finNiftyStrikeIndex - i]
  //                   }`,
  //                   symbol1: `FINNIFTY${finNiftyselectedDate}${
  //                     finNiftyStrikes[finNiftyStrikeIndex - i]
  //                   }CE`,
  //                   symbol2: `FINNIFTY${finNiftyselectedDate}${
  //                     finNiftyStrikes[finNiftyStrikeIndex - i]
  //                   }PE`,
  //                   symbol3: `FINNIFTY${finNiftyselectedDate}${
  //                     finNiftyStrikes[finNiftyStrikeIndex - (i - 2)]
  //                   }CE`,
  //                   symbol4: `FINNIFTY${finNiftyselectedDate}${
  //                     finNiftyStrikes[finNiftyStrikeIndex - (i + 2)]
  //                   }PE`,
  //                   strike: finNiftyStrikes[finNiftyStrikeIndex - i],
  //                 });
  //               }

  //               var finniftyIFWatchlist = {
  //                 name: 'NIFTY FIN SERVICE',
  //                 watchLists: finNiftyIFSymbols.map((x: any, i: number) => {
  //                   return {
  //                     symbol: x.symbol,
  //                     symbol1: x.symbol1,
  //                     symbol2: x.symbol2,
  //                     symbol3: x.symbol3,
  //                     symbol4: x.symbol4,
  //                     alias: x.symbol + ' IF',
  //                     tradingSymbol: x.symbol,
  //                     expiry: finNiftyExpiry,
  //                     lotSize: this.tradeService.allStockList.find(
  //                       (s) => s.symbol == x.symbol1
  //                     )?.lotSize,
  //                     strike: x.strike,
  //                     display: true,
  //                     displayOrder: i,
  //                   };
  //                 }),
  //               };

  //               var elements: any = [];
  //               finniftyIFWatchlist.watchLists.forEach((element: any) => {
  //                 finNiftySymbols.push(element.symbol1);
  //                 finNiftySymbols.push(element.symbol2);
  //                 finNiftySymbols.push(element.symbol3);
  //                 finNiftySymbols.push(element.symbol4);

  //                 let _element = {
  //                   alias: `FINNIFTY ${moment(finNiftyExpiry)
  //                     .format('MMM')
  //                     .toUpperCase()} ${element.strike} IF`,
  //                   symbol1: element.symbol1,
  //                   symbol2: element.symbol2,
  //                   symbol3: element.symbol3,
  //                   symbol4: element.symbol4,
  //                   lotSize: element.lotSize,
  //                   expiry: element.expiry,

  //                   strike: element.strike,

  //                   display: true,
  //                   marketDepth: [
  //                     {
  //                       askPrice: 0,
  //                       bidPrice: 0,
  //                       askQty: 0,
  //                       bidQty: 0,
  //                     },
  //                   ],
  //                 };
  //                 elements.push(_element);
  //               });
  //               finniftyIFWatchlist.watchLists = elements;
  //               this.mocktradeListIronfly[2] = finniftyIFWatchlist;
  //               let newSymbols = finNiftyIFSymbols
  //                 .map((x: any) => {
  //                   return x.symbol1;
  //                 })
  //                 .filter(
  //                   (x: any) =>
  //                     !this.tradeService.allStockList.some((s) => s.symbol == x)
  //                 );
  //               if (newSymbols.length > 0) {
  //                 this.strikeService
  //                   .getSymbolsDetails(newSymbols)
  //                   .subscribe((res: any) => {
  //                     res.forEach((element: any) => {
  //                       if (
  //                         this.tradeService.allStockList.find(
  //                           (s) => s.symbol == element.symbol
  //                         ) == undefined
  //                       )
  //                         this.tradeService.allStockList.push(element);
  //                     });
  //                     localStorage.setItem(
  //                       'allStockList',
  //                       this.encService.encrypt(
  //                         JSON.stringify(this.tradeService.allStockList)
  //                       )
  //                     );
  //                     this.mocktradeListIronfly[2].watchLists.forEach(
  //                       (element: any) => {
  //                         element.lotSize = res.find(
  //                           (t: any) => t.symbol == element.symbol1
  //                         ).lotSize;
  //                       }
  //                     );
  //                   });
  //               }
  //               this.strikeService
  //                 .getTouchLine(finNiftySymbols)
  //                 .subscribe((_touchline: any) => {
  //                   this.mocktradeListIronfly[2].watchLists.forEach(
  //                     (element: any) => {
  //                       let touchline1 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol1
  //                       );
  //                       let touchline2 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol2
  //                       );
  //                       let touchline3 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol3
  //                       );
  //                       let touchline4 = _touchline.find(
  //                         (t: any) => t.symbol == element.symbol4
  //                       );

  //                       element.symbol1Id = touchline1?.symbolId;
  //                       element.symbol2Id = touchline2?.symbolId;
  //                       element.symbol3Id = touchline3?.symbolId;
  //                       element.symbol4Id = touchline4?.symbolId;

  //                       element.ltp1 = touchline1?.ltp;
  //                       element.ltp2 = touchline2?.ltp;
  //                       element.ltp3 = touchline3?.ltp;
  //                       element.ltp4 = touchline4?.ltp;

  //                       element.open1 = touchline1?.open;
  //                       element.open2 = touchline2?.open;
  //                       element.open3 = touchline3?.open;
  //                       element.open4 = touchline4?.open;

  //                       element.previousClose1 = touchline1?.previousClose;
  //                       element.previousClose2 = touchline2?.previousClose;
  //                       element.previousClose3 = touchline3?.previousClose;
  //                       element.previousClose4 = touchline4?.previousClose;

  //                       element.ltp =
  //                         element.ltp1 +
  //                         element.ltp2 -
  //                         element.ltp3 -
  //                         element.ltp4;

  //                       element.previousClose =
  //                         element.previousClose1 +
  //                         element.previousClose2 -
  //                         element.previousClose3 -
  //                         element.previousClose4;
  //                       element.open =
  //                         element.open1 +
  //                         element.open2 -
  //                         element.open3 -
  //                         element.open4;

  //                       element.changePercentage =
  //                         ((element.ltp1 -
  //                           element.previousClose1 +
  //                           (element.ltp2 - element.previousClose2) -
  //                           (element.ltp3 - element.previousClose3) -
  //                           (element.ltp4 - element.previousClose4)) *
  //                           100) /
  //                         (element.previousClose1 +
  //                           element.previousClose2 -
  //                           element.previousClose3 -
  //                           element.previousClose4);
  //                     }
  //                   );
  //                 });
  //             });
  //         });
  //     });
  // }

  loadStocksWatchlist(loadoncompletion = false) {
    this.mocktradeListOptions = [];
    this.watchListArray = [];

    for (let i = 1; i <= 4; i++) {
      let watchList = {
        watchLists: [],
      };
      this.mocktradeListOptions.push(watchList);
      this.watchListArray.push(i);
    }
    let symbols: any = [];
    if (loadoncompletion) this.mocktradeList = this.mocktradeListOptions;
    this.strikeService
      .getTouchLine([
        'NIFTY 50',
        'NIFTY BANK',
        'NIFTY FIN SERVICE',
        'NIFTY MID SELECT',
      ])
      .subscribe((_touchline: any) => {
        this.strikeService.getExpiryByCalendarId(3).subscribe((res: any) => {
          this.finniftyExpiries = res.slice(0, 2);
          let finNiftyExpiry = res[0];
          if (
            this.selectedFINNIFTYExpiry &&
            this.finniftyExpiries.find(
              (x: any) => x == this.selectedFINNIFTYExpiry
            )
          ) {
            finNiftyExpiry = this.selectedFINNIFTYExpiry;
          }

          let finNiftyTouchline = _touchline.find(
            (x: any) => x.symbol == 'NIFTY FIN SERVICE'
          );

          this.strikeService
            .getStrikes('FINNIFTY', finNiftyExpiry, 'CE')
            .subscribe((res: any) => {
              let finNiftyStrikes = res;
              let finNiftyselectedDate =
                moment(finNiftyExpiry).format('YYMMDD');
              let finNiftyStrikeIndex =
                finNiftyStrikes.findIndex(
                  (st: any) => st > finNiftyTouchline.ltp
                ) - 1;
              let yy = moment(finNiftyExpiry).format('YY');
              let month = moment(finNiftyExpiry).format('MMM').toUpperCase();

              let finNiftySymbols = [
                { symbol: 'NIFTY FIN SERVICE', strike: 0 },
                {
                  symbol: `FINNIFTY${yy}${month}FUT`,
                  strike: 0,
                  display: false,
                },
              ];

              for (
                var i = this.authService.isAdminUser() ? 15 : 5;
                i >= (this.authService.isAdminUser() ? -15 : -10);
                i--
              ) {
                finNiftySymbols.push({
                  symbol: `FINNIFTY${finNiftyselectedDate}${
                    finNiftyStrikes[finNiftyStrikeIndex - i]
                  }CE`,
                  strike: finNiftyStrikes[finNiftyStrikeIndex - i],
                });
              }

              for (
                var i = this.authService.isAdminUser() ? 15 : 10;
                i >= (this.authService.isAdminUser() ? -15 : -10);
                i--
              ) {
                finNiftySymbols.push({
                  symbol: `FINNIFTY${finNiftyselectedDate}${
                    finNiftyStrikes[finNiftyStrikeIndex - i]
                  }PE`,
                  strike: finNiftyStrikes[finNiftyStrikeIndex - i],
                });
              }

              this.subscribeSymbols(finNiftySymbols.map((x) => x.symbol));
              let newSymbols = finNiftySymbols.filter(
                (s) =>
                  !this.tradeService.allStockList.some(
                    (st) => st.symbol == s.symbol
                  )
              );
              if (newSymbols.length > 0) {
                this.strikeService
                  .getSymbolsDetails(finNiftySymbols.map((x) => x.symbol))
                  .subscribe((res: any) => {
                    res.forEach((element: any) => {
                      if (
                        this.tradeService.allStockList.find(
                          (s) => s.symbol == element.symbol
                        ) == undefined
                      )
                        this.tradeService.allStockList.push(element);
                    });
                    localStorage.setItem(
                      'allStockList',
                      this.encService.encrypt(
                        JSON.stringify(this.tradeService.allStockList)
                      )
                    );
                    this.mocktradeListOptions[2].watchLists.forEach(
                      (element: any) => {
                        element.alias = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).alias;
                        element.expiry = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).expiry;
                        element.lotSize = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).lotSize;
                      }
                    );
                  });
              }
              var finnityWatchlist = {
                name: 'NIFTY FIN SERVICE',
                watchLists: finNiftySymbols.map((x, i) => {
                  return {
                    symbol: x.symbol,
                    alias: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.alias,
                    tradingSymbol: x.symbol,
                    expiry: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.expiry,
                    lotSize: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.lotSize,
                    strike: x.strike,
                    display: x.display ?? true,
                    displayOrder: i,
                  };
                }),
              };
              this.mocktradeListOptions[2] = finnityWatchlist;

              this.strikeService
                .getTouchLine(finNiftySymbols.map((x) => x.symbol))
                .subscribe((_touchline: any) => {
                  this.mocktradeListOptions[2].watchLists.forEach(
                    (element: any) => {
                      this.NIFTYFINSERVICEPRICES = {
                        ltp: finNiftyTouchline.ltp,
                        previousClose: finNiftyTouchline.previousClose,
                        changePercentage: finNiftyTouchline.changePercentage,
                        futLtp: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `FINNIFTY${yy}${month}FUT`
                        )?.ltp,
                        futPreviousClose: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `FINNIFTY${yy}${month}FUT`
                        )?.previousClose,
                        futChangePercentage: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `FINNIFTY${yy}${month}FUT`
                        )?.changePercentage,
                        if: this.calculateImpliedFuture(
                          _touchline.find(
                            (t: ITouchlineDetails) =>
                              t.symbol == `FINNIFTY${yy}${month}FUT`
                          )?.ltp,
                          finNiftyTouchline.ltp
                        ),
                        symbolId: finNiftyTouchline.symbolId,
                        futSymbolId: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `FINNIFTY${yy}${month}FUT`
                        )?.symbolId,
                      };

                      let touchline = _touchline.find(
                        (t: any) => t.symbol == element.symbol
                      );
                      if (touchline) {
                        element.ltp = touchline.ltp;

                        // this.updateLIVELTP(element.alias, element.ltp)
                        element.open = touchline.open;
                        element.high = touchline.high;
                        element.low = touchline.low;
                        element.previousClose = touchline.previousClose;
                        element.changePercentage = touchline.changePercentage;
                        element.symbolId = touchline.symbolId;
                      }
                    }
                  );
                });
            });
        });
        this.strikeService.getExpiryByCalendarId(4).subscribe((res: any) => {
          this.midCPNiftyExpiries = res.slice(0, 2);
          let expiry = res[0];
          if (
            this.selectedMIDCPNIFTYExpiry &&
            this.midCPNiftyExpiries.find(
              (x: any) => x == this.selectedMIDCPNIFTYExpiry
            )
          ) {
            expiry = this.selectedMIDCPNIFTYExpiry;
          }

          let midCpNiftyTouchline = _touchline.find(
            (x: any) => x.symbol == 'NIFTY MID SELECT'
          );

          this.strikeService
            .getStrikes('MIDCPNIFTY', expiry, 'CE')
            .subscribe((res: any) => {
              let strikes = res;
              let selectedDate = moment(expiry).format('YYMMDD');
              let strikeIndex =
                strikes.findIndex((st: any) => st > midCpNiftyTouchline.ltp) -
                1;
              let yy = moment(expiry).format('YY');
              let month = moment(expiry).format('MMM').toUpperCase();
              let symbols = [
                { symbol: 'NIFTY MID SELECT', strike: 0 },
                {
                  symbol: `MIDCPNIFTY${yy}${month}FUT`,
                  strike: 0,
                  display: false,
                },
              ];

              for (
                var i = this.authService.isAdminUser() ? 15 : 10;
                i >= (this.authService.isAdminUser() ? -15 : -5);
                i--
              ) {
                symbols.push({
                  symbol: `MIDCPNIFTY${selectedDate}${
                    strikes[strikeIndex - i]
                  }CE`,
                  strike: strikes[strikeIndex - i],
                });
              }

              for (
                var i = this.authService.isAdminUser() ? 15 : 5;
                i >= (this.authService.isAdminUser() ? -15 : -10);
                i--
              ) {
                symbols.push({
                  symbol: `MIDCPNIFTY${selectedDate}${
                    strikes[strikeIndex - i]
                  }PE`,
                  strike: strikes[strikeIndex - i],
                });
              }

              this.subscribeSymbols(symbols.map((x) => x.symbol));
              let newSymbols = symbols.filter(
                (s) =>
                  !this.tradeService.allStockList.some(
                    (st) => st.symbol == s.symbol
                  )
              );
              if (newSymbols.length > 0) {
                this.strikeService
                  .getSymbolsDetails(symbols.map((x) => x.symbol))
                  .subscribe((res: any) => {
                    res.forEach((element: any) => {
                      if (
                        this.tradeService.allStockList.find(
                          (s) => s.symbol == element.symbol
                        ) == undefined
                      )
                        this.tradeService.allStockList.push(element);
                    });
                    localStorage.setItem(
                      'allStockList',
                      this.encService.encrypt(
                        JSON.stringify(this.tradeService.allStockList)
                      )
                    );
                    this.mocktradeListOptions[3].watchLists.forEach(
                      (element: any) => {
                        element.alias = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).alias;
                        element.expiry = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).expiry;
                        element.lotSize = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).lotSize;
                      }
                    );
                  });
              }
              var midCPNiftyWatchlist = {
                name: 'MIDCPNIFTY',
                watchLists: symbols.map((x, i) => {
                  return {
                    symbol: x.symbol,
                    alias: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.alias,
                    tradingSymbol: x.symbol,
                    expiry: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.expiry,
                    lotSize: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.lotSize,
                    strike: x.strike,
                    display: x.display ?? true,
                    displayOrder: i,
                  };
                }),
              };
              this.mocktradeListOptions[3] = midCPNiftyWatchlist;

              this.strikeService
                .getTouchLine(symbols.map((x) => x.symbol))
                .subscribe((_touchline: any) => {
                  this.mocktradeListOptions[3].watchLists.forEach(
                    (element: any) => {
                      this.MIDCPNIFTYPRICES = {
                        ltp: midCpNiftyTouchline.ltp,
                        previousClose: midCpNiftyTouchline.previousClose,
                        changePercentage: midCpNiftyTouchline.changePercentage,
                        futLtp: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `MIDCPNIFTY${yy}${month}FUT`
                        )?.ltp,
                        futPreviousClose: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `MIDCPNIFTY${yy}${month}FUT`
                        )?.previousClose,
                        futChangePercentage: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `MIDCPNIFTY${yy}${month}FUT`
                        )?.changePercentage,
                        if: this.calculateImpliedFuture(
                          _touchline.find(
                            (t: ITouchlineDetails) =>
                              t.symbol == `MIDCPNIFTY${yy}${month}FUT`
                          )?.ltp,
                          midCpNiftyTouchline.ltp
                        ),
                        symbolId: midCpNiftyTouchline.symbolId,
                        futSymbolId: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `MIDCPNIFTY${yy}${month}FUT`
                        )?.symbolId,
                      };
                      let touchline = _touchline.find(
                        (t: any) => t.symbol == element.symbol
                      );
                      if (touchline) {
                        element.ltp = touchline.ltp;

                        // this.updateLIVELTP(element.alias, element.ltp)
                        element.open = touchline.open;
                        element.high = touchline.high;
                        element.low = touchline.low;
                        element.previousClose = touchline.previousClose;
                        element.changePercentage = touchline.changePercentage;
                        element.symbolId = touchline.symbolId;
                      }
                    }
                  );
                });
            });
        });
        this.strikeService.getExpiryByCalendarId(5).subscribe((res: any) => {
          this.bankNiftyExpiries = res.slice(0, 2);
          let expiry = res[0];
          if (
            this.selectedBankNiftyExpiry &&
            this.bankNiftyExpiries.find(
              (x: any) => x == this.selectedBankNiftyExpiry
            )
          ) {
            expiry = this.selectedBankNiftyExpiry;
          }

          let bankNiftyTouchline = _touchline.find(
            (x: any) => x.symbol == 'NIFTY BANK'
          );

          this.strikeService
            .getStrikes('BANKNIFTY', expiry, 'CE')
            .subscribe((res: any) => {
              let strikes = res;
              let selectedDate = moment(expiry).format('YYMMDD');
              let strikeIndex =
                strikes.findIndex((st: any) => st > bankNiftyTouchline.ltp) - 1;
              let yy = moment(expiry).format('YY');
              let month = moment(expiry).format('MMM').toUpperCase();

              let symbols = [
                { symbol: 'NIFTY BANK', strike: 0 },
                {
                  symbol: `BANKNIFTY${yy}${month}FUT`,
                  strike: 0,
                  display: false,
                },
              ];

              for (
                var i = this.authService.isAdminUser() ? 15 : 10;
                i >= (this.authService.isAdminUser() ? -15 : -5);
                i--
              ) {
                symbols.push({
                  symbol: `BANKNIFTY${selectedDate}${
                    strikes[strikeIndex - i]
                  }CE`,
                  strike: strikes[strikeIndex - i],
                });
              }

              for (
                var i = this.authService.isAdminUser() ? 15 : 10;
                i >= (this.authService.isAdminUser() ? -15 : -5);
                i--
              ) {
                symbols.push({
                  symbol: `BANKNIFTY${selectedDate}${
                    strikes[strikeIndex - i]
                  }PE`,
                  strike: strikes[strikeIndex - i],
                });
              }

              this.subscribeSymbols(symbols.map((x) => x.symbol));
              let newSymbols = symbols.filter(
                (s) =>
                  !this.tradeService.allStockList.some(
                    (st) => st.symbol == s.symbol
                  )
              );
              if (newSymbols.length > 0) {
                this.strikeService
                  .getSymbolsDetails(symbols.map((x) => x.symbol))
                  .subscribe((res: any) => {
                    res.forEach((element: any) => {
                      if (
                        this.tradeService.allStockList.find(
                          (s) => s.symbol == element.symbol
                        ) == undefined
                      )
                        this.tradeService.allStockList.push(element);
                    });
                    localStorage.setItem(
                      'allStockList',
                      this.encService.encrypt(
                        JSON.stringify(this.tradeService.allStockList)
                      )
                    );
                    this.mocktradeListOptions[1].watchLists.forEach(
                      (element: any) => {
                        element.alias = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).alias;
                        element.expiry = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).expiry;
                        element.lotSize = res.find(
                          (t: any) => t.symbol == element.symbol
                        ).lotSize;
                      }
                    );
                  });
              }
              var watchList = {
                name: 'NIFTY BANK',
                watchLists: symbols.map((x, i) => {
                  return {
                    symbol: x.symbol,
                    alias: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.alias,
                    tradingSymbol: x.symbol,
                    expiry: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.expiry,
                    lotSize: this.tradeService.allStockList.find(
                      (s) => s.symbol == x.symbol
                    )?.lotSize,
                    strike: x.strike,
                    display: x.display ?? true,
                    displayOrder: i,
                  };
                }),
              };
              this.mocktradeListOptions[1] = watchList;

              this.strikeService
                .getTouchLine(symbols.map((x) => x.symbol))
                .subscribe((_touchline: any) => {
                  this.mocktradeListOptions[3].watchLists.forEach(
                    (element: any) => {
                      this.NIFTYBANKPRICES = {
                        ltp: bankNiftyTouchline.ltp,
                        previousClose: bankNiftyTouchline.previousClose,
                        changePercentage: bankNiftyTouchline.changePercentage,
                        futLtp: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `BANKNIFTY${yy}${month}FUT`
                        )?.ltp,
                        futPreviousClose: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `BANKNIFTY${yy}${month}FUT`
                        )?.previousClose,
                        futChangePercentage: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `BANKNIFTY${yy}${month}FUT`
                        )?.changePercentage,
                        if: this.calculateImpliedFuture(
                          _touchline.find(
                            (t: ITouchlineDetails) =>
                              t.symbol == `BANKNIFTY${yy}${month}FUT`
                          )?.ltp,
                          bankNiftyTouchline.ltp
                        ),
                        symbolId: bankNiftyTouchline.symbolId,
                        futSymbolId: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `BANKNIFTY${yy}${month}FUT`
                        )?.symbolId,
                      };

                      let touchline = _touchline.find(
                        (t: any) => t.symbol == element.symbol
                      );
                      if (touchline) {
                        element.ltp = touchline.ltp;

                        // this.updateLIVELTP(element.alias, element.ltp)
                        element.open = touchline.open;
                        element.high = touchline.high;
                        element.low = touchline.low;
                        element.previousClose = touchline.previousClose;
                        element.changePercentage = touchline.changePercentage;
                        element.symbolId = touchline.symbolId;
                      }

                      this.mocktradeListOptions[1].watchLists.forEach(
                        (element: any) => {
                          let touchline = _touchline.find(
                            (t: any) => t.symbol == element.symbol
                          );
                          if (touchline) {
                            element.ltp = touchline.ltp;
                            // this.updateLIVELTP(element.alias, element.ltp)
                            element.previousClose = touchline.previousClose;
                            element.changePercentage =
                              touchline.changePercentage;
                            element.open = touchline.open;
                            element.high = touchline.high;
                            element.low = touchline.low;
                            element.symbolId = touchline.symbolId;
                          }
                        }
                      );
                    }
                  );
                });
            });
        });
        this.strikeService.getExpiry().subscribe((res: any) => {
          this.expiries = res.slice(0, 2);
          let _expiry = res[0];
          if (
            this.selectedExpiry &&
            this.expiries.find((x: any) => x == this.selectedExpiry)
          ) {
            _expiry = this.selectedExpiry;
          }
          let month = moment(_expiry).format('MMM').toUpperCase();
          let yy = moment(_expiry).format('YY');
          let selectedDate = moment(_expiry).format('YYMMDD');
          this.strikeService
            .getStrikes('NIFTY', _expiry, 'CE')
            .subscribe((_niftyStrikes: any) => {
              let niftyStrikes = _niftyStrikes;
              this.strikeService
                .getStrikes('BANKNIFTY', _expiry, 'CE')
                .subscribe((res: any) => {
                  let bankNiftyStrikes = res;

                  //strikes pulled
                  let niftyTouchline = _touchline.find(
                    (x: any) => x.symbol == 'NIFTY 50'
                  );

                  let niftyStrikeIndex = niftyStrikes.findIndex(
                    (st: any) => st > niftyTouchline.ltp
                  );

                  // let bankNiftyTouchline = _touchline.find(
                  //   (x: any) => x.symbol == 'NIFTY BANK'
                  // );

                  // if (bankNiftyTouchline != undefined) {
                  //   let bankNiftyStrikeIndex = bankNiftyStrikes.findIndex(
                  //     (st: any) => st > bankNiftyTouchline.ltp
                  //   );

                  let niftySymbols = [
                    {
                      symbol: 'NIFTY 50',
                      strike: 0,
                    },
                    {
                      symbol: `NIFTY${yy}${month}FUT`,
                      strike: 0,
                      display: false,
                    },
                  ];

                  for (
                    var i = this.authService.isAdminUser() ? 15 : 5;
                    i >= (this.authService.isAdminUser() ? -10 : -5);
                    i--
                  ) {
                    niftySymbols.push({
                      symbol: `NIFTY${selectedDate}${
                        niftyStrikes[niftyStrikeIndex - i]
                      }CE`,
                      strike: niftyStrikes[niftyStrikeIndex - i],
                    });
                  }

                  for (
                    var i = this.authService.isAdminUser() ? 15 : 5;
                    i >= (this.authService.isAdminUser() ? -10 : -5);
                    i--
                  ) {
                    niftySymbols.push({
                      symbol: `NIFTY${selectedDate}${
                        niftyStrikes[niftyStrikeIndex - i]
                      }PE`,
                      strike: niftyStrikes[niftyStrikeIndex - i],
                    });
                  }

                  // let bankNiftySymbols = [
                  //   {
                  //     symbol: 'NIFTY BANK',
                  //     strike: 0,
                  //   },
                  //   {
                  //     symbol: `BANKNIFTY${yy}${month}FUT`,
                  //     strike: 0,
                  //     display: false,
                  //   },
                  // ];

                  // for (
                  //   var i = this.authService.isAdminUser() ? 10 : 5;
                  //   i >= (this.authService.isAdminUser() ? -10 : -4);
                  //   i--
                  // ) {
                  //   bankNiftySymbols.push({
                  //     symbol: `BANKNIFTY${selectedDate}${
                  //       bankNiftyStrikes[bankNiftyStrikeIndex - i]
                  //     }CE`,
                  //     strike: bankNiftyStrikes[bankNiftyStrikeIndex - i],
                  //   });
                  // }
                  // for (
                  //   var i = this.authService.isAdminUser() ? 10 : 5;
                  //   i >= (this.authService.isAdminUser() ? -10 : -4);
                  //   i--
                  // ) {
                  //   bankNiftySymbols.push({
                  //     symbol: `BANKNIFTY${selectedDate}${
                  //       bankNiftyStrikes[bankNiftyStrikeIndex - i]
                  //     }PE`,
                  //     strike: bankNiftyStrikes[bankNiftyStrikeIndex - i],
                  //   });
                  // }

                  symbols.push(...niftySymbols.map((x) => x.symbol));
                  // symbols.push(...bankNiftySymbols.map((x) => x.symbol));

                  this.subscribeSymbols(symbols);
                  let newSymbols = symbols.filter(
                    (s: any) =>
                      !this.tradeService.allStockList.some(
                        (st) => st.symbol == s
                      )
                  );
                  if (newSymbols.length > 0) {
                    this.strikeService
                      .getSymbolsDetails(symbols)
                      .subscribe((res: any) => {
                        res.forEach((element: any) => {
                          if (
                            this.tradeService.allStockList.find(
                              (s) => s.symbol == element.symbol
                            ) == undefined
                          )
                            this.tradeService.allStockList.push(element);
                        });
                        localStorage.setItem(
                          'allStockList',
                          this.encService.encrypt(
                            JSON.stringify(this.tradeService.allStockList)
                          )
                        );
                        this.mocktradeListOptions[0].watchLists.forEach(
                          (element: any) => {
                            element.alias = res.find(
                              (t: any) => t.symbol == element.symbol
                            ).alias;

                            element.expiry = res.find(
                              (t: any) => t.symbol == element.symbol
                            ).expiry;
                            element.lotSize = res.find(
                              (t: any) => t.symbol == element.symbol
                            ).lotSize;
                          }
                        );
                        this.mocktradeListOptions[1].watchLists.forEach(
                          (element: any) => {
                            element.alias = res.find(
                              (t: any) => t.symbol == element.symbol
                            ).alias;

                            element.expiry = res.find(
                              (t: any) => t.symbol == element.symbol
                            ).expiry;
                            element.lotSize = res.find(
                              (t: any) => t.symbol == element.symbol
                            ).lotSize;
                          }
                        );
                      });
                  }
                  let niftyWatchlist = {
                    name: 'NIFTY 50',
                    watchLists: niftySymbols.map((x, i) => {
                      return {
                        symbol: x.symbol,
                        alias: this.tradeService.allStockList.find(
                          (s) => s.symbol == x.symbol
                        )?.alias,
                        tradingSymbol: x.symbol,
                        expiry: this.tradeService.allStockList.find(
                          (s) => s.symbol == x.symbol
                        )?.expiry,
                        lotSize: this.tradeService.allStockList.find(
                          (s) => s.symbol == x.symbol
                        )?.lotSize,
                        strike: x.strike,
                        display: x.display ?? true,
                        displayOrder: i,
                      };
                    }),
                  };

                  // let bankNiftyWatchlist = {
                  //   name: 'NIFTY BANK',
                  //   watchLists: bankNiftySymbols.map((x, i) => {
                  //     return {
                  //       symbol: x.symbol,
                  //       alias: this.tradeService.allStockList.find(
                  //         (s) => s.symbol == x.symbol
                  //       )?.alias,
                  //       tradingSymbol: x.symbol,
                  //       expiry: this.tradeService.allStockList.find(
                  //         (s) => s.symbol == x.symbol
                  //       )?.expiry,
                  //       lotSize: this.tradeService.allStockList.find(
                  //         (s) => s.symbol == x.symbol
                  //       )?.lotSize,
                  //       strike: x.strike,
                  //       display: x.display ?? true,

                  //       displayOrder: i,
                  //     };
                  //   }),
                  // };
                  this.mocktradeListOptions[0] = niftyWatchlist;
                  // this.mocktradeListOptions[1] = bankNiftyWatchlist;
                  this.strikeService
                    .getTouchLine(symbols)
                    .subscribe((_touchline: any) => {
                      this.NIFTYPRICES = {
                        ltp: niftyTouchline.ltp,
                        previousClose: niftyTouchline.previousClose,
                        changePercentage: niftyTouchline.changePercentage,
                        futLtp: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `NIFTY${yy}${month}FUT`
                        )?.ltp,
                        futPreviousClose: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `NIFTY${yy}${month}FUT`
                        )?.previousClose,
                        futChangePercentage: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `NIFTY${yy}${month}FUT`
                        )?.changePercentage,
                        if: this.calculateImpliedFuture(
                          _touchline.find(
                            (t: ITouchlineDetails) =>
                              t.symbol == `NIFTY${yy}${month}FUT`
                          )?.ltp,
                          niftyTouchline.ltp
                        ),
                        symbolId: niftyTouchline.symbolId,
                        futSymbolId: _touchline.find(
                          (t: ITouchlineDetails) =>
                            t.symbol == `NIFTY${yy}${month}FUT`
                        )?.symbolId,
                      };
                      // this.NIFTYBANKPRICES = {
                      //   ltp: bankNiftyTouchline.ltp,
                      //   previousClose: bankNiftyTouchline.previousClose,
                      //   changePercentage: bankNiftyTouchline.changePercentage,
                      //   futLtp: _touchline.find(
                      //     (t: ITouchlineDetails) =>
                      //       t.symbol == `BANKNIFTY${yy}${month}FUT`
                      //   )?.ltp,
                      //   futPreviousClose: _touchline.find(
                      //     (t: ITouchlineDetails) =>
                      //       t.symbol == `BANKNIFTY${yy}${month}FUT`
                      //   )?.previousClose,
                      //   futChangePercentage: _touchline.find(
                      //     (t: ITouchlineDetails) =>
                      //       t.symbol == `BANKNIFTY${yy}${month}FUT`
                      //   )?.changePercentage,
                      //   if: this.calculateImpliedFuture(
                      //     _touchline.find(
                      //       (t: ITouchlineDetails) =>
                      //         t.symbol == `BANKNIFTY${yy}${month}FUT`
                      //     )?.ltp,
                      //     bankNiftyTouchline.ltp
                      //   ),
                      //   symbolId: bankNiftyTouchline.symbolId,
                      //   futSymbolId: _touchline.find(
                      //     (t: ITouchlineDetails) =>
                      //       t.symbol == `BANKNIFTY${yy}${month}FUT`
                      //   )?.symbolId,
                      // };

                      this.mocktradeListOptions[0].watchLists.forEach(
                        (element: any) => {
                          let touchline = _touchline.find(
                            (t: any) => t.symbol == element.symbol
                          );
                          if (touchline) {
                            element.ltp = touchline.ltp;
                            // this.updateLIVELTP(element.alias, element.ltp)

                            element.previousClose = touchline.previousClose;
                            element.changePercentage =
                              touchline.changePercentage;
                            element.open = touchline.open;
                            element.high = touchline.high;
                            element.low = touchline.low;
                            element.symbolId = touchline.symbolId;
                          }
                        }
                      );
                    });
                  // }
                });
            });
        });
      });
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

  exitOrderPlacement() {
    let trades = this.filterPositions(this.positionList)
      .filter((x: any) => x.quantity != 0 && x.checked)
      .map((position: any) => {
        console.log(position);
        let obj = new buyAndSellStock();
        obj.alias = position.alias;
        obj.expiry = position.expiry;
        obj.strategy = position.strategy;
        obj.quantity =
          position.quantity > 0 ? position.quantity : -1 * position.quantity;
        obj.guid = `${this.generateUID()}`;
        obj.isExitOrder = true;
        obj.operationType = position.quantity > 0 ? 'sell' : 'buy';
        obj.orderType = position.orderType;
        obj.price = position.ltp;
        obj.rateType = 'market';
        obj.sell = position.quantity > 0 ? true : false;
        obj.status = 'open';
        obj.symbol = position.symbol;
        obj.symbolId = position.symbolId;
        obj.userId = this.userId;
        obj.targetPrice = position.ltp;
        obj.strike = position.strike;

        return obj;
      });
    this.loading = true;
    this.openOrderList.push([...trades]);

    let inputParam = {
      userId: this.userId,
      list: trades,
    };

    this.getTradeSocket().send(
      `{ "method" : "addtrade", "data":` + JSON.stringify(trades) + `}`
    );

    this.totalOrderList.push([...trades]);
    this.tradeService.buyOrSell(inputParam).subscribe(
      (data: any) => {
        this.getOrderList();
        //commenting getorderlist in order to fetch list outside
      },
      (err: any) => {}
    );
    console.log(trades);
  }
  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  cancelAll() {
    this.openOrderList.forEach((data: any) => {
      this.loading = true;
      this.getTradeSocket().send(
        `{ "method" : "removetrade", "data":` + JSON.stringify(data) + `}`
      );
      setTimeout(() => {
        this.totalOrderList.find((x: any) => x.guid == data.guid).status =
          'cancelled';
      }, 100);
      this.tradeService.removeTrade(data.id).subscribe((data: any) => {
        // this.toastr.success("Trade remove successfully.")
        this._snackBar.open('Success', 'Dismiss', {
          duration: 2000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });
        this.loading = false;
      });
    });
    setTimeout(() => {
      this.getOrderList();
    }, 300);
  }
  async exitAll() {
    this.loading = true;

    this.exitOrderPlacement();

    this.loading = false;
    this.getOrderList();
    Swal.fire('Success', '', 'success');
  }
  formatDate(date: any) {
    let d = new Date(date);
    let yyyy = d.getFullYear();
    let yy = yyyy.toString().substring(2);
    let mm = ('0' + (d.getMonth() + 1)).slice(-2);
    let dd = ('0' + d.getDate()).slice(-2);
    return new Date(mm + '-' + dd + '-' + yy);
  }
  calculateImpliedFuture(futurePrice: number, spotPrice: number) {
    let nearestMonthExpiry: any;
    let selectedDate: any = moment(this.selectedExpiry).toDate();
    if (this.selectedSymbol == 'NIFTY FIN SERVICE')
      selectedDate = moment(this.selectedFINNIFTYExpiry).toDate();
    let todayDate: any = this.formatDate(getIST());
    //determine nearest month expiry of selected date
    let dates = this.expiries.map((x: any) => new Date(x)); //convert into dateformat

    //filter selected month dates from date array
    let filterDate = dates.filter(
      (x: any) => x.getMonth() == moment(selectedDate).month()
    );
    if (filterDate.length > 0) {
      nearestMonthExpiry = filterDate.reduce((a: any, b: any) =>
        a > b ? a : b
      ); //find the greatest date from filtered date
    }

    let a = Math.abs(nearestMonthExpiry - todayDate) / (1000 * 60 * 60 * 24);
    let b = Math.abs(selectedDate - todayDate) / (1000 * 60 * 60 * 24);
    //calculate impliedFuture
    b == 0 ? (b = 1) : (b = b);
    a == 0 ? (a = 1) : (a = a);

    let impliedFut =
      Number(spotPrice) + ((Number(futurePrice) - Number(spotPrice)) * b) / a;

    return impliedFut;
  }

  order: any;
  showOrderDetals(id: number) {
    return;
    this.loading = true;
    this.tradeService.getOrderdetails(id).subscribe((res: any) => {
      this.loading = false;
      this.order = res;
      if (this.order?.orderStatus.toLowerCase() == 'filled')
        this.order.orderStatus = 'Executed';
      if (this.order?.strategy == 'straddle') {
        this.order.alias = `${
          this.stockList.find((s: any) => s.displayName == this.order.symbol)
            ?.name
        } ${moment(this.order.expiry).format('MMM').toUpperCase()} ${
          this.order.strike
        } SD`;
      } else {
        this.order.alias = `${
          this.tradeService.allStockList.find(
            (s: any) => s.symbol == this.order.symbol
          )?.alias
        }`;
      }
    });
  }
  // LIVELTP: { alias: string, ltp: number }[] = []
  // getltpfromwatchlist(alias: string, item?: any) {
  //   let ltp = this.LIVELTP.find((x: any) => x.alias == alias)?.ltp
  //   item.ltp = ltp
  //   return ltp
  // }
  // updateLIVELTP(alias: string, ltp: number) {
  //   var element = this.LIVELTP.find((x: any) => x.alias == alias)
  //   if (element)
  //     element.ltp = ltp
  //   else {
  //     this.LIVELTP.push({ alias: alias, ltp: ltp })
  //   }
  // }
  updatePandL(pos: any) {
    let totalQty = 0;
    let netValue = 0;
    let filterOrder = this.orderList.filter(
      (s: any) =>
        `${s.alias}-${moment(s.expiry).format('DDMMYY')}` ==
        `${pos.alias}-${moment(pos.expiry).format('DDMMYY')}`
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
      pos.pandl = (pos.ltp - pos.avg) * pos.quantity;
    } else {
      pos.pandl = -1 * netValue;
    }
    return pos.pandl;
  }

  exitPercentage = new FormControl(4);
  @ViewChild('inputQuantity') inputQuantity: ElementRef | undefined;

  getFilteredPositions(type: string) {
    if (type == 'open') {
      return this.positionList.filter((x: any) => x.quantity != 0);
    } else {
      return this.positionList.filter((x: any) => x.quantity == 0);
    }
  }
  selectedMobileMenuSection = 'watchlist';
  loadAsMobile = false;
  private updateVariableBasedOnWindowSize(): void {
    // Check the window size and update the variable accordingly
    if (window.innerWidth <= 480) {
      this.loadAsMobile = true;
    } else {
      this.loadAsMobile = false;
    }
  }
  //   mobileMenuSelection(menu:any)
  //   {
  // this.selectedMobileMenuSection = menu
  //   }

  selectAll($event: any) {
    if ($event.target.checked)
      this.positionList.forEach((element: any) => {
        element.checked = true;
      });
    else
      this.positionList.forEach((element: any) => {
        element.checked = false;
      });
  }
  editOrder(item: any) {
    item.editMode = true;
  }
  updateOrder(item: any) {
    var request: IEditOrderRequest = {
      guid: item.guid,
      price: item.price,
    };
    this.tradeService.updateOrder(request).subscribe((res: any) => {});
    Swal.fire('', 'Submitted', 'success');
    item.editMode = false;
  }
  //#region  Basket Orders
  baskets: any = [];
  reloadBaskets() {
    this.tradeService
      .getbaskets(this.authService.getUserId())
      .subscribe((res: any) => {
        this.baskets = res;
        let newSymbols: any = [];
        this.baskets.forEach((basket: any) => {
          basket.orders.forEach((order: any) => {
            if (
              !this.tradeService.allStockList.some(
                (st) => st.symbol == order.symbol
              )
            ) {
              newSymbols.push(order.symbol);
            }
          });
        });
        

        
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
              this.baskets.forEach((basket: any) => {
                basket.orders.forEach((v: any, index: number) => {
                  let symbolVal: any = this.tradeService.allStockList.find(
                    (s: any) => s.symbol == v.symbol
                  );
      
                  if (symbolVal != undefined) {
                    v.symbolId = symbolVal.symbolId;
                    v.alias = symbolVal.alias;
                  }
                  if (v.strategy == 'straddle') {
                    v.alias = `${
                      this.stockList.find((s: any) => s.displayName == v.symbol).name
                    } ${moment(v.expiry).format('MMM').toUpperCase()} ${v.strike} SD`;
                  }
                });
                basket.orders = basket.orders.filter(
                  (bo: any) => bo.symbolId != undefined
                );
              });
            });
        }
        else{
          this.baskets.forEach((basket: any) => {
            basket.orders.forEach((v: any, index: number) => {
              let symbolVal: any = this.tradeService.allStockList.find(
                (s: any) => s.symbol == v.symbol
              );
  
              if (symbolVal != undefined) {
                v.symbolId = symbolVal.symbolId;
                v.alias = symbolVal.alias;
              }
              if (v.strategy == 'straddle') {
                v.alias = `${
                  this.stockList.find((s: any) => s.displayName == v.symbol).name
                } ${moment(v.expiry).format('MMM').toUpperCase()} ${v.strike} SD`;
              }
            });
            // basket.orders = basket.orders.filter(
            //   (bo: any) => bo.symbolId != undefined
            // );
          });
        }

        this.baskets.forEach((basket: any) => {
          basket.orders.forEach((v: any, index: number) => {
            let symbolVal: any = this.tradeService.allStockList.find(
              (s: any) => s.symbol == v.symbol
            );

            if (symbolVal != undefined) {
              v.symbolId = symbolVal.symbolId;
              v.alias = symbolVal.alias;
            }
            if (v.strategy == 'straddle') {
              v.alias = `${
                this.stockList.find((s: any) => s.displayName == v.symbol).name
              } ${moment(v.expiry).format('MMM').toUpperCase()} ${v.strike} SD`;
            }
          });
          // basket.orders = basket.orders.filter(
          //   (bo: any) => bo.symbolId != undefined
          // );
        });
        this.getOrderList();
      });
  }
  removeBasketOrder(id: number) {
    this.tradeService
      .removeBasketOrder(id)
      .subscribe((res) => this.reloadBaskets());
  }
  executeBasket(basket: any) {
    if (getIST().getDay() == 0) {
      this._snackBar.open('Markets are closed right now.', 'Dismiss', {
        duration: 2000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
      return;
    }
    let currentTime = this.timeCal(getIST());
    if (
      (currentTime >= this.marketStartTime &&
        currentTime <= this.marketCloseTime) ||
      (currentTime >= this.marketStartTime &&
        currentTime <= this.marketCloseTime + 20 &&
        this.buyOrSellModel.orderType == 'normal')
    ) {
      let orders = this.totalOrderList
        .filter((x: any) => x.status == 'executed' || x.status == 'open')
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

      var ordersList: ITradeRequest[] = [];

      basket.orders.forEach((val: any) => {
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
        }
        if (!lotSize) return;
        var _order = {
          symbol: val.symbol,
          price: val.price,
          triggerPrice: val.price,
          quantity: val.quantity * lotSize,
          strike: val.strike,
          expiry: val.expiry,
          strategy: val.strategy,
          transactionType: val.operationType,
          lotSize: lotSize,
        };
        orders.push(_order);

        ordersList.push({
          createdBy: this.userId,
          expiry: val.expiry,
          guid: this.generateUID(),
          operationType: val.operationType,
          orderType: val.orderType,
          price: val.price,
          quantity: val.quantity,
          rateType: val.rateType,
          triggerPrice: 0,
          strategy: val.strategy,
          strike: val.strike,
          symbol: val.symbol,
          status: 'open',
          lotSize: lotSize,
        });
      });

      //Margin calculation including basket
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
          transactionType:
            _.sum(values.map((x) => x.quantity)) > 0 ? 'buy' : 'sell',
          lotSize: values[0].lotSize,
        });
      });

      if (final.length == 0) {
        return;
      }
      final.forEach((f: any) => {
        if (
          !f.expiry ||
          (f.expiry &&
            moment(f.expiry).daysInMonth() -
              Math.round(moment(f.expiry).date()) <
              7)
        ) {
          const sym = this.tradeService.allStockList.find(
            (s: any) => s.symbol == f.symbol
          );
          if (sym != undefined)
            f.tradingSymbol = this.tradeService.allStockList.find(
              (s: any) => s.symbol == f.symbol
            )?.tradingSymbol;

          //weekly
        } else if (moment(f.expiry).year() == 1970) {
          f.tradingSymbol = f.symbol;
        } else {
          let month = (moment(f.expiry).month() + 1).toString();
          let date = moment(f.expiry).date().toString();
          let stockName: string = f.symbol;
          stockName = stockName.slice(0, stockName.indexOf('2'));
          if (date.length == 1) date = '0' + date;
          if (month == '10') month = 'O';
          else if (month == '11') month = 'N';
          else if (month == '12') month = 'D';
          f.tradingSymbol = `${stockName}${moment(f.expiry).format(
            'YY'
          )}${month}${date}${f.strike}${f.symbol.slice(
            f.symbol.length - 2,
            f.symbol.length
          )}`;
        }
      });
      var values: IMarginCalculationRequest[] = final.map((val: any) => {
        if (val.strategy == 'straddle') {
          val.quantity = val.quantity / val.lotSize;
        }
        if (val.strategy == 'options') {
          val.quantity = val.quantity / val.lotSize;
        }
        return {
          price: val.price,
          quantity:
            (val.quantity < 0 ? -1 * val.quantity : val.quantity) * val.lotSize,
          symbol: val.tradingSymbol,
          lotSize: val.lotSize,
          strategy: val.strategy,
          strike: val.strike,
          expiry: this.tradeService.allStockList.find(
            (s: any) => s.symbol == val.symbol
          )?.expiry,
          transactionType: val.transactionType,
          triggerPrice: val.price,
          userId: this.authService.getUserId(),
        };
      });

      this.tradeService.getMargin(values).subscribe((res: any) => {
        // this.loading = false;
        let margin = 0;
        margin += Number(res);

        if (margin > this.dayStartWalletBalance) {
          this._snackBar.open('Insufficient Funds', 'Dismiss', {
            duration: 2000,
            horizontalPosition: this.horizontalPosition,
            verticalPosition: this.verticalPosition,
          });
          return;
        } else {
          //place order for the list here
          this.totalOrderList.push([ordersList]);
          ordersList.forEach((x) => (x.quantity = x.quantity * x.lotSize));
          this.tradeService
            .buyOrSell({
              userId: this.userId,
              createdBy: this.userId,
              list: ordersList,
            })
            .subscribe(
              (_data: any) => {
                // let data: { guid: string; id: Number }[] = _data;
                // data.forEach((element) => {
                //   if (
                //     this.totalOrderList.some(
                //       (t: { guid: string; id: Number }) =>
                //         t.guid == element.guid
                //     )
                //   )
                //     this.totalOrderList.find(
                //       (t: { guid: string; id: Number }) =>
                //         t.guid == element.guid
                //     ).id = element.id;
                // });
                console.log("bnasket executed");
                this.loading = false;
                this._snackBar.open('Basket Executed', 'Dismiss', {
                  duration: 2000,
                  horizontalPosition: this.horizontalPosition,
                  verticalPosition: this.verticalPosition,
                });
                this.getOrderList();
              },
              (err: any) => {
                this.getOrderList();

                this.loading = false;
              }
            );
          this.getTradeSocket().send(
            `{ "method" : "addtrade", "data":` +
              JSON.stringify(ordersList) +
              `}`
          );
        }
      });
    }
  }
  removeBasket(id: number) {
    this.tradeService.removeBasket(id).subscribe((res) => this.reloadBaskets());
  }
  //#endregion
}
