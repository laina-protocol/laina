import * as XLMPoolContract from '@contracts/loan_pool';
import * as USDCPoolContract from '@contracts/usdc_pool';
import StellarIcon from '@images/Stellar_Symbol.png';
import USDCIcon from '@images/usdc.svg';
import type { SupportedCurrency } from './stellar-wallet';

export type Currency = {
  name: string;
  symbol: SupportedCurrency;
  icon: string;
  loanPoolContract: typeof XLMPoolContract.contractClient;
  contractId: string;
};

export const CURRENCY_XLM: Currency = {
  name: 'Stellar Lumen',
  symbol: 'XLM',
  icon: StellarIcon.src,
  loanPoolContract: XLMPoolContract.contractClient,
  contractId: XLMPoolContract.contractId,
} as const;

export const CURRENCY_USDC: Currency = {
  name: 'USD Coin',
  symbol: 'USDC',
  icon: USDCIcon.src,
  loanPoolContract: USDCPoolContract.contractClient,
  contractId: USDCPoolContract.contractId,
} as const;

export const CURRENCIES: Currency[] = [CURRENCY_XLM, CURRENCY_USDC] as const;
