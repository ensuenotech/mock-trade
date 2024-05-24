export interface IRegisterUserModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  id?: number;
}
export interface IUserFormModel {
  id?: number;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  userType?: string;
  mobile?: string;
  status?: string;
  planExpireDate?: Date;
  stateId?: number;
  countryId?: number;
  address?: string;
  pincode?: string;
  city?: string;
  aadharNumber: string;
  panNumber: string;
  bankAccount: string;
  cancelledCheque?: string;
  upi: string;
  panCard?: string;
  aadhar?: string;
}
export interface IPayoutRequest
{
  userId:number
  amount:number
  remarks:string
}
export interface IUserDetailsModel {
  address: {
    address: string;
    city: string;
    country: string;
    countryId: number;
    firstName: string;
    id: number;
    lastName: string;
    pinCode: string;
    state: string;
    stateId: number;
  };
  createdOn: Date;
  email: string;
  mobile: string;
  firstName: string;
  id: number;
  status: string;
  lastName: string;
  password: string;
  planExpireDate: Date;
  updatedOn: Date;
  aadharNumber: string;
  panNumber: string;
  bankAccount: string;
  cancelledCheque: string;
  upi: string;
  panCard: string;
  userType: string;
  userPayments: any[];
}
export interface DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}
export interface MapBrokeragePlanRequest {
  userId: number;
  brokeragePlan:string
}
export interface IUpdatePayoutRequest
{
  payoutId:number
  status:string
  type?:string
  particular?:string
}