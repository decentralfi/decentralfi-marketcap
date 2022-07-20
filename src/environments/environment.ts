// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// export const environment = {
//   production: false,
//   endpoint: 'https://devapi.decentralfi.io/api/v1/',
//   midgard_endpoint: 'https://testnet.midgard.thorchain.info/v2/',
//   thornode_endpoint: 'https://testnet.thornode.thorchain.info/thorchain/',
//   defaultThorVersion: 'multichain',
//   network: 'testnet',
//   blockchairKey: process.env.BLOCKCHAIR_KEY,
//   BNB_BASE_NUMBER: Math.pow(10, 8), // 1e8
//   captchaSecret: '6LcBukQaAAAAAFHuIXx3FoxkbEunCysvcxgspjHm',
//   etherscanKey: process.env['ETHERSCAN_KEY'],
//   infuraProjectId: process.env['INFURA_PROJET_ID'],
//   maintenance: true,
//   language: 'en',
// };

export const environment = {
  production: false,
  endpoint: 'https://api.decentralfi.io/api/v1/',
  midgard_endpoint: 'https://midgard.ninerealms.com/v2/',
  thornode_endpoint: 'https://thornode.ninerealms.com/thorchain/',
  defaultThorVersion: 'multichain',
  network: 'chaosnet',
  blockchairKey: process.env['BLOCKCHAIR_KEY'],
  BNB_BASE_NUMBER: Math.pow(10, 8), // 1e8
  captchaSecret: '6LcBukQaAAAAAFHuIXx3FoxkbEunCysvcxgspjHm',
  etherscanKey: process.env['ETHERSCAN_KEY'],
  infuraProjectId: process.env['INFURA_PROJET_ID'],
  maintenance: true,
  language: 'en',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
