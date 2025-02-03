import { useState } from 'react';

import { Button } from '@components/Button';
import { ErrorDialogContent, LoadingDialogContent, SuccessDialogContent } from '@components/Dialog';
import { Loading } from '@components/Loading';
import { useWallet } from '@contexts/wallet-context';
import { createAddTrustlineTransaction, sendTransaction } from '@lib/horizon';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface TrustLineStepProps {
  onClose: VoidFunction;
  onAddTrustline: VoidFunction;
  onTrustlineAdded: VoidFunction;
  currency: CurrencyBinding;
}

export const TrustLineStep = ({ onClose, onAddTrustline, onTrustlineAdded, currency }: TrustLineStepProps) => {
  const { ticker } = currency;
  const { wallet, signTransaction, refetchBalances } = useWallet();

  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSucces] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleContinueClicked = () => {
    setIsCreating(false);
    setIsSucces(false);
    setError(null);
    onTrustlineAdded();
  };

  const closeModal = () => {
    setIsCreating(false);
    setIsSucces(false);
    setError(null);
    onClose();
  };

  // Modal is impossible to open without a wallet connection.
  if (!wallet) return null;

  const handleAddTrustlineClick = async () => {
    onAddTrustline();
    try {
      setIsCreating(true);
      const tx = await createAddTrustlineTransaction(wallet.address, currency);
      const { signedTxXdr } = await signTransaction(tx.toXDR());
      await sendTransaction(signedTxXdr);
      setIsSucces(true);
      setError(null);
    } catch (err) {
      console.error('Error creating trustline:', err);
      setError(err as Error);
    }
    refetchBalances();
    setIsCreating(false);
  };

  if (isCreating) {
    return <LoadingDialogContent title={`Creating a trustline for ${ticker}`} onClick={closeModal} />;
  }

  if (isSuccess) {
    return (
      <SuccessDialogContent
        subtitle={`Succesfully added a trustline for ${ticker}`}
        onClick={handleContinueClicked}
        buttonText="Continue"
      />
    );
  }

  if (error) {
    return <ErrorDialogContent error={error} onClick={closeModal} />;
  }

  return (
    <div className="w-96">
      <h3 className="font-bold text-xl mb-4">Add a trustline</h3>
      <p>
        You don't have a trustline for {ticker} in your wallet. Laina cannot transfer you the tokens without a
        trustline.
      </p>
      <div className="flex flex-row justify-end mt-8">
        <Button onClick={closeModal} variant="ghost" className="mr-4">
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
    </div>
  );
};
