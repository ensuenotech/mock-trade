import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IRegisterUserModel } from 'src/models/user.model';
import Swal from 'sweetalert2';
import { UserService } from '../services/user.service';
import { parseJwt } from '../services/utils';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  section = 'mobile-number'
  userId: number =0
  InsertUserForm: FormGroup = this.fb.group({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
    
  });
  OtpForm: FormGroup = this.fb.group({
    otp: new FormControl('', Validators.required),
    mobile: new FormControl('', [Validators.required, Validators.maxLength(10), Validators.minLength(10)]),
    otpType: new FormControl('whatsapp')
  });

  constructor(private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params:any) => {
      let section = params.get('section');
      if (section) {
        if (section == 'validate-otp') {
          // this.showOtpForm = true;
          this.route.queryParams.subscribe((params:any) => {
            let id = params["id"]
            if (id != undefined) {
              var userToken = parseJwt(id)
              var datetnow = new Date()
              var expiry = new Date(userToken.exp * 1000)
              let userMobileNumber = userToken.mobile
              this.userMobileNumber = userMobileNumber
              let userId = userToken.userId
              if (expiry <= datetnow) {
                Swal.fire({
                  title: "Error",
                  text: "The link has been expired",
                  icon: "error"
                }).then(() => {
                  this.router.navigateByUrl('/register');
                })
              }
              else {
                Swal.fire('Success', 'You will be redirected to login screen. Now you can login with your credentials.', 'success')

                this.userService.sendWelcomeEmail(userId).subscribe((res: any) => {
                  this.router.navigateByUrl('/login');
                });


                // this.timer = true;
                // var timerVal = setInterval(() => {
                //   this.count = this.count - 1;
                //   if (this.count <= 0) {
                //     clearInterval(timerVal);
                //     this.resetOtpButton = true;
                //     this.timer = false;
                //     return;
                //   }
                // }, 1000)
              }
            }
            else {
              // console.log("invalid")
            }
          })
        }
      }
    });
  }
  verifyOtp() {
    if (this.OtpForm.valid) {
      const userData = {
        otp: this.OtpForm.controls['otp'].value,
        userId: this.userId,
      };

      // this.loading = true
      this.userService.authenicateOTP(userData.otp, userData.userId).subscribe((res: any) => {
        // this.loading = false
        if (res === 'VALID') {
          // Swal.fire('Success', 'You will be redirected to login screen. Now you can login with your credentials.', 'success').then(() => {
          // this.router.navigateByUrl('/login');
          this.section = 'validate-otp'

          // this.userService.sendWelcomeEmail(this.userId).subscribe();
        } else if (res == "INVALID") {
          Swal.fire('Error', 'Incorrect OTP', 'error');
        }
        else {

        }
      });
    } else {
      Swal.fire('Required', 'All fields required', 'error');
    }
  }
  saveDetails() {
    if (this.InsertUserForm.valid) {

      this.userService.searchUser(this.InsertUserForm.controls['email'].value).subscribe((res: any) => {
        if (res) {
          Swal.fire('Error', 'User Already Registered with this email id. Please contact admin.', 'error');

        }
        else {

          let userRegistrationData: IRegisterUserModel = {
            id: this.userId,
            firstName: this.InsertUserForm.controls['firstName'].value,
            lastName: this.InsertUserForm.controls['lastName'].value,
            password: this.InsertUserForm.controls['password'].value,
            email: this.InsertUserForm.controls['email'].value,
          };
          // this.loading = true
          this.userService.register(userRegistrationData)
            .subscribe((res: any) => {
              // this.loading = false
              if (res > 0) {
                Swal.fire({
                  title: "Success",
                  text: "Thank you for the registration. Please verify your account using the link sent on the email id: " + userRegistrationData.email,
                  icon: "success"
                }).then(() => {
                  this.router.navigateByUrl("/")
                })


              } else {
                Swal.fire('Error', "There is some technical error. Please try again later.", 'error');
              }
            });

        }

      })

    } else {
      Swal.fire('Required', 'All fields required', 'error');
    }
  }
  resend() {
    this.userService.sendOtp( this.userMobileNumber, this.InsertUserForm.controls['otpType'].value).subscribe((res: any) => {
      this.timer = true;
      this.count = 30
      this.resetOtpButton = false
      var timerVal = setInterval(() => {
        this.count = this.count - 1;
        if (this.count <= 0) {
          clearInterval(timerVal);
          this.resetOtpButton = true;
          this.timer = false;
          return;
        }
      }, 1000)
      Swal.fire('Sent successfully', 'Your OTP has been resent successfully to ' + this.userMobileNumber, 'error');

    })
  }
  userMobileNumber:number =0
  otpSent = false
  count = 30
  timer = false
  resetOtpButton = false
  registerViaMobile() {

    if (this.OtpForm.controls['mobile'].valid) {
      // this.loading = true
      // this.loading = false
      // this.userId = 14
      // this.otpSent = true
      this.userService.registerviamobile(this.OtpForm.controls['mobile'].value).subscribe((res: any) => {
        // this.loading = false
        if (res.success == false) {
          Swal.fire('Error', 'User Already Registered with this phone number. Please contact admin.', 'error');
          return;
        }
        else {
          this.userId = res.id
          if (res.status == "PENDING") {
            this.otpSent = true
            this.userMobileNumber = this.OtpForm.controls['mobile'].value
            this.timer = true;
            var timerVal = setInterval(() => {
              this.count = this.count - 1;
              if (this.count <= 0) {
                clearInterval(timerVal);
                this.resetOtpButton = true;
                this.timer = false;
                return;
              }
            }, 1000)
          }
          else if (res.status == "EMAIL_PENDING") {
            if (res.user.email != "")
              Swal.fire('', `An email has already been sent to you at ${res.user.email}. Please verify your account using the link sent on the email id.`, 'info');
            else {
              this.section = 'validate-otp'
              // this.userMobileNumber = res.user.mobile
              this.userId = res.id
            }
          }
        }

      })
    }
    else {
      Swal.fire('Required', 'Please check the mobile number. It should be of 10 digits. Only Indian mobile numbers are allowed. Non Resident Indian, email us support@ifil.co.in', 'error');

    }

  }
}
