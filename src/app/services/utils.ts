import { HttpHeaders } from '@angular/common/http';

export const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
  };
  
  export function parseJwt(token:any) {
	if (token == null)
		window.location.href = "/"
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(
		atob(base64)
			.split('')
			.map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join('')
	);

	return JSON.parse(jsonPayload);
}
export const getUTC = () => {
    let currentTime = new Date(new Date().toUTCString())

    return new Date(currentTime.getTime() + currentTime.getTimezoneOffset() * 60000)
    // return new Date(new Date().toUTCString())
}
export const getIST = () => {
    let time = new Date()
    time = new Date(time.setTime(getUTC().getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000)))
    return time
}
