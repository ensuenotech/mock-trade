import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { parseJwt } from './utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router:Router) { 
    let token = localStorage.getItem('userToken');
    if(token==null)
    this.router.navigateByUrl('/auth/login')

  }

  getUserId() {
    const token = localStorage.getItem('userToken');
    
    if(token==null) return null;
    return parseJwt(token).nameid;
  }

  isAdminUser() {
    const token = localStorage.getItem('userToken');
    const parsedToken = parseJwt(token);
    let user = parsedToken.userType;
    if (user == "ADMIN") {
      return true
    }
    // return this.user === Role.admin;
    return false
  }
  isManager() {
    const token = localStorage.getItem('userToken');
    const parsedToken = parseJwt(token);
    let user = parsedToken.userType;
    if (user == "MANAGER") {
      return true
    }
    // return this.user === Role.admin;
    return false
  }
  getTokenDetails() {
    const token = localStorage.getItem('userToken');
    if(token==null) return null;
    return parseJwt(token);
  }
}
