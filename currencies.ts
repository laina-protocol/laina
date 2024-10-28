export type SupportedCurrency = 'XLM' | 'wBTC' | 'wETH' | 'USDC' | 'EURC';

export const isSupportedCurrency = (obj: unknown): obj is SupportedCurrency =>
  typeof obj === 'string' && ['XLM', 'wBTC', 'wETH', 'USDC', 'EURC'].includes(obj);

export type Currency = {
  name: string;
  ticker: SupportedCurrency;
  tokenContractAddress: string;
  loanPoolName: string;
  issuer?: string;
};

// The addresses here are for testnet.
// TODO: use environment variables for the addresses.

export const CURRENCY_XLM: Currency = {
  name: 'Stellar Lumens',
  ticker: 'XLM',
  tokenContractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  loanPoolName: 'pool_xlm',
} as const;

export const CURRENCY_WBTC: Currency = {
  name: 'Bitcoin',
  ticker: 'wBTC',
  tokenContractAddress: 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
  loanPoolName: 'pool_wbtc',
  issuer: 'GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56',
} as const;

export const CURRENCY_WETH: Currency = {
  name: 'Ethereum',
  ticker: 'wETH',
  tokenContractAddress: 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
  loanPoolName: 'pool_weth',
  issuer: 'GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56',
} as const;

export const CURRENCY_USDC: Currency = {
  name: 'USD Coin',
  ticker: 'USDC',
  tokenContractAddress: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  loanPoolName: 'pool_usdc',
  issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
} as const;

export const CURRENCY_EURC: Currency = {
  name: 'Euro Coin',
  ticker: 'EURC',
  tokenContractAddress: 'CCUUDM434BMZMYWYDITHFXHDMIVTGGD6T2I5UKNX5BSLXLW7HVR4MCGZ',
  loanPoolName: 'pool_eurc',
  issuer: 'GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO',
} as const;

export const CURRENCIES: Currency[] = [
  CURRENCY_XLM,
  CURRENCY_WBTC,
  CURRENCY_WETH,
  CURRENCY_USDC,
  CURRENCY_EURC,
] as const;
