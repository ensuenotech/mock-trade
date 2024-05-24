import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTablesResponse } from 'src/models/user.model';
import { AuthService } from '../services/auth.service';
import { TradeService } from '../services/trade.service';

@Component({
  selector: 'app-exchange-orders',
  templateUrl: './exchange-orders.component.html',
  styleUrls: ['./exchange-orders.component.css'],
})
export class ExchangeOrdersComponent {
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject();
  @ViewChild(DataTableDirective, { static: false })
  datatableElement!: DataTableDirective;
  loading = true;
  data: any = [];

  skip = 0;
  limit = 200;
  _MS_PER_HOUR = 1000 * 60 * 60;

  constructor(
    private authService: AuthService,
    private tradeService: TradeService,
    private router: Router,
    private httpClient: HttpClient
  ) {
    if (!(this.authService.isAdminUser() || this.authService.isManager()))
      this.router.navigateByUrl('/');
  }

  ngOnInit(): void {
    // this.getUsers();
    // for (var i = 0; i < 20000; i = i + 200) {
    //   this.usersCount.push(i)
    // }

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 100,
      serverSide: true,
      processing: true,
      stateSave: false,
      order: [[0, 'asc']],
      aLengthMenu: [
        [25, 50, 100, 200, -1],
        [25, 50, 100, 200, 'All'],
      ],
      ajax: (dataTablesParameters: any, callback: any) => {
        this.httpClient
          .post<DataTablesResponse>(
            this.tradeService.API_URL + '/orders',
            dataTablesParameters,
            {}
          )
          .subscribe((resp) => {
            this.loading = false;
            this.data = resp.data;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: [],
            });
          });
      },
      columns: [
        { data: 'appOrderID' },
        { data: 'productType' },
        { data: 'orderSide' },
        { data: 'orderType' },
        { data: 'orderCategoryType' },
        { data: 'orderStatus' },
        { data: 'orderGeneratedDateTime' },
        { data: 'exchangeTransactTime' },
        { data: 'orderQuantity' },
        { data: 'cumulativeQuantity' },
        { data: 'tradingSymbol' },
        { data: 'orderUniqueIdentifier' },
        { data: 'cancelRejectReason' },
        { data: 'orderAverageTradedPrice' },
      ],
    };
  }
  ngAfterViewInit(): void {
    this.datatableElement.dtInstance.then((dtInstance: any) => {
      dtInstance.columns().every(function (this: any, index: any, value: any) {
        let that: any = this;
        $('input', this.footer()).val(dtInstance.column(index).search());

        $('input', this.footer()).on('keyup change', function (this: any) {
          if (that.search() !== this['value']) {
            that.search(this['value']).draw();
          }
        });
      });
    });
  }
  reload() {
    this.datatableElement.dtInstance.then((dtInstance: any) => {
      dtInstance.ajax.reload();
    });
  }
}
