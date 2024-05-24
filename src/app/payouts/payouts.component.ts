import { Component } from '@angular/core';
import { UserService } from '../services/user.service';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { AddFundsDialogComponent } from '../shared/add-funds-dialog/add-funds-dialog.component';
import { predicateByDesc } from '../models/trade.model';

@Component({
  selector: 'app-payouts',
  templateUrl: './payouts.component.html',
  styleUrls: ['./payouts.component.css'],
})
export class PayoutsComponent {
  payouts: any = [];
  constructor(private userService: UserService, private dialog: MatDialog) {
    this.refreshpayouts();
  }
  refreshpayouts() {
    this.userService.GetPayoutsAll().subscribe((res: any) => {
      this.payouts = res;
      this.payouts.sort(predicateByDesc("date"))
    });
  }
  changeStatus(event: any, payout: any) {
    var status = event.target.value;
    if (status == 'approved') {
      this.dialog
        .open(AddFundsDialogComponent, {
          data: { payout: payout, type: 'payout' }, width:"600px",
        })
        .afterClosed()
        .subscribe((res: any) => {
          this.refreshpayouts();
        });
    } else {
      this.userService.updatePayout({ payoutId:payout.id, status:'rejected'}).subscribe((res: any) => {
        Swal.fire('Success', '', 'success');
        this.refreshpayouts();
      });
    }
  }
}
