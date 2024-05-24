// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // coreAppURL: "https://localhost:44330",
  coreAppURL: "https://testapi.i4option.com",
  tradeAPI_URL: "https://wsapimarket.niftyaction.com",
  stockDetailsURL: "https://testapi.i4option.com",
  // wsTradeURL: "ws://localhost:3000/",
  wsTradeURL: "wss://wsapimarket.niftyaction.com",
  mode:"live",
  authentication: {
    rsa: {
      key: 'straddly#12345678900987654321',
      enabled: true
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
