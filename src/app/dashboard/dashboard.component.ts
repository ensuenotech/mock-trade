import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IPayoutRequest,
  IUserDetailsModel,
  IUserFormModel,
} from 'src/models/user.model';
import Swal from 'sweetalert2';
import { ServiceService } from '../services/service.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { getIST } from '../services/utils';
import { EventEmitter } from 'events';
import { TradeService } from '../services/trade.service';
import { StrikeService } from '../services/strike.service';
import { EncService } from '../services/enc.service';
import * as _ from 'lodash';
import {
  ITouchlineDetails,
  predicateBy,
  predicateByDesc,
} from '../models/trade.model';
import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  updateTarget() {
    this.userService
      .updateTarget({
        userId: this.userId,
        profit: this.InsertUserForm.controls['profit'].value,
        sl: this.InsertUserForm.controls['sl'].value,
      })
      .subscribe((res) => {
        Swal.fire('Sucess', '', 'success');
      });
  }
  updateTrail() {
    this.userService
      .updateTrail({
        userId: this.userId,
        trailBy: this.InsertUserForm.controls['trailBy'].value,
        trailAfter: this.InsertUserForm.controls['trailAfter'].value,
      })
      .subscribe((res) => {
        Swal.fire('Sucess', '', 'success');
      });
  }
  checkTargetQuantities() {
    if (this.InsertUserForm.controls['profit'].value > 100) {
      this.InsertUserForm.controls['profit'].setValue(100);
    } else if (this.InsertUserForm.controls['profit'].value < 0) {
      this.InsertUserForm.controls['profit'].setValue(0);
    }
    if (this.InsertUserForm.controls['sl'].value < -15) {
      this.InsertUserForm.controls['sl'].setValue(-15);
    } else if (this.InsertUserForm.controls['sl'].value > 0) {
      this.InsertUserForm.controls['sl'].setValue(0);
    }
  }
  checkTrail() {
    if (this.InsertUserForm.controls['trailAfter'].value > 100) {
      this.InsertUserForm.controls['trailAfter'].setValue(100);
    } else if (this.InsertUserForm.controls['trailAfter'].value < 2) {
      this.InsertUserForm.controls['trailAfter'].setValue(2);
    }
  }
  @Output() public onUploadFinished = new EventEmitter();
  trades: any = [];
  pandl: any = [];
  editMode = false;
  payments: any[] = [];
  section = 'profile';
  renewMode = '';
  reportsSection = 'trade-history';
  userId!: number;
  userData!: IUserDetailsModel;

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
    profit: new FormControl(),
    sl: new FormControl(),
    trailAfter: new FormControl(),
    trailBy: new FormControl('.5'),
  });
  pandlForm: FormGroup = this.fb.group({
    selectedPandLToDate: new FormControl(moment(getIST()).format('YYYY-MM-DD')),
    selectedPandLFromDate: new FormControl(
      moment(getIST()).add(-1, 'days').format('YYYY-MM-DD')
    ),
  });
  payoutForm = this.fb.group({
    amount: new FormControl(0, [Validators.required]),
    // remarks: new FormControl('', [Validators.required]),
  });
  selectedDate = moment(getIST()).format('YYYY-MM-DD');
  loading: boolean = false;
  userDetails: any;
  allStateNames: any[] = [];
  countries: any[] = [];
  isAdmin = false;
  liveExpired = true;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private services: ServiceService,
    private encService: EncService,
    private strikeService: StrikeService,
    private tradeService: TradeService
  ) {}
  showMenu = false;
  ngOnInit(): void {
    this.userService.GetCountries().subscribe((res: any) => {
      this.countries = res;
    });
    this.userService.GetStates(1).subscribe((res: any) => {
      this.allStateNames = res;
    });
    this.route.paramMap.subscribe((params: any) => {
      const section = params.get('section');
      if (section != undefined) {
        this.section = section;
      }
    });
    this.userId = this.authService.getUserId();
    // this.getPayouts();

    this.userService.getProfile(this.userId).subscribe((res: any) => {
      this.userData = res;

      if (new Date(this.userData.planExpireDate) >= getIST())
        this.liveExpired = false;
    });
    if (this.userService.userDetails == undefined) {
      this.userService.getUserDetails(this.userId).subscribe((r: any) => {
        this.userDetails = r;

        this.userService.userDetails = r;
        this.payments = r.userPayments;

        this.InsertUserForm.controls['profit'].setValue(r.target?.profit);
        this.InsertUserForm.controls['sl'].setValue(r.target?.sl);
        this.InsertUserForm.controls['trailBy'].setValue(r.trail?.trailBy);
        this.InsertUserForm.controls['trailAfter'].setValue(
          r.trail?.trailAfter
        );
      });
    } else {
      this.payments = this.userDetails?.userPayments;
    }
    this.strikeService.getStocks().subscribe((res: any) => {
      this.stockList = res;
      this.getOrderList(this.selectedDate);
    });
  }
  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userStatus');

    this.router.navigateByUrl('');
  }

  changeRenewMode(mode: string) {
    this.renewMode = mode;
    if (mode == 'i4option') {
    } else {
    }
  }
  handleSort(orderBy: any, event: any) {
    event.target.children[0].classList.toggle('fa-caret-down');
    event.target.children[0].classList.toggle('fa-caret-up');
    const order = event.target.attributes['data-sort'].value;

    if (order === 'desc') {
      event.target.attributes['data-sort'].value = 'asc';
      this.ledger.sort(predicateByDesc(orderBy));
    } else {
      event.target.attributes['data-sort'].value = 'desc';
      this.ledger.sort(predicateBy(orderBy));
    }
  }
  payouts: any = [];
  getPayouts() {
    this.userService.GetPayouts(this.userId).subscribe((res) => {
      this.payouts = res;
    });
  }
  savepayout() {
    if (this.payoutForm.valid && this.payoutForm.controls.amount.value) {
      var request: IPayoutRequest = {
        amount: this.payoutForm.controls.amount.value,
        remarks: '',
        userId: this.userId,
      };
      this.userService.savePayout(request).subscribe((res) => {
        Swal.fire('Success', '', 'success');
        this.getPayouts();
      });
    } else {
      Swal.fire('*Requiered', 'Please fill int he required fields', 'error');
    }
  }
  loadUserDetails() {
    this.editMode = true;
    this.loading = true;
    this.userService.getProfile(this.userId).subscribe(
      (r: any) => {
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
      },
      (error: any) => console.log(error),
      () => {
        this.loading = false;
      }
    );
  }

  saveDetails() {
    if (this.InsertUserForm.valid) {
      let values: IUserFormModel = {
        id: this.userId,
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
  stockList: any = [];
  ledger: any = [];
  credits = 0;
  debits = 0;
  positions: any = [];
  chooseSection(event: any) {
    const selection = event.target.value;
    this.reportsSection = selection;
    if (selection == 'trade-history') {
      this.getOrderList(this.selectedDate);
    } else if (selection == 'pandl') {
      this.changePandLDate();
    } else if (selection == 'ledger' || selection == 'funds') {
      this.userService.getLedger(this.userId).subscribe((res: any) => {
        this.ledger = res;

        // Sort the ledger by 'createdOn' in descending order
        this.ledger.sort(predicateByDesc('createdOn'));

        // Convert createdOn to Date object and retain the original date format
        this.ledger.forEach((element: any) => {
          element.date = new Date(element.createdOn);
        });

        // Get trade positions for the user
        this.tradeService
          .getPositions(this.userId)
          .subscribe((positions: any) => {
            // Convert updatedOn to Date object and retain the original date format
            positions.forEach((element: any) => {
              element.date = new Date(element.updatedOn);
            });

            // Group positions by date
            let grped = _.groupBy(positions, (pos) => {
              return moment(pos.date).startOf('day').toDate().toString();
            });

            // Merge positions into the ledger
            _.map(grped, (values, key) => {
              const date = new Date(key);
              if (
                !this.ledger.find((x: any) =>
                  moment(x.date).isSame(date, 'day')
                )
              ) {
                this.ledger.push({
                  date: date,
                  amount: _.sum(values.map((x) => x.pandL)),
                });
              }
            });
            // Sort the ledger by 'date'
            this.ledger.sort(predicateByDesc('date'));

            // Calculate total credits and debits
            this.credits = _.sum(
              this.ledger
                .filter((x: any) => x.amount > 0)
                .map((x: any) => x.amount)
            );
            this.debits = _.sum(
              this.ledger
                .filter((x: any) => x.amount < 0)
                .map((x: any) => x.amount)
            );
          });
      });
    }
  }
  getBalance(index: number) {
    return _.sum(this.ledger.slice(0, index + 1).map((x: any) => x.amount));
  }
  getOrderList(date: any) {
    this.tradeService.allTradesByDate(date).subscribe((data: any) => {
      let symbols: any[] = [];
      data.forEach((v: any) => {
        if (!symbols.some((s) => s == v.symbol)) symbols.push(v.symbol);
      });

      let newSymbols = symbols.filter(
        (x) => !this.tradeService.allStockList.some((s) => s.symbol == x)
      );
      if (newSymbols.length > 0) {
        this.strikeService.getSymbolsDetails(symbols).subscribe((res: any) => {
          res.forEach((element: any) => {
            if (
              this.tradeService.allStockList.find((s) => s == element) ==
              undefined
            )
              this.tradeService.allStockList.push(element);
          });
          localStorage.setItem(
            'allStockList',
            this.encService.encrypt(
              JSON.stringify(this.tradeService.allStockList)
            )
          );
          this.refreshTradesList(data, date);
        });
      } else {
        this.refreshTradesList(data, date);
      }
    });
  }
  refreshTradesList(data: any, date: any) {
    let _trades = data.filter(
      (x: any) => moment(x.time).date() == moment(date).date()
    );
    this.trades = _trades.filter((order: any) => {
      if (order.strategy == 'straddle') {
        order.alias = `${
          this.stockList.find((s: any) => s.displayName == order.symbol)?.name
        } ${moment(order.expiry).format('MMM').toUpperCase()} ${
          order.strike
        } SD`;
      } else
        order.alias = `${
          this.tradeService.allStockList.find(
            (s: any) => s.symbol == order.symbol
          )?.alias
        }`;
        if(order.alias=="undefined")
        {
          order.alias = order.symbol
        }

      return order;
    });
  }
  changeDate(event: any) {
    var date = event.target.value;
    this.selectedDate = date;
    this.getOrderList(date);
  }
  changePandLDate() {
    this.tradeService.getPositions(this.userId).subscribe((res: any) => {
      this.positions = res.filter((x: any) => {
        const updatedOnDate = moment(x.updatedOn, 'YYYY-MM-DD').toDate();
        const fromDate = moment(
          this.pandlForm.controls['selectedPandLFromDate'].value,
          'YYYY-MM-DD'
        ).toDate();
        const toDate = moment(
          this.pandlForm.controls['selectedPandLToDate'].value,
          'YYYY-MM-DD'
        ).toDate();
        if (x.strategy == 'straddle') {
          x.symbol = `${
            this.stockList.find((s: any) => s.displayName == x.symbol)?.name
          } ${moment(x.expiry).format('MMM').toUpperCase()} ${x.strike} SD`;
        }

        return updatedOnDate >= fromDate && updatedOnDate <= toDate;
      });
    });
  }
  getpnlsum() {
    return _.sum(
      this.positions.map((x: any) => {
        return x.pandL;
      })
    );
  }
}
