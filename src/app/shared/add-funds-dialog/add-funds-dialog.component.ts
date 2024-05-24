import { Component, Inject } from '@angular/core';
import { FormControl, Validators, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { IPayoutRequest, IUpdatePayoutRequest } from 'src/models/user.model';
export interface IAddFundsDialogData {
  userId: number;
  type: string;
  payout?: any;
}
@Component({
  selector: 'app-add-funds-dialog',
  templateUrl: './add-funds-dialog.component.html',
  styleUrls: ['./add-funds-dialog.component.css'],
})
export class AddFundsDialogComponent {
  loadTypes(event: any) {
    if (event.target.value == 'limit') {
      this.types = ['Limit ADD', 'Limit Reduction', 'Limit Block'];
    } else this.types = ['UPI', 'NEFT', 'IMPS'];
  }
  valuesForm = this.fb.group({
    amount: new FormControl(0, [Validators.required]),
    remarks: new FormControl(''),
    particular: new FormControl(''),
    type: new FormControl(''),
  });
  errorMessage = { message: '', color: '' };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IAddFundsDialogData,
    private userService: UserService,
    private dialog: MatDialogRef<AddFundsDialogComponent>,
    private fb: FormBuilder
  ) {}
  types: any = [];
  ngOnInit(): void {
    if (this.data.type == 'payout') {
      this.valuesForm.controls.amount.setValue(-1 * this.data.payout.amount);
    }
  }
  save() {
    if (this.valuesForm.valid) {
      if (this.data.type == 'funds') {
        this.userService
          .addFundsToWallet(
            this.data.userId,
            this.valuesForm.controls.amount.value ?? 0,
            this.valuesForm.controls.remarks.value ?? '',
            this.valuesForm.controls.particular.value ?? '',
            this.valuesForm.controls.type.value ?? ''
          )
          .subscribe(() => {
            this.dialog.close();
          });
      } else if (this.data.type == 'payout') {
        if (this.valuesForm.controls.amount.value) {
          let request: IUpdatePayoutRequest = {
            particular: this.valuesForm.controls.particular.value ?? '',
            payoutId: this.data.payout.id,
            status: 'approved',
            type: this.valuesForm.controls.type.value ?? '',
          };

          this.userService
            .updatePayout(request)
            .subscribe((res: any) => {
              this.userService
                .addFundsToWallet(
                  this.data.payout.userId,
                  this.valuesForm.controls.amount.value ?? 0,
                  this.valuesForm.controls.remarks.value ?? '',
                  this.valuesForm.controls.particular.value ?? '',
                  this.valuesForm.controls.type.value ?? ''
                )
                .subscribe(() => {
                  this.dialog.close();
                });
            });
        }
      }
    } else {
      this.errorMessage = {
        color: 'error',
        message: 'Please fill in all the fields',
      };
    }
  }
}
