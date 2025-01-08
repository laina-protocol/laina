import { type PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import type { SupportedCurrency } from 'currencies';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

export type PriceRecord = {
  [K in SupportedCurrency]: bigint;
};

export type PoolState = {
  totalBalance: bigint;
  availableBalance: bigint;
  totalShares: bigint;
  annualInterestRate: bigint;
};

export type PoolRecord = {
  [K in SupportedCurrency]: PoolState;
};

export type PoolContext = {
  prices: PriceRecord | null;
  pools: PoolRecord | null;
  refetchPools: () => void;
};

const Context = createContext<PoolContext>({
  prices: null,
  pools: null,
  refetchPools: () => {},
});

const fetchAllPrices = async (): Promise<PriceRecord> => {
  const [XLM, wBTC, wETH, USDC, EURC] = await Promise.all([
    fetchPriceData('XLM'),
    fetchPriceData('BTC'),
    fetchPriceData('ETH'),
    fetchPriceData('USDC'),
    fetchPriceData('EURC'),
  ]);
  return { XLM, wBTC, wETH, USDC, EURC };
};

const fetchPriceData = async (ticker: string): Promise<bigint> => {
  try {
    const { result } = await loanManagerClient.get_price({ token: ticker });
    return result;
  } catch (error) {
    console.error(`Error fetching price data: for ${ticker}`, error);
    return 0n;
  }
};

const fetchPools = async (): Promise<PoolRecord> => {
  const [XLM, wBTC, wETH, USDC, EURC] = await Promise.all([
    fetchPoolState('XLM'),
    fetchPoolState('wBTC'),
    fetchPoolState('wETH'),
    fetchPoolState('USDC'),
    fetchPoolState('EURC'),
  ]);
  return { XLM, wBTC, wETH, USDC, EURC };
};

const fetchPoolState = async (ticker: SupportedCurrency): Promise<PoolState> => {
  const { contractClient } = CURRENCY_BINDINGS[ticker];
  const { result } = await contractClient.get_pool_state();
  return {
    totalBalance: result.total_balance,
    availableBalance: result.available_balance,
    totalShares: result.total_shares,
    annualInterestRate: result.annual_interest_rate,
  };
};

export const PoolProvider = ({ children }: PropsWithChildren) => {
  const [prices, setPrices] = useState<PriceRecord | null>(null);
  const [pools, setPools] = useState<PoolRecord | null>(null);

  const refetchPools = useCallback(() => {
    fetchAllPrices()
      .then((res) => setPrices(res))
      .catch((err) => console.error('Error fetching prices', err));
    fetchPools()
      .then((res) => setPools(res))
      .catch((err) => console.error('Error fetching pools', err));
  }, []);

  useEffect(() => {
    refetchPools();

    // Set up a timer for every ledger (~6 secs) to refetch state.
    const intervalId = setInterval(refetchPools, 6000);
    return () => clearInterval(intervalId);
  }, [refetchPools]);

  return <Context.Provider value={{ prices, pools, refetchPools }}>{children}</Context.Provider>;
};

export const usePools = (): PoolContext => useContext(Context);
