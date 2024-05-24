import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IUserDetailsModel } from 'src/models/user.model';
import Swal from 'sweetalert2';
import { ServiceService } from '../services/service.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {

  sendOtpForm = this.fb.group({
    email: new FormControl('', Validators.required),
  });
  verifyOtpForm = this.fb.group({
    activationCode: new FormControl('', Validators.required),
  });
  changePasswordForm = this.fb.group({
    newPassword: new FormControl('', Validators.required),
    confirmPassword: new FormControl('', Validators.required),
  });
  userEmail!: string;
  userId!: number;
  loading: boolean = false;
  showChangeForm = false
  userDetails: any;
  constructor(private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private services: ServiceService,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params:any) => {
      const u = params["u"]
      if (u != undefined) {
        let id = Number(this.services.decryptData(u))
        this.userService.getUserDetails(id).subscribe((res: any) => {
          this.sendOtpForm.get('email')?.setValue(res.email)
          this.sendOtpMail()
        })
      }
    })
    this.sendOtpForm = this.fb.group({
      email: new FormControl('', Validators.required),
    });
    this.verifyOtpForm = this.fb.group({
      activationCode: new FormControl('', Validators.required),
    });
    this.changePasswordForm = this.fb.group({
      newPassword: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    });
  }
  sendOtp() {
    if (this.sendOtpForm.valid) {
      this.sendOtpMail()

    } else {
      Swal.fire('Required', 'All fields required', 'error');
    }
  }
  sendOtpMail() {
    this.loading = true
    this.userService.searchUser(this.sendOtpForm.controls['email'].value ?? '').subscribe((res: any) => {
      this.loading = false
      if (res == null) {
        Swal.fire("No User Found", "There is no such user. Please check the Email Id entered.", "error")
        return
      }
      this.userId = res

      this.userService.getUserDetails(this.userId).subscribe((user: any) => {
        this.loading = false
        if (user.status != 'ACTIVE') {
          Swal.fire("Account not active", "Your account has been pending verification. Please contact support", "info")
          return
        }
        this.userService.sendOtpMail(res).subscribe((res:any) => {
          if (res) {
            this.userEmail = this.sendOtpForm.controls.email.value ?? '';
          }
          else {
            Swal.fire('Error', 'Email not registered', 'error');

          }
        }, (error:any) => {
          if (error.error.contains("phone number is required")) {
            Swal.fire("Error", "A valid phone number is required. Please contact support.", "error")
          }
          if (error.error.contains("is not a valid phone number")) {
            Swal.fire("Error", "A valid phone number is required. Please contact support.", "error")
          }
        })
      })




    })
  }
  verifyOtp() {
    if (this.verifyOtpForm.valid) {
      const userData = {
        otp: Number(this.verifyOtpForm.controls.activationCode.value),
        userId: this.userId,
      };
      this.userService.authenicateOTP(userData.otp, userData.userId).subscribe((res: any) => {

        if (res === 'VALID') {
          this.showChangeForm = true
        } else {
          Swal.fire('Error', 'Incorrect OTP', 'error');
        }
      });
    } else {
      Swal.fire('Required', 'All fields required', 'error');
    }
  }
  changePassword() {
    if (this.changePasswordForm.controls.newPassword.value != this.changePasswordForm.controls.confirmPassword.value) {
      Swal.fire('Error', 'Both passwords should match', 'error');
      return
    }
    if (this.changePasswordForm.valid) {
      const userData = {
        password: this.changePasswordForm.controls.newPassword.value,
        userId: this.userId,
      };

      this.userService.changePassword(userData)
        .subscribe((res: any) => {
          if (res) {
            Swal.fire('Success', 'Your password has been changed successfully', 'success');
            this.router.navigateByUrl('/login');
          } else {
          }
        });
    } else {
      Swal.fire('Required', 'All fields required', 'error');
    }
  }

}
