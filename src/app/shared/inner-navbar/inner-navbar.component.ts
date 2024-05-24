import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Location } from '@angular/common';
import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-inner-navbar',
  templateUrl: './inner-navbar.component.html',
  styleUrls: ['./inner-navbar.component.css'],
  animations: [
    trigger('profileMenu', [
      state(
        'open',
        style({
          visibility: 'visible',
          transform: 'scale(1, 0.95)',
        })
      ),
      state(
        'closed',
        style({
          visibility: 'hidden',
          transform: 'scale(0.95, 1)',
        })
      ),
      transition('open => closed', [animate('200ms ease-in')]),
      transition('closed => open', [animate('100ms ease-out')]),
    ]),
    trigger('mobileMenu', [
      state(
        'open',
        style({
          display: 'block',
        })
      ),
      state(
        'closed',
        style({
          display: 'none',
        })
      ),
    ]),
  ],
})
export class InnerNavbarComponent {
  datetime = new Date()
  profileMenu = false;
  mobileMenu = false;
  user:any;
  timer:any
  selectedPath: string = '';
  @ViewChild('profileMenu1') profileMenuDiv1!: ElementRef;
  @ViewChild('profileMenu2') profileMenuDiv2!: ElementRef;
  ngOnDestroy()
  {
clearInterval(this.timer)
  }
  constructor(
    private _location: Location,
    public userService: UserService,
    private router: Router,
    private renderer: Renderer2,
    private authService: AuthService
  ) {
   this.timer= setInterval(()=>{
      this.datetime = new Date()
    },1000)
    this.userService.getUserDetails(this.authService.getUserId()).subscribe((_userDetails:any)=>{
      this.user =  _userDetails

    })
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.selectedPath = this._location.path();

        if (this.selectedPath.indexOf('/') > -1) {
          this.selectedPath = this.selectedPath.slice(
            this.selectedPath.lastIndexOf('/')+1,
            this.selectedPath.length
          );
        }

      
      }
    });
    this.renderer.listen('window', 'click', (e: any) => {
      if (
        !(
          e.target == this.profileMenuDiv1.nativeElement ||
          e.target == this.profileMenuDiv2.nativeElement
        )
      ) {
        this.profileMenu = false;
      }
    });
  }
  showTradeButton() {
    return this.userService.userDetails?.status == 'ACTIVE' ?? false;
  }
  get profileMenuTrigger() {
    return this.profileMenu ? 'open' : 'closed';
  }
  get mobileMenuTrigger() {
    return this.mobileMenu ? 'open' : 'closed';
  }
  toggleProfileMenu() {
    this.profileMenu = !this.profileMenu;
  }
  toggleMobileMenu() {

    this.mobileMenu = !this.mobileMenu;
  }
  closeAllMenu() {
    this.profileMenu = false;
  }
  logout() {
    localStorage.removeItem('userToken');
    this.router.navigateByUrl('/');
  }
}
