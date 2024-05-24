import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { httpInterceptor } from './http-interceptor';
import { CacheInterceptor } from './services/cache-interceptor';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { InnerNavbarComponent } from './shared/inner-navbar/inner-navbar.component';
import { LoginModule } from './login/login.module';
import { InnerModule } from './inner/inner.module';
import { AllPositionsComponent } from './all-positions/all-positions.component';
import { UsersComponent } from './users/users.component';
import { DataTablesModule } from 'angular-datatables';
import { AddFundsDialogComponent } from './shared/add-funds-dialog/add-funds-dialog.component';
import { EditUserComponent } from './shared/edit-user/edit-user.component';
import { ExchangeOrdersComponent } from './exchange-orders/exchange-orders.component';
import { OrdersComponent } from './orders/orders.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { AllPositionsSymbolwiseComponent } from './all-positions-symbolwise/all-positions-symbolwise.component';
import { ToastrModule } from 'ngx-toastr';





@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    ForgetPasswordComponent,
    OrderDetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 500,
      closeButton: true,
      preventDuplicates:true,
      positionClass: 'toast-bottom-right' 
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: httpInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  exports:[]
})
export class AppModule { }
