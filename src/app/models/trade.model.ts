export class buyAndSellStock {
  'orderType': string = 'mis';
  'quantity': number = 1;
  'price': number = 0;
  'triggerPrice': number = 0;
  'rateType': string = 'market';
  isExitOrder: boolean = false;
  targetPrice: number = 0;
  operationType: string = 'buy';
  time?: Date;
  status?: string;
  symbol?: string;
  symbolId?: number;
  userId?: number;
  guid?: string;
  alias?: string;
  expiry?: Date;
  strike?: number;
  stopLoss: number = 0;
  sell: boolean = false;
  isBasket: boolean = false;
  strategy?: string;
  type: string = 'fresh';
  basketName?: string='new';
  newBasketName?: string;
}
export interface ISymbolDetails {
  alias: string;
  expiry: Date;
  lotSize: number;
  symbol: string;
  symbolId: number;
  strike: number;
  tradingSymbol: string;
}
export const predicateBy = (prop: any) => {
  return function (a: any, b: any) {
    if (a[prop] > b[prop]) {
      return 1;
    } else if (a[prop] < b[prop]) {
      return -1;
    }
    return 0;
  };
};
export function predicateByDesc(prop: any) {
  return function (a: any, b: any) {
    if (a[prop] < b[prop]) {
      return 1;
    } else if (a[prop] > b[prop]) {
      return -1;
    }
    return 0;
  };
}
export function parseJwt(token: any) {
  if (token == null) window.location.href = '/';
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
}
export interface ITouchlineDetails {
  atp: number;
  high: number;
  lastUpdatedTime: Date;
  low: number;
  ltp: number;
  open: number;
  previousClose: number;
  previousOiclose: number;
  symbol: string;
  symbolId: number;
  tickVolume: number;
  todayOi: number;
  totalVolume: number;
  turnOver: number;
  change: number;
  changePercentage: number;
  oiChange: number;
  coipercentage: number;
  oiChangePercentage: number;
}
export interface IMarginCalculationRequest {
  symbol: string;
  quantity: number;
  price: number;
  triggerPrice: number;
  lotSize: number;
  strategy: string;
  transactionType: transactionType;
}
export enum transactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface IGetOrder {
  id: number;
  operationType: string;
  orderType: string;
  price: number;
  quantity: number;
  rateType: string;
  status: string;
  symbol: string;
  time: string;
  triggerPrice: number;
  userId: number;
}

export interface IGetPosition {
  id: number;
  avg: number;
  ltp: number;
  oderType: string;
  pandd: number;
  symbol: string;
  symbolId?: number;
  time: string;
  quantity: number;
  updatedOn: Date;
  date: Date;
}
export const onlyUnique = (value: any, index: any, self: any) => {
  return self.indexOf(value) === index;
};
export interface ITradeRequest {
  symbol: string;
  strike: number;
  expiry: Date;
  orderType: string;
  quantity: number;
  price: number;
  triggerPrice: number;
  rateType: string;
  operationType: string;
  guid: string;
  strategy: string;
  createdBy: string;
  status:string
  lotSize:number
}
export interface IEditOrderRequest
{
  guid:string
  price:number
}