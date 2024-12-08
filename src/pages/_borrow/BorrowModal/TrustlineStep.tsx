import { useState } from 'react';

import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { useWallet } from '@contexts/wallet-context';
import { createAddTrustlineTransaction, sendTransaction } from '@lib/horizon';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface TrustLineStepProps {
  onClose: () => void;
  currency: CurrencyBinding;
}

export const TrustLineStep = ({ onClose, currency }: TrustLineStepProps) => {
  const { name, ticker } = currency;
  const { wallet, signTransaction, refetchBalances } = useWallet();

  const [isCreating, setIsCreating] = useState(false);

  // Modal is impossible to open without a wallet connection.
  if (!wallet) return null;

  const handleAddTrustlineClick = async () => {
    try {
      setIsCreating(true);
      const tx = await createAddTrustlineTransaction(wallet.address, currency);
      const { signedTxXdr } = await signTransaction(tx.toXDR());
      await sendTransaction(signedTxXdr);
      alert(`Succesfully created a trustline for ${ticker}!`);
    } catch (err) {
      alert('Error creating a trustline :(');
      console.error('Error creating trustline:', err);
    }
    refetchBalances();
    setIsCreating(false);
  };

  return (
    <>
      <p>
        You don't have a trustline for {name} in your wallet. Laina cannot transfer you the tokens without a trustline.
      </p>
      <div className="flex flex-row justify-end mt-8">
        <Button onClick={onClose} variant="ghost" className="mr-4">
          Cancel
        </Button>
        {!isCreating ? (
          <Button onClick={handleAddTrustlineClick}>Create Trustline</Button>
        ) : (
          <Button disabled>
            <Loading />
            Creating
          </Button>
        )}
      </div>
    </>
  );
};
