export const environment = {
  production: true,
  endpoint: 'https://api.decentralfi.io/api/v1/',
  midgard_endpoint: 'https://midgard.ninerealms.com/v2/',
  thornode_endpoint: 'https://thornode.ninerealms.com/thorchain/',
  defaultThorVersion: 'multichain',
  network: 'chaosnet',
  blockchairKey: process.env['BLOCKCHAIR_KEY'],
  ASGARD_BASE_URL: 'https://asgard-consumer.vercel.app',
  BNB_BASE_NUMBER: Math.pow(10, 8), // 1e8
  captchaSecret: '6LcBukQaAAAAAFHuIXx3FoxkbEunCysvcxgspjHm',
  etherscanKey: process.env['ETHERSCAN_KEY'],
  infuraProjectId: process.env['INFURA_PROJET_ID'],
  maintenance: false,
  language: 'en',
};
