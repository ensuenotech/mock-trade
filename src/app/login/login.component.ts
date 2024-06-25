import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ServiceService } from '../services/service.service';
import { StrikeService } from '../services/strike.service';
import { UserService } from '../services/user.service';
import { parseJwt } from '../services/utils';
import { AuthService } from '../services/auth.service';
import { EncService } from '../services/enc.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = this.fb.group({
    phonenumber: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(10),
    ]),
    countryCode: new FormControl('91'),
    otpType: new FormControl('whatsapp'),
  });
  OtpForm: FormGroup = this.fb.group({
    otp: new FormControl('', Validators.required),
  });
  showOtpForm = false;
  otpSent = false;
  timer = false;
  count = 30;
  resetOtpButton = false;
  correctOTP: string | undefined;
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route:ActivatedRoute,
    private strikeService: StrikeService,
    private encService:EncService,  
    private authService:AuthService
  ) {
    let token = this.route.snapshot.params?.['token']
    if (token) {
      
      this.userService.validateToken(token).subscribe((res: any) => {
        if (res.result) {
          
          localStorage.setItem('userToken', res.token);
          const userId = this.authService.getUserId()
          if (userId) {
            this.userService.getUserDetails(userId).subscribe((res: any) => {
              localStorage.setItem("userdata", this.encService.encrypt(JSON.stringify(res)))
            })
          }
          let params = this.route.snapshot.queryParams
       
          if (params?.['redirect']) {
            window.location.href = '/' + params['redirect']
          }
          else {
            window.location.href = '/trade'
          }

        }
      })
    } else {
      // setTimeout(() => {
      //   window.location.href = "https://dashboard.i4option.com/login"
        
      // }, 1000);

    }
  }

  ngOnInit(): void {
    const token = localStorage.getItem('userToken');
    if (!token) {
      this.router.navigateByUrl('');
    } else {
      this.userService.refreshToken(token).subscribe((res: any) => {
        if (res.success) {
          this.router.navigateByUrl('/trade/dashboard');
        }
        // else {
        //   this.router.navigate(['login']);

        // }
      });
    }
  }
  resend() {
    this.userService
      .resendOtp(
        this.loginForm.controls['phonenumber'].value,
        this.loginForm.controls['otpType'].value
      )
      .subscribe((res: any) => {
        this.timer = true;
        this.count = 30;
        this.resetOtpButton = false;
        var timerVal = setInterval(() => {
          this.count = this.count - 1;
          if (this.count <= 0) {
            clearInterval(timerVal);
            this.resetOtpButton = true;
            this.timer = false;
            return;
          }
        }, 1000);
        Swal.fire(
          'Sent successfully',
          'Your OTP has been resent successfully to ' +
            this.loginForm.controls['phonenumber'].value,
          'success'
        );
      });
  }
  submit() {
    if (this.loginForm.invalid) {
      // Swal.fire({
      //   title: 'Required',
      //   text: 'Please fill in the required details',
      //   icon: 'warning',
      // });
      this.errorMessage.message = 'Please check the Phone Number.';
      this.errorMessage.color = 'error';
    } else {
      Swal.fire({
        showCancelButton: true,
        title: 'IMPORTANT',
        text: `Trade Responsibly in Futures & Options
      Trade Responsibly in Futures & Options
      Risk Disclosures on Derivatives:
      9 out of 10 individual traders in equity Futures and Options Segment, incurred net losses.
      On an average, loss makers registered net trading loss close to ₹ 50,000.
      Over and above the net trading losses incurred, loss makers expended an additional 28% of net trading losses as transaction costs.
      Those making net trading profits, incurred between 15% to 50% of such profits as transaction costs.
      Source:
      SEBI study dated January 25, 2023 on “Analysis of Profit and Loss of Individual Traders dealing in equity Futures and Options (F&O) Segment”, wherein Aggregate Level findings are based on annual Profit/Loss incurred by individual traders in equity F&O during FY 2021-22`,
        icon: 'info',
      }).then((result) => {
        if (result.isConfirmed) {
          let number = `${this.loginForm.controls['countryCode'].value}${this.loginForm.controls['phonenumber'].value}`;
          this.userService
            .sendOtp(Number(number), this.loginForm.controls['otpType'].value)
            .subscribe(
              (res: any) => {
                if (res.result) {
                  var _token = parseJwt(res.token);
                  this.userId = _token.userId;
                  this.showOtpForm = true;
                  this.otpSent = true;
                  this.correctOTP = _token.otp;
    
                  this.timer = true;
                  this.count = 30;
                  this.resetOtpButton = false;
                  var timerVal = setInterval(() => {
                    this.count = this.count - 1;
                    if (this.count <= 0) {
                      clearInterval(timerVal);
                      this.resetOtpButton = true;
                      this.timer = false;
                      return;
                    }
                  }, 1000);
                }
              },
              (err) => {
                let error = err.error;
                // if(error=="USER_NOT_FOUND")
                {
                  this.errorMessage = {
                    color: 'error',
                    message: 'User not found. Please contact admin@straddly.com',
                  };
                }
              }
            );
        } else if (result.isDenied) {
          
        }
      });

    
    }
  }
  userId: number | undefined;
  errorMessage = { message: '', color: '' };
  verifyOtp() {
    if (this.OtpForm.valid && this.userId) {
      if (this.correctOTP == this.OtpForm.controls['otp'].value.trim()) {
        const userData = {
          otp: this.OtpForm.controls['otp'].value,
          userId: this.userId,
        };
        this.userService
          .authenicateOTP(userData.otp, this.userId)
          .subscribe((res: any) => {
            if (res.result) {
              localStorage.setItem('userToken', res.token);
              sessionStorage.removeItem('token');
              this.strikeService.refreshToken();

              this.router.navigateByUrl('/trade/dashboard');
            } else Swal.fire('Error', 'Incorrect OTP', 'error');
          });
      } else {
        this.errorMessage = { message: 'Incorrect OTP', color: 'error' };
      }
    } else {
      this.errorMessage = { message: 'All fields required', color: 'error' };
    }
  }
}
