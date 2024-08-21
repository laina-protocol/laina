import { FREIGHTER_ID, StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import { type PropsWithChildren, createContext, useContext, useState } from 'react';

export type Wallet = {
  address: string;
  displayName: string;
};

export type WalletContext = {
  openConnectWalletModal: () => void;
  wallet: Wallet | null;
};

const Context = createContext<WalletContext>({
  openConnectWalletModal: () => { },
  wallet: null,
});

const kit: StellarWalletsKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

const initialWallet: Wallet | null = await kit
  .getAddress()
  .then(({ address }) => ({
    address,
    displayName: formatDisplayName(address),
  }))
  .catch(() => null);

const formatDisplayName = (address: string): string => `${address.slice(0, 4)}...${address.slice(-4)}`;

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [wallet, setWallet] = useState(initialWallet);

  const openConnectWalletModal = () => {
    kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
        try {
          const { address } = await kit.getAddress();
          setWallet({
            address,
            displayName: formatDisplayName(address),
          });
        } catch (err) {
          console.error('Error connecting wallet: ', err);
        }
      },
    });
  };

  return <Context.Provider value={{ openConnectWalletModal, wallet }}>{children}</Context.Provider>;
};

export const useWallet = (): WalletContext => useContext(Context);
