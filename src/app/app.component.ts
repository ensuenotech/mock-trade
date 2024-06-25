import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Mock Trade';

  constructor() {
    this.clearLocalStorageKeyOnce('allStockList');
  }
  clearLocalStorageKeyOnce(key: string): void {
    const flag = localStorage.getItem(key);
    const flagDate = localStorage.getItem(key + '_date');
    const now = new Date().getTime();
    const oneDay = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    if (!flag || !flagDate || now - Number(flagDate) > oneDay) {
      localStorage.removeItem(key);
      localStorage.setItem(key + '_date', String(now));
    }
  }
}
