import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import * as moment from 'moment';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { getIST } from './utils';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  encryptSecretKey = '14option1234';
  ApiUrl = environment.stockDetailsURL;
  // wsBaseURL = environment.wsURL;
  wsTradeURL = environment.wsTradeURL
  socket: any;
  tradeSocket: any;
  constructor(private http: HttpClient, private authService: AuthService) {}
  encryptData(data: string) {
    try {
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        this.encryptSecretKey
      ).toString();
    } catch (e) {
      console.log(e);
    }
    return null;
  }
  decryptData(data: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(data, this.encryptSecretKey);
      if (bytes.toString()) {
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      }
      return data;
    } catch (e) {
      console.log(e);
    }
  }
  // GetSocketURL() {
  //   return this.wsBaseURL;
  // }

  // GetSocketConn() {
  //   if ((localStorage.getItem('userToken') || '') === '') {
  //     if (this.socket !== undefined) {
  //       this.socket?.disconnect();
  //     }
  //     return;
  //   }
  //   if (this.socket === undefined) {
  //     this.socket = io(this.wsTradeURL, { transports: ['websocket'] });
  //     this.socket?.on('disconnect', () => {
  //       this.socket = undefined;
  //     });
  //   }
  //   this.socket?.removeListener('message');
  //   this.socket?.removeListener('reconnect');
  //   this.socket?.removeListener('connect');
  //   this.socket?.on('error', (error: any) => {
  //     let e = JSON.parse(error);
  //     this.socketErrorHandler(e);
  //   });
  //   this.socket?.on('err', (error: any) => {
  //     this.socketErrorHandler(error);
  //   });
  //   return this.socket;
  // }
  GetTradeSocketConn() {
    if ((localStorage.getItem('userToken') || '') === '') {
      if (this.tradeSocket !== undefined) {
        this.tradeSocket.disconnect();
      }
      return;
    }
    if (this.tradeSocket === undefined) {
      this.tradeSocket = io(this.wsTradeURL, { transports: ['websocket'] });
      this.tradeSocket.on('disconnect', () => {
        this.tradeSocket = undefined;
      });
    }
    this.tradeSocket.removeListener('message');
    this.tradeSocket.removeListener('reconnect');
    this.tradeSocket.removeListener('connect');
    this.tradeSocket.on('error', (error: any) => {
      let e = JSON.parse(error);
      this.socketErrorHandler(e);
    });
    this.tradeSocket.on('err', (error: any) => {
      this.socketErrorHandler(error);
    });
    return this.tradeSocket;
  }
  socketErrorHandler(error: any) {
    console.log(error);
    const code = error.errorCode;
    switch (code) {
      case 'MAX_SYMBOL_LIMIT_REACHED':
        alert(
          `You have reached maximum symbols subscribed limit of ${error.count}\nPlease close additional tabs and retry in few seconds.`
        );
        break;
      case 'MAX_CONNECTION_LIMIT_REACHED':
        alert(
          `You have reached maximum parallel connection limit of ${error.count}\nPlease close additional tabs and retry in few seconds.`
        );
        break;
    }
  }
 
  
}
