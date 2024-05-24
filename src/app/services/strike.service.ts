import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { getIST, httpOptions } from './utils';

@Injectable({
  providedIn: 'root',
})
export class StrikeService {
  AllstockList: any[] = [];
  API_URL = environment.stockDetailsURL;
  TRADEAPI_URL = environment.tradeAPI_URL;
  CORE_URL = environment.coreAppURL
  token: string | undefined;
  constructor(private http: HttpClient) {
    this.token = sessionStorage.getItem('token') ?? undefined;
    if (!this.token) {
      this.refreshToken();
    }
  }
  refreshToken() {
    this.http
      .post(
        `${this.API_URL}/internal/validateinternal/`,
        JSON.stringify({ username: 'straddly', password: 'iampassword' }),
        httpOptions
      )
      .subscribe((res: any) => {
        this.token = res.token;
        if (this.token) sessionStorage.setItem('token', this.token);
      });
  }
  getSymbols(_searchterm?: string) {
    let values = { searchTerm: _searchterm };
    return this.http.post(
      this.API_URL + `/api/common/getinternalsymbols`,
      JSON.stringify(values),
      httpOptions
    );
  }
  getOptions(_searchterm: string, expiry:any) {
    let values = { searchTerm: _searchterm, expiry: expiry };
    return this.http.post(
      this.API_URL + `/api/common/getinternaloptions`,
      JSON.stringify(values),
      httpOptions
    );
  }
  search(_searchterm: string, expiry:any) {
    let values = { searchTerm: _searchterm, expiry: expiry };
    return this.http.post(
      this.CORE_URL + `/search`,
      JSON.stringify(values),
      httpOptions
    );
  }
  getSymbolsDetails(symbols: string[]) {
    return this.http.post(
      this.API_URL + `/api/common/GetInternalSymbolsDetails`,
      JSON.stringify(symbols),
      httpOptions
    );
  }
  getTouchLine(symbols: string[]) {
    return this.http.post(
      this.API_URL + `/api/common/gettouchline`,
      symbols,
      httpOptions
    );
  }
  getLiveTouchLine(symbols: string[]) {
    return this.http.post(
      this.TRADEAPI_URL + `/getltp`,
      {"symbols":symbols},
      httpOptions
    );
  }
  getExpiry() {
    return this.http.get(this.API_URL + `/api/common/getexpiry`);
  }
  getStocks() {
    return this.http.get(this.API_URL + `/api/common/getstocks`);
  }
  getExpiryByCalendarId(calendarId: number) {
    return this.http.get(this.API_URL + `/api/common/getexpiry/` + calendarId);
  }
  getAllSymbols() {
    return this.http.get(this.API_URL + `/api/common/getsymbols`, httpOptions);
  }
  getStrikes(stockName: string, expiry: any, series: any) {
    var data = { stockname: stockName, expiry: expiry, series: series };
    return this.http.post(
      this.API_URL + '/api/common/getstrikes',
      data,
      httpOptions
    );
  }
}
