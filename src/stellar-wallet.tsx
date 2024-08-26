import { FREIGHTER_ID, StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import { type PropsWithChildren, createContext, useContext, useState } from 'react';

export type Wallet = {
  address: string;
  displayName: string;
};

export type WalletContext = {
  wallet: Wallet | null;
  openConnectWalletModal: () => void;
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
  openConnectWalletModal: () => {},
  wallet: null,
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

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [address, setAddress] = useState<string | null>(null);

  const signTransaction: SignTransaction = async (tx, opts) => {
    const { signedTxXdr } = await kit.signTransaction(tx, opts);
    return signedTxXdr;
  };

  const openConnectWalletModal = () => {
    kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
        try {
          const { address } = await kit.getAddress();
          setAddress(address);
        } catch (err) {
          console.error('Error connecting wallet: ', err);
        }
      },
    });
  };

  const wallet: Wallet | null = address ? createWalletObj(address) : null;

  return (
    <Context.Provider
      value={{
        wallet,
        openConnectWalletModal,
        signTransaction,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useWallet = (): WalletContext => useContext(Context);
