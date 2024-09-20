export type SupportedCurrency = 'XLM' | 'wBTC' | 'wETH' | 'USDC' | 'EURC';

export type Currency = {
  name: string;
  ticker: SupportedCurrency;
  tokenContractAddress: string;
  loanPoolName: string;
};

// The addresses here are for testnet.
// TODO: use environment variables for the addresses.

export const CURRENCY_XLM: Currency = {
  name: 'Stellar Lumen',
  ticker: 'XLM',
  tokenContractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  loanPoolName: 'pool_xlm',
} as const;

export const CURRENCY_WBTC: Currency = {
  name: 'Wrapped Bitcoin',
  ticker: 'wBTC',
  tokenContractAddress: 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
  loanPoolName: 'pool_wbtc',
} as const;

export const CURRENCY_WETH: Currency = {
  name: 'Wrapped Ethereum',
  ticker: 'wETH',
  tokenContractAddress: 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
  loanPoolName: 'pool_weth',
} as const;

export const CURRENCY_USDC: Currency = {
  name: 'USD Coin',
  ticker: 'USDC',
  tokenContractAddress: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  loanPoolName: 'pool_usdc',
} as const;

export const CURRENCY_EURC: Currency = {
  name: 'Euro Coin',
  ticker: 'EURC',
  tokenContractAddress: 'GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO',
  loanPoolName: 'pool_eurc',
} as const;

export const CURRENCIES: Currency[] = [
  CURRENCY_XLM,
  CURRENCY_WBTC,
  CURRENCY_WETH,
  CURRENCY_USDC,
  CURRENCY_EURC,
] as const;
