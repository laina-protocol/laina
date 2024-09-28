import { FREIGHTER_ID, StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import type { xdr } from '@stellar/stellar-base';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Api as RpcApi } from '@stellar/stellar-sdk/rpc';
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import type { contractClient } from '@contracts/pool_xlm';
import type { SupportedCurrency } from 'currencies';
import { CURRENCY_BINDINGS } from './currency-bindings';

const HorizonServer = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org/');

export type Wallet = {
  address: string;
  displayName: string;
};

export type Balance = StellarSdk.Horizon.HorizonApi.BalanceLine;

export type BalanceRecord = {
  [K in SupportedCurrency]?: Balance;
};

export type Positions = {
  receivables: bigint;
  liabilities: bigint;
  collateral: bigint;
};

export type PositionsRecord = {
  [K in SupportedCurrency]?: Positions;
};

export type PriceRecord = {
  [K in SupportedCurrency]: bigint;
};

export type WalletContext = {
  wallet: Wallet | null;
  walletBalances: BalanceRecord;
  positions: PositionsRecord;
  prices: PriceRecord | null;
  createConnectWalletButton: (container: HTMLElement) => void;
  refetchBalances: () => void;
  signTransaction: SignTransaction;
};

type SignTransaction = (
  tx: XDR_BASE64,
  opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  },
) => Promise<XDR_BASE64>;

type XDR_BASE64 = string;

const Context = createContext<WalletContext>({
  wallet: null,
  walletBalances: {},
  positions: {},
  prices: null,
  createConnectWalletButton: () => {},
  refetchBalances: () => {},
  signTransaction: () => Promise.reject(),
});

const kit: StellarWalletsKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

const createWalletObj = (address: string): Wallet => ({
  address,
  displayName: `${address.slice(0, 4)}...${address.slice(-4)}`,
});

const fetchAllPositions = async (address: string): Promise<PositionsRecord> => {
  const positionsArr = await Promise.all(
    CURRENCY_BINDINGS.map(async ({ contractClient, ticker }) => [
      ticker,
      await fetchPositions(address, contractClient),
    ]),
  );
  return Object.fromEntries(positionsArr);
};

const fetchPositions = async (user: string, poolClient: typeof contractClient): Promise<Positions> => {
  const { simulation } = await poolClient.get_user_balance({ user });

  if (!simulation || !RpcApi.isSimulationSuccess(simulation)) {
    throw 'get_user_balance simulation was unsuccessful.';
  }

  const result = simulation.result?.retval.value() as xdr.ScMapEntry[];
  const collateral = parsei128(result[0]?.val().value() as xdr.Int128Parts);
  const liabilities = parsei128(result[1]?.val().value() as xdr.Int128Parts);
  const receivables = parsei128(result[2]?.val().value() as xdr.Int128Parts);
  return { receivables, liabilities, collateral };
};

const createBalanceRecord = (balances: Balance[]): BalanceRecord =>
  balances.reduce((acc, balance) => {
    if (balance.asset_type === 'native') {
      acc.XLM = balance;
    } else if (balance.asset_type === 'credit_alphanum4' && balance.asset_code === 'USDC') {
      acc.USDC = balance;
    }
    return acc;
  }, {} as BalanceRecord);

export const parsei128 = (raw: xdr.Int128Parts): bigint => (raw.hi().toBigInt() << BigInt(64)) + raw.lo().toBigInt();

const fetchAllPrices = async (): Promise<PriceRecord> => {
  const XLM = await fetchPriceData('XLM');
  const wBTC = await fetchPriceData('BTC');
  const wETH = await fetchPriceData('ETH');
  const USDC = await fetchPriceData('USDC');
  const EURC = await fetchPriceData('EURC');
  return { XLM, wBTC, wETH, USDC, EURC };
};

const fetchPriceData = async (token: string): Promise<bigint> => {
  try {
    const { simulation } = await loanManagerClient.get_price({ token });

    if (!simulation || !RpcApi.isSimulationSuccess(simulation)) {
      throw 'get_price simulation was unsuccessful.';
    }

    // TODO: why do we need to cast here? The type should infer properly.
    const value = simulation.result?.retval.value() as xdr.Int128Parts;

    return parsei128(value);
  } catch (error) {
    console.error('Error fetching price data:', error);
    return 0n;
  }
};

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [address, setAddress] = useState<string | null>(null);
  const [walletBalances, setWalletBalances] = useState<BalanceRecord>({});
  const [positions, setPositions] = useState<PositionsRecord>({});
  const [prices, setPrices] = useState<PriceRecord | null>(null);

  const setWallet = async (address: string) => {
    setAddress(address);
    const { balances } = await HorizonServer.loadAccount(address);
    setWalletBalances(createBalanceRecord(balances));
    setPositions(await fetchAllPositions(address));
  };

  // Set initial wallet on load.
  // biome-ignore lint: useEffect is ass
  useEffect(() => {
    kit
      .getAddress()
      .then(({ address }) => setWallet(address))
      .catch((err) => console.log('No initial wallet.', err));
    fetchAllPrices()
      .then((res) => setPrices(res))
      .catch((err) => console.error('Error fetching prices', err));
  }, []);

  const signTransaction: SignTransaction = async (tx, opts) => {
    const { signedTxXdr } = await kit.signTransaction(tx, opts);
    return signedTxXdr;
  };

  const createConnectWalletButton = (container: HTMLElement) => {
    kit.createButton({
      container,
      onConnect: ({ address }) => setWallet(address),
      onDisconnect: () => {
        setAddress(null);
        setWalletBalances({});
      },
    });
  };

  const refetchBalances = async () => {
    if (!address) return;

    try {
      const { balances } = await HorizonServer.loadAccount(address);
      setWalletBalances(createBalanceRecord(balances));
    } catch (err) {
      console.error('Error fetching balances', err);
    }
  };

  const wallet: Wallet | null = address ? createWalletObj(address) : null;

  return (
    <Context.Provider
      value={{
        wallet,
        walletBalances,
        positions,
        prices,
        createConnectWalletButton,
        refetchBalances,
        signTransaction,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useWallet = (): WalletContext => useContext(Context);
