import { Component } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { StrikeService } from '../services/strike.service';
import { AuthService } from '../services/auth.service';
import { EncService } from '../services/enc.service';
import * as moment from 'moment';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent {
  userId!: number;
  trades: any = [];
  stockList: any = [];
  loading=false
  public constructor(
    private tradeService: TradeService,
    private encService: EncService,
    private strikeService: StrikeService,
    private authService: AuthService
  ) {
    this.userId = this.authService.getUserId();
    // this.userId = 7376;
    this.strikeService.getStocks().subscribe((res: any) => {
      this.stockList = res;
      this.getOrderList();
    });
  }
  getOrderList() {
    this.tradeService.orderListData(this.userId).subscribe((data: any) => {
      let symbols: any[] = [];
      data.forEach((v: any) => {
        if (!symbols.some((s) => s == v.symbol)) symbols.push(v.symbol);
      });

      // let newSymbols = symbols.filter(
      //   (x) => !this.tradeService.allStockList.some((s) => s.symbol == x)
      // );
      // if (newSymbols.length > 0) {
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
      // }
      this.trades = data.filter((order: any) => {
        if (order.strategy == 'straddle') {
          order.alias = `${
            this.stockList.find((s: any) => s.displayName == order.symbol)?.name
          } ${moment(order.expiry).format('MMM').toUpperCase()} ${
            order.strike
          } SD`;
        } else
          order.alias = `${
            this.tradeService.allStockList.find(
              (s: any) => s.symbol == order.symbol
            )?.alias
          }`;

        return order;
      });
    });
  }

  order:any
  showOrderDetals(id: number) {
this.loading=true
    this.tradeService.getOrderdetails(id).subscribe((res:any)=>{
      this.loading=false
      this.order = res
      if(this.order.orderStatus.toLowerCase()=='filled')
      this.order.orderStatus="Executed"
      if(this.order.strategy=='straddle')
      {
       this.order.alias = `${
         this.stockList.find((s: any) => s.displayName == this.order.symbol)
           ?.name
       } ${moment(this.order.expiry).format('MMM').toUpperCase()} ${
         this.order.strike
       } SD`;
      }
      else{
        this.order.alias =  `${
          this.tradeService.allStockList.find(
            (s: any) => s.symbol == this.order.symbol
          )?.alias
        }`;

      }
    })
  }
}
