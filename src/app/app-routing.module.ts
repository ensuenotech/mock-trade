import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { InnerComponent } from './inner/inner.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { TradeComponent } from './trade/trade.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [{ path: "login", component: LoginComponent },
// { path: "register", component: RegisterComponent, title:"Register" },
// { path: "dashboard", component: DashboardComponent, title:"Dashboard" },
{ path: "auth/login", component: LoginComponent },
// { path: "forgot-password", component: ForgetPasswordComponent },
// { path: "auth/login", redirectTo: "login", pathMatch: "full", title:"login" },
// { path: "auth/register", redirectTo: "register", pathMatch: "full" },
// { path: "", redirectTo: "login", pathMatch: "full" },
// { path: "dashboard", redirectTo: "trade/dashboard", pathMatch: "full" },
{
  path: "auth/:token",
  component: LoginComponent,
  pathMatch: "full",
},
// { path: "**", redirectTo: "", pathMatch: "full" },
{
  path: 'trade',
  component:InnerComponent,
  loadChildren: () => import('./inner/inner.module').then(m => m.InnerModule)
},
// {
//   path: 'admin',
//   component:InnerComponent,
//   loadChildren: () => import('./inner/inner.module').then(m => m.InnerModule)
// }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false, onSameUrlNavigation:'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
