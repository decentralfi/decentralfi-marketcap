export const environment = {
  production: true,
  endpoint: 'https://qaapi.decentralfi.io/api/v1/',
  midgard_endpoint: 'https://stagenet-midgard.ninerealms.com/v2/',
  thornode_endpoint: 'https://stagenet-thornode.ninerealms.com/thorchain/',
  defaultThorVersion: 'multichain',
  network: 'stagenet',
  blockchairKey: process.env['BLOCKCHAIR_KEY'],
  ASGARD_BASE_URL: 'https://asgard-consumer.vercel.app',
  BNB_BASE_NUMBER: Math.pow(10, 8), // 1e8
  captchaSecret: '6LcBukQaAAAAAFHuIXx3FoxkbEunCysvcxgspjHm',
  etherscanKey: process.env['ETHERSCAN_KEY'],
  infuraProjectId: process.env['INFURA_PROJET_ID'],
  maintenance: true,
  language: 'en',
};
