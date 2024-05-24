import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IEditOrderRequest, IMarginCalculationRequest, ISymbolDetails } from '../models/trade.model';
import { EncService } from './enc.service';
import { httpOptions } from './utils';

@Injectable({
  providedIn: 'root'
})
export class TradeService {
  API_URL = environment.coreAppURL
  allStockList:ISymbolDetails[]=[]
  constructor(private http: HttpClient, private encService:EncService){
    
    let stocksList = localStorage.getItem('allStockList');
    if (stocksList != null) {
      this.allStockList = JSON.parse(this.encService.decrypt(stocksList));
    }

   }

  watchListSave(data:any){
    return this.http.post(this.API_URL + `/api/user/saveWatchList`, data, httpOptions);
  }

  watchListGet(data:any){
    return this.http.post(this.API_URL + `/api/user/getWatchlists`, data, httpOptions);
  }

  deleteWatchList(id:any){
    return this.http.post(this.API_URL + `/api/user/removeWatchList`, id, httpOptions);
  }

  buyOrSell(data:any){
    return this.http.post(this.API_URL + `/api/user/saveTrade`, data, httpOptions);
  }
 

  orderListData(id:any){
    return this.http.post(this.API_URL + `/api/user/getTrades`, id, httpOptions);
  }

  allTrades(date:Date, id:any){
    if(id==undefined)id=null
    return this.http.post(this.API_URL + `/api/user/getAllTrades`, JSON.stringify({userId:id, date:date}), httpOptions);
  }
  getOrderdetails(id:any){
    return this.http.post(this.API_URL + `/api/trade/order`, JSON.stringify(id), httpOptions);
  }
  getPositions(userId:number, fromDate:Date, toDate:Date){
    return this.http.post(this.API_URL + `/api/user/getPositions`,JSON.stringify({userId:userId, fromDate:fromDate, toDate:toDate}), httpOptions);
  }

  savePositionData(data:any){
    return this.http.post(this.API_URL + `/api/user/savePositions`, data, httpOptions);
  }

  removeTrade(id:number){
    return this.http.post(this.API_URL + `/api/user/removeTrade`, JSON.stringify(id), httpOptions);
  }
  getMargin(values: IMarginCalculationRequest[]) {
    return this.http.post(
      this.API_URL+ '/api/user/getmargin',
      JSON.stringify(values),
      httpOptions
    );
  }
  updateOrder(values: IEditOrderRequest) {
    return this.http.post(
      this.API_URL+ '/api/trade/edittrade',
      JSON.stringify(values),
      httpOptions
    );
  }

  //#region  basket order
  getbaskets(userId:number) {
    return this.http.post(this.API_URL + `/api/user/basket/${userId}`, httpOptions);
  }
  createBasket(name:string) {
    return this.http.post(
      this.API_URL + `/api/user/basket`,
      JSON.stringify({ name: name}),
      httpOptions
    );
  }
  removeBasket(basketId:number) {
    return this.http.post(
      this.API_URL + `/api/user/basketdelete/`,
      JSON.stringify(basketId),
      httpOptions
    );
  }
  removeBasketOrder(id:number) {
    return this.http.post(
      this.API_URL + `/api/user/RemoveBasketOrder/`,
      JSON.stringify(id),
      httpOptions
    );
  }
  saveBasketOrder(data:any) {
    return this.http.post(this.API_URL + `/api/user/savebasket`, data);
  }
  //#endregion
  
}
