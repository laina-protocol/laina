export type SupportedCurrency = 'XLM' | 'USDC' | 'EURC';

export const isSupportedCurrency = (obj: unknown): obj is SupportedCurrency =>
  typeof obj === 'string' && ['XLM', 'USDC', 'EURC'].includes(obj);

export type Currency = {
  name: string;
  ticker: SupportedCurrency;
  issuerName: string;
  tokenContractAddress: string;
  loanPoolName: string;
  issuer?: string;
};

// The addresses here are for testnet.
// TODO: use environment variables for the addresses.

export const CURRENCY_XLM: Currency = {
  name: 'Stellar Lumens',
  ticker: 'XLM',
  issuerName: 'native',
  tokenContractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  loanPoolName: 'pool_xlm',
} as const;

export const CURRENCY_USDC: Currency = {
  name: 'USD Coin',
  ticker: 'USDC',
  issuerName: 'circle.io',
  tokenContractAddress: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  loanPoolName: 'pool_usdc',
  issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
} as const;

export const CURRENCY_EURC: Currency = {
  name: 'Euro Coin',
  ticker: 'EURC',
  issuerName: 'circle.io',
  tokenContractAddress: 'CCUUDM434BMZMYWYDITHFXHDMIVTGGD6T2I5UKNX5BSLXLW7HVR4MCGZ',
  loanPoolName: 'pool_eurc',
  issuer: 'GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO',
} as const;

export const CURRENCIES: Currency[] = [CURRENCY_XLM, CURRENCY_USDC, CURRENCY_EURC] as const;
