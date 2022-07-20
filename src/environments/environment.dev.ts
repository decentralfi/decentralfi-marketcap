export const environment = {
  production: true,
  endpoint: 'https://devapi.decentralfi.io/api/v1/',
  midgard_endpoint: 'https://testnet.midgard.thorchain.info/v2/',
  thornode_endpoint: 'https://testnet.thornode.thorchain.info/thorchain/',
  defaultThorVersion: 'multichain',
  network: 'testnet',
  blockchairKey: process.env['BLOCKCHAIR_KEY'],
  ASGARD_BASE_URL: 'https://asgard-consumer.vercel.app',
  BNB_BASE_NUMBER: Math.pow(10, 8), // 1e8
  captchaSecret: '6LcBukQaAAAAAFHuIXx3FoxkbEunCysvcxgspjHm',
  etherscanKey: process.env['ETHERSCAN_KEY'],
  infuraProjectId: process.env['INFURA_PROJET_ID'],
  maintenance: true,
  language: 'en',
};
