import type { SupportedCurrency } from './src/stellar-wallet';

export type Currency = {
  name: string;
  ticker: SupportedCurrency;
  tokenContractAddress: string;
  loanPoolName: string;
};

export const CURRENCY_XLM: Currency = {
  name: 'Stellar Lumen',
  ticker: 'XLM',
  tokenContractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  loanPoolName: 'pool_xlm',
} as const;

export const CURRENCY_USDC: Currency = {
  name: 'USD Coin',
  ticker: 'USDC',
  tokenContractAddress: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  loanPoolName: 'pool_usdc',
} as const;

export const CURRENCIES: Currency[] = [CURRENCY_XLM, CURRENCY_USDC] as const;
