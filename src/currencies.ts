import XLMPoolContract from '@contracts/loan_pool';
import USDCPoolContract from '@contracts/usdc_pool';
import StellarIcon from '@images/Stellar_Symbol.png';
import USDCIcon from '@images/usdc.svg';

export type Currency = {
  name: string;
  symbol: string; // could be a type union of currency symbols.
  icon: string;
  loanPoolContract: typeof XLMPoolContract;
};

export const CURRENCIES: Currency[] = [
  {
    name: 'Stellar Lumen',
    symbol: 'XLM',
    icon: StellarIcon.src,
    loanPoolContract: XLMPoolContract,
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: USDCIcon.src,
    loanPoolContract: USDCPoolContract,
  },
];
