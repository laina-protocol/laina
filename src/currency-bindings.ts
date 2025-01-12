import * as EURCPool from '@contracts/pool_eurc';
import * as USDCPool from '@contracts/pool_usdc';
import * as XLMPool from '@contracts/pool_xlm';
import EURCIcon from '@images/eurc.svg';
import USDCIcon from '@images/usdc.svg';
import XLMIcon from '@images/xlm.svg';
import { CURRENCY_EURC, CURRENCY_USDC, CURRENCY_XLM, type Currency } from 'currencies';

/* These bindings are separate from the top-level currencies.ts
 * because the TS bindings are auto-generated during init and
 * needed for this file to compile.
 */

export interface CurrencyBinding extends Currency {
  icon: string;
  contractClient: typeof XLMPool.contractClient;
  contractId: string;
}

export const BINDING_XLM: CurrencyBinding = {
  ...CURRENCY_XLM,
  ...XLMPool,
  icon: XLMIcon.src,
};

export const BINDING_USDC: CurrencyBinding = {
  ...CURRENCY_USDC,
  ...USDCPool,
  icon: USDCIcon.src,
};

export const BINDING_EURC: CurrencyBinding = {
  ...CURRENCY_EURC,
  ...EURCPool,
  icon: EURCIcon.src,
};

export const CURRENCY_BINDINGS = {
  XLM: BINDING_XLM,
  USDC: BINDING_USDC,
  EURC: BINDING_EURC,
} as const;

export const CURRENCY_BINDINGS_ARR = Object.values(CURRENCY_BINDINGS);
