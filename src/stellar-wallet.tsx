import { FREIGHTER_ID, StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

export type Wallet = {
  address: string;
  displayName: string;
};

export type WalletContext = {
  wallet: Wallet | null;
  openConnectWalletModal: () => void;
  signTransaction: SignTransaction;
  kit: StellarWalletsKit | undefined;
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
  openConnectWalletModal: () => {},
  signTransaction: () => Promise.reject(),
  kit: undefined,
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

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    kit.getAddress().then(({ address }) => setWallet(createWalletObj(address)));
  });

  const openConnectWalletModal = () => {
    kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
        try {
          const { address } = await kit.getAddress();
          setWallet(createWalletObj(address));
        } catch (err) {
          console.error('Error connecting wallet: ', err);
        }
      },
    });
  };

  const signTransaction: SignTransaction = async (tx, opts) => {
    const { signedTxXdr } = await kit.signTransaction(tx, opts);
    return signedTxXdr;
  };

  return (
    <Context.Provider
      value={{
        wallet,
        openConnectWalletModal,
        signTransaction,
        kit,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useWallet = (): WalletContext => useContext(Context);
