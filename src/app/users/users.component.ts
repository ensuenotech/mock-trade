import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DataTablesResponse } from 'src/models/user.model';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AddFundsDialogComponent } from '../shared/add-funds-dialog/add-funds-dialog.component';
import { EditUserComponent } from '../shared/edit-user/edit-user.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject();
  @ViewChild(DataTableDirective, { static: false })
  datatableElement!: DataTableDirective;
  loading = true
  users:any = [];
  searchUserForm: FormGroup;
  
  skip = 0;
  limit = 200;
  selectedUserType = 'ACTIVE';
  _MS_PER_HOUR = 1000 * 60 * 60;

  usersCount: any[] = []
  constructor(
    private userService: UserService,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private authService:AuthService,
    private router: Router,
    private httpClient: HttpClient
  ) {
    if(!this.authService.isAdminUser())this.router.navigateByUrl('/') 
    this.searchUserForm = this.fb.group({
      UserName: new FormControl(),
      state: new FormControl('ACTIVE'),
      count: new FormControl(200),
      skip: new FormControl(0),
    });
  }

  ngOnInit(): void {
    // this.getUsers();
    // for (var i = 0; i < 20000; i = i + 200) {
    //   this.usersCount.push(i)
    // }

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 50,
      serverSide: true,
      processing: true,
      stateSave: false,
      order: [[0, 'asc']],
      aLengthMenu: [
        [25, 50, 100, 200, -1],
        [25, 50, 100, 200, "All"],
      ],
      ajax: (dataTablesParameters: any, callback:any) => {
        this.httpClient.post<DataTablesResponse>(
          this.userService.ApiUrl + 'GetUsers',
          dataTablesParameters, {}
        ).subscribe(resp => {
          this.loading = false
          this.users = resp.data
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: []
          });
        });
      },
      columns: [{ data: 'id' }, { data: 'firstName' }, { data: 'lastName' }, { data: 'email' }, { data: 'createdOn' },  { data: 'mobile' },{ data: 'walletBalance' }, { data: 'status' }, { data: 'id' }, { data: 'id' }]
    };
  }
  ngAfterViewInit(): void {
    this.datatableElement.dtInstance.then((dtInstance: any) => {
      dtInstance.columns().every(function (this:any, index:any, value:any) {
        let that:any = this;
        $('input', this.footer()).val(dtInstance.column(index).search())

        $('input', this.footer()).on('keyup change', function (this:any) {
          if (that.search() !== this['value']) {
            that
              .search(this['value'])
              .draw();
          }
        });
      });
    });
  }
  reload() {
    this.datatableElement.dtInstance.then((dtInstance: any) => {
      dtInstance.ajax.reload()
    })
  }
  adduser() {
    this.router.navigateByUrl('/admin/edit-user/');
  }
  edituser(id:any) {
    this.dialog.open(EditUserComponent,{data:{userId:id}, width:"800px", disableClose:true})
  }

  deleteuser(id:any) {
    Swal.fire({
      title: "Confirm",
      icon: "warning",
      text: "Are you sure to delete this?",
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: "Yes Delete",
      cancelButtonText: "No, galti se click ho gya",
      focusCancel: true
    }).then((res) => {
      if (res.isConfirmed) {
        // this.userService.deleteUser(id).subscribe((res: any) => {
        //   if (res) {
        //     Swal.fire('Success');
        //     this.reload()
        //   }
        // });
      }
      else {
        Swal.fire("Dhyan se !!", "Dekh k click kia karo !!", "info")
      }
    })
  }
  
  // download() {
  //   this.loading = true
  //   this.userService.downloadAll().subscribe((res: { url, blob }) => {
  //     this.loading = false
  //     window.open(res.url)
  //   })
  // }

addfunds(id:any)
{
  this.dialog.open(AddFundsDialogComponent,{data:{userId:id, type:'funds'}, width:"600px"})
}


  dateDiffInDays(a:any, b:any) {
    const utc1 = Date.UTC(
      a.getFullYear(),
      a.getMonth(),
      a.getDate(),
      a.getHours(),
      a.getMinutes(),
      a.getSeconds()
    );
    const utc2 = Date.UTC(
      b.getFullYear(),
      b.getMonth(),
      b.getDate(),
      15,
      30,
      0,
      0
    );

    return Math.floor((utc2 - utc1) / this._MS_PER_HOUR);
  }
}

