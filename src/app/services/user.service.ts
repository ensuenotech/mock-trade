import { HttpClient, JsonpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {
  IPayoutRequest,
  IRegisterUserModel,
  IUpdatePayoutRequest,
  IUserFormModel,
  MapBrokeragePlanRequest,
} from 'src/models/user.model';
import { IMarginCalculationRequest } from '../models/trade.model';
import { httpOptions, parseJwt } from './utils';
import { NumberInput } from '@angular/cdk/coercion';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  userDetails: any;
  constructor(private http: HttpClient, private router: Router, private authService:AuthService) {
    const token = localStorage.getItem('userToken');
    if (token)
      this.refreshToken(token).subscribe((res: any) => {
        if (res.success) {
          try {

            if (this.userDetails == undefined) {
              this.getUserDetails(this.authService.getUserId()).subscribe((r: any) => {
                this.userDetails = r;
              });
            }
          } catch {
            // this.router.navigateByUrl("");
          }
        } else {
          this.router.navigateByUrl("");
        }
      });
  }
  ApiUrl = environment.coreAppURL + '/api/user/';

  login(email: string, password: string) {
    var values = { email: email, password: password };
    return this.http.post(
      this.ApiUrl + 'validateuser',
      JSON.stringify(values),
      httpOptions
    );
  }
  getWalletBalance(userId: number) {
    return this.http.post(
      this.ApiUrl + "getWalletBalance",
      JSON.stringify(userId),
      httpOptions
    );
  }
  sendWelcomeEmail(userId: number) {
    return this.http.post(this.ApiUrl + 'welcome', userId, httpOptions);
  }
  searchUser(email: string) {
    return this.http.post(
      this.ApiUrl + 'searchuser',
      JSON.stringify(email),
      httpOptions
    );
  }
  validateToken(token: string) {
    return this.http.post(
      this.ApiUrl + "validate",
      JSON.stringify(token),
      httpOptions
    );
  }
  register(userData: IRegisterUserModel) {
    return this.http.post(this.ApiUrl + 'register', userData, httpOptions);
  }
  authenicateOTP(otp: number, userId: number) {
    return this.http.post(
      this.ApiUrl + 'validateotp',
      { otp: otp, userId: userId },
      httpOptions
    );
  }
  registerviamobile(mobile: string) {
    return this.http.post(this.ApiUrl + 'registerm', mobile, httpOptions);
  }
  sendOtp(mobile: number, type:string) {
    return this.http.post(
      this.ApiUrl + 'sendotp',
      JSON.stringify({ mobile: mobile, type: type}),
      httpOptions
    );
  }
  resendOtp(mobile: number, type:string) {
    return this.http.post(
      this.ApiUrl + 'resendotp',
      JSON.stringify({ mobile: mobile, type:type }),
      httpOptions
    );
  }
  changePassword(values: any) {
    return this.http.post(
      this.ApiUrl + 'changepassword',
      JSON.stringify(values),
      httpOptions
    );
  }
  sendOtpMail(userId: number) {
    return this.http.post(this.ApiUrl + 'sendotpmail', userId, httpOptions);
  }
  getUserDetails(userId: number) {
    return this.http.post(this.ApiUrl + 'getuserdetails', userId, httpOptions);
  }
  getProfile(id: number) {
    return this.http.post(this.ApiUrl + `getuserdetails`, id, httpOptions);
  }

  GetStates(id: number) {
    return this.http.get(this.ApiUrl + 'getstates/' + id);
  }
  GetCountries() {
    return this.http.get(this.ApiUrl + 'getcountries');
  }
  GetPayouts(userId:number) {
    return this.http.post(this.ApiUrl + 'payouts', userId, httpOptions);
  }
  GetPayoutsAll() {
    return this.http.get(this.ApiUrl + 'payout');
  }
  savePayout(userData: IPayoutRequest) {
    return this.http.post(this.ApiUrl + 'payout', userData, httpOptions);
  }
  updatePayout(request: IUpdatePayoutRequest) {
    return this.http.put(`${this.ApiUrl}payout/0}`, JSON.stringify(request), httpOptions);
  }
  saveUserDetails(userData: IUserFormModel) {
    return this.http.post(this.ApiUrl + 'saveUser', userData, httpOptions);
  }
  refreshToken(token: string | null) {
    return this.http.post(
      this.ApiUrl + 'refreshtoken',
      JSON.stringify(token),
      httpOptions
    );
  }
  
  getLedger(userId: number) {
    return this.http.post(
      this.ApiUrl + 'ledger',
      JSON.stringify(userId),
      httpOptions
    );
  }
  updateTarget(userData:any) {
    return this.http.post(this.ApiUrl + 'updateTarget', userData, httpOptions);
  }
   updateTrail(userData:any) {
    return this.http.post(this.ApiUrl + 'updateTrail', userData, httpOptions);
  }
  getDhanOrders(userId: number) {
    return this.http.post(
      this.ApiUrl + 'dhanorders',
      JSON.stringify(userId),
      httpOptions
    );
  }

  UploadBlobFile(formData: any) {
    return this.http.post(
      environment.coreAppURL + '/UploadBlobFile',
      formData,
      {
        reportProgress: true,
        observe: 'events',
      }
    );
  }
  addFundsToWallet(userId: number, amount: number, remarks:string, particular:string, type:string) {
    return this.http.post(
      this.ApiUrl + "funds",
      JSON.stringify({ userId: userId, amount: amount, remarks:remarks, particular:particular, type:type }),
      httpOptions
    );
  }

  //#region  Brokerage Plans
  GetStrategies() {
    return this.http.get(this.ApiUrl + 'strategy');
  }
  getBrokeragePlans() {
    return this.http.get(this.ApiUrl + 'bplans');
  }
  MapBrokeragePlan(request:MapBrokeragePlanRequest) {
    return this.http.post(`${this.ApiUrl}mapbrokerageplan`,JSON.stringify(request),httpOptions);
  }
  //#endregion
}
