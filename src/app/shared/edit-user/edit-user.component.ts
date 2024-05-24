import { HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'lodash';
import { UserService } from 'src/app/services/user.service';
import { IUserFormModel, MapBrokeragePlanRequest } from 'src/models/user.model';
import Swal from 'sweetalert2';
export interface IEditUserDialogData {
  userId: number;
}
@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css'],
})
export class EditUserComponent {
  @Output() public onUploadFinished = new EventEmitter();
  InsertUserForm: FormGroup = this.fb.group({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    mobile: new FormControl(),
    email: new FormControl(),
    country: new FormControl(),
    state: new FormControl(),
    city: new FormControl(),
    address: new FormControl(),
    pincode: new FormControl(),
    aadharNumber: new FormControl(),
    panNumber: new FormControl(),
    bankAccount: new FormControl(),
    upi: new FormControl(),
    status: new FormControl(),
    brokeragePlan: new FormControl(),
  });
  loading = true;
  allStateNames: any[] = [];
  countries: any[] = [];
  strategies: any[] = [];
  allBrokeragePlans: any[] = [];
  brokeragePlans: any[] = [];
  userDetails: any;
  constructor(
    private fb: FormBuilder,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: IEditUserDialogData
  ) {
    this.loading = true;
    this.userService.GetStrategies().subscribe((_strategies: any) => {
      this.strategies = _strategies;
    });

    this.userService.GetCountries().subscribe((res: any) => {
      this.countries = res;
      this.userService.GetStates(1).subscribe((res: any) => {
        this.allStateNames = res;

        this.userService.getProfile(this.data.userId).subscribe(
          (r: any) => {
            this.userDetails = r;
            this.loading = false;
            this.InsertUserForm.get('firstName')?.setValue(r.firstName);
            this.InsertUserForm.get('lastName')?.setValue(r.lastName);
            this.InsertUserForm.get('email')?.setValue(r?.email);
            this.InsertUserForm.get('mobile')?.setValue(r?.mobile);
            this.InsertUserForm.get('state')?.setValue(r?.address?.stateId);
            this.InsertUserForm.get('aadharNumber')?.setValue(r?.aadharNumber);
            this.InsertUserForm.get('panNumber')?.setValue(r?.panNumber);
            this.InsertUserForm.get('bankAccount')?.setValue(r?.bankAccount);
            this.InsertUserForm.get('upi')?.setValue(r?.upi);
            this.aadhar = r?.aadhar;
            this.pan = r?.panCard;
            this.cheque = r?.cancelledCheque;
            this.InsertUserForm.get('country')?.setValue(r?.address?.countryId);
            this.InsertUserForm.get('address')?.setValue(r?.address?.address);
            this.InsertUserForm.get('pincode')?.setValue(r?.address?.pinCode);
            this.InsertUserForm.get('city')?.setValue(r?.address?.city);
            this.InsertUserForm.get('status')?.setValue(r?.status);

            this.userService
              .getBrokeragePlans()
              .subscribe((_brokeragePlans: any) => {
                this.allBrokeragePlans = _brokeragePlans
                let grped = _.groupBy(_brokeragePlans, 'name');
                _.map(grped, (values: any, key: any) => {
                 
                  this.brokeragePlans.push(values[0]);
                });
                this.InsertUserForm.get('brokeragePlan')?.setValue(
                  r.brokeragePlans[0].id
                );
                this.selectedPlan = this.brokeragePlans.find(x=>x.id==r.brokeragePlans[0].id);

              });
          },
          (error: any) => console.log(error),
          () => {}
        );
      });
    });
  }
  progress = 0;
  aadhar: string = '';
  pan: string = '';
  cheque: string = '';
  public uploadFile = (files: any, type: string) => {
    if (files.length === 0) {
      return;
    }

    let fileToUpload = <File>files[0];
    const formData = new FormData();
    formData.append('file', fileToUpload, fileToUpload.name);

    this.userService.UploadBlobFile(formData).subscribe(
      (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          var image = event.body;
          if (type == 'aadhar') this.aadhar = image;
          if (type == 'pan') this.pan = image;
          if (type == 'cheque') this.cheque = image;
          this.onUploadFinished.emit(event.body);
        }
      },
      (error) => {
        Swal.fire(
          'Oops !!',
          'There is some problem with the file you are trying to upload.',
          'error'
        );
      }
    );
  };
  saveDetails() {
    if (this.InsertUserForm.valid) {
      let values: IUserFormModel = {
        id: this.data.userId,
        firstName: this.InsertUserForm.controls['firstName'].value,
        lastName: this.InsertUserForm.controls['lastName'].value,
        aadharNumber: this.InsertUserForm.controls['aadharNumber'].value,
        panNumber: this.InsertUserForm.controls['panNumber'].value,
        countryId: this.InsertUserForm.controls['country'].value,
        stateId: parseInt(this.InsertUserForm.controls['state'].value),
        city: this.InsertUserForm.controls['city'].value,
        mobile: this.InsertUserForm.controls['mobile'].value,
        email: this.InsertUserForm.controls['email'].value,
        address: this.InsertUserForm.controls['address'].value,
        pincode: this.InsertUserForm.controls['pincode'].value,
        panCard: this.pan,
        cancelledCheque: this.cheque,
        aadhar: this.aadhar,
        bankAccount: this.InsertUserForm.controls['bankAccount'].value,
        upi: this.InsertUserForm.controls['upi'].value,
        status: this.InsertUserForm.controls['status'].value,
      };

      this.userService.saveUserDetails(values).subscribe((res: any) => {
        if (res) {
          Swal.fire({
            title: 'Success',
            text: 'Success',
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire({
            title: 'Failure',
            text: 'Enter valid data',
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Required',
        text: 'All fields are required',
      });
    }
  }
  selectedPlan: any;
  changeBrokeragePlan(event: any) {
    var plan = this.brokeragePlans.find((x) => x.id == event.target.value);
    this.selectedPlan = plan;
  }
  getSelectedPlan()
  {
    return this.allBrokeragePlans.filter((x) => x.name == this.selectedPlan.name)
  }
  updateBrokeragePlan()
  {
    var request:MapBrokeragePlanRequest={
      brokeragePlan:this.selectedPlan.name,
      userId:this.userDetails.id
    }
    this.userService.MapBrokeragePlan(request).subscribe((res:any)=>{
      Swal.fire("","Success","success")
    })
  }
}
