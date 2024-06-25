import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable()
export class httpInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    newRequest: HttpHandler
  ): Observable<HttpEvent<any>> {
    // add authorization header to request
    //Get Token data from local storage

    let tokenInfo =  localStorage.getItem('userToken') ;
    if (tokenInfo) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${tokenInfo}`,
          // 'Content-Type': 'application/json',
        },
      });
    }

    return newRequest.handle(request);
  }
}
