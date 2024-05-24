import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InnerComponent } from './inner.component';
import { InnerNavbarComponent } from '../shared/inner-navbar/inner-navbar.component';
import { TradeComponent } from '../trade/trade.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '../app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRippleModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AllPositionsComponent } from '../all-positions/all-positions.component';
import { UsersComponent } from '../users/users.component';
import { DataTablesModule } from 'angular-datatables';
import { ExchangeOrdersComponent } from '../exchange-orders/exchange-orders.component';
import { EditUserComponent } from '../shared/edit-user/edit-user.component';
import { AddFundsDialogComponent } from '../shared/add-funds-dialog/add-funds-dialog.component';
import { PayoutsComponent } from '../payouts/payouts.component';
import { OrdersComponent } from '../orders/orders.component';
import { AllPositionsSymbolwiseComponent } from '../all-positions-symbolwise/all-positions-symbolwise.component';
import { AllPositionsUserwiseComponent } from '../all-positions-userwise/all-positions-userwise.component';

const matModules = [
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatRippleModule,
  MatAutocompleteModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatStepperModule,
  MatDatepickerModule,
  MatDialogModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatRippleModule,
  MatSelectModule,
  MatSidenavModule,
  MatProgressSpinnerModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatProgressBarModule
];

const routes: Routes = [
{ path: "dashboard", component: DashboardComponent, title:"Dashboard" },
{ path: "users", component: UsersComponent, title:"Users" },
{ path: "admin-orders", component: ExchangeOrdersComponent, title:"Admin Orders" },
{ path: "orders", component: OrdersComponent, title:"Orders" },
{ path: "dashboard/:section", component: DashboardComponent },
{ path: "", component: TradeComponent, title:"Trade" },
{ path: "all-positions", component: AllPositionsComponent, title:"All Positions" },
{ path: "all-positions-symbolwise", component: AllPositionsSymbolwiseComponent, title:"All Positions Symbolwise" },
{ path: "all-positions-userwise", component: AllPositionsUserwiseComponent, title:"All Positions Userwise" },
{ path: "payouts", component: PayoutsComponent, title:"Payouts" }
];

@NgModule({
  declarations: [
    InnerComponent,
    InnerNavbarComponent,
    DashboardComponent,
    TradeComponent,
    AllPositionsComponent,
    EditUserComponent,
    UsersComponent,
    ExchangeOrdersComponent,
    AddFundsDialogComponent,
    PayoutsComponent,
    OrdersComponent,
    AllPositionsSymbolwiseComponent,AllPositionsUserwiseComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    matModules,
    RouterModule.forChild(routes),
    DragDropModule,
    DataTablesModule
  ],
  exports:[matModules]
})
export class InnerModule {}
