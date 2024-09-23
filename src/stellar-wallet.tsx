import { FREIGHTER_ID, StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import * as StellarSdk from '@stellar/stellar-sdk';
import type { SupportedCurrency } from 'currencies';
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

const HorizonServer = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org/');

export type Wallet = {
  address: string;
  displayName: string;
};

export type Balance = StellarSdk.Horizon.HorizonApi.BalanceLine;

export type BalanceRecord = {
  [K in SupportedCurrency]?: Balance;
};

export type WalletContext = {
  wallet: Wallet | null;
  balances: BalanceRecord;
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
  balances: {},
  // openConnectWalletModal: () => { },
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

const createBalanceRecord = (balances: Balance[]): BalanceRecord =>
  balances.reduce((acc, balance) => {
    if (balance.asset_type === 'native') {
      acc.XLM = balance;
    } else if (balance.asset_type === 'credit_alphanum4' && balance.asset_code === 'USDC') {
      acc.USDC = balance;
    }
    return acc;
  }, {} as BalanceRecord);

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<BalanceRecord>({});

  const setWallet = async (address: string) => {
    setAddress(address);
    try {
      const { balances } = await HorizonServer.loadAccount(address);
      setBalances(createBalanceRecord(balances));
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  };

  // Set initial wallet on load.
  // biome-ignore lint: useEffect is ass
  useEffect(() => {
    kit
      .getAddress()
      .then(({ address }) => setWallet(address))
      .catch((err) => console.log('No initial wallet.', err));
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
        setBalances({});
      },
    });
  };

  const refetchBalances = async () => {
    if (!address) return;

    const { balances } = await HorizonServer.loadAccount(address);
    setBalances(createBalanceRecord(balances));
  };

  const wallet: Wallet | null = address ? createWalletObj(address) : null;

  return (
    <Context.Provider
      value={{
        wallet,
        balances,
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
