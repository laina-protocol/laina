import * as USDCPool from '@contracts/pool_usdc';
import * as XLMPool from '@contracts/pool_xlm';
import USDCIcon from '@images/usdc.svg';
import XLMIcon from '@images/xlm.svg';
import { CURRENCY_USDC, CURRENCY_XLM, type Currency } from 'currencies';

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

export const CURRENCY_BINDINGS = [BINDING_XLM, BINDING_USDC];
