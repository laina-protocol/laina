import { useState } from 'react';
import { FaCircleCheck as CheckMarkIcon, FaCircleXmark as XMarkIcon } from 'react-icons/fa6';

import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { useWallet } from '@contexts/wallet-context';
import { createAddTrustlineTransaction, sendTransaction } from '@lib/horizon';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface TrustLineStepProps {
  modalId: string;
  onClose: () => void;
  onTrustlineAdded: () => void;
  currency: CurrencyBinding;
}

export const TrustLineStep = ({ modalId, onClose, onTrustlineAdded, currency }: TrustLineStepProps) => {
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
    return (
      <div className="flex flex-col items-center w-96">
        <Loading size="lg" className="mb-4" />
        <h3 className="text-xl font-bold mb-8">Creating a trustline for {ticker}.</h3>
        <Button disabled={true}>Close</Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-96 flex flex-col items-center">
        <CheckMarkIcon className="text-green mb-4" size="2rem" />
        <h3 className="text-xl font-bold mb-4">Success</h3>
        <p className="text-lg mb-8">Succesfully added a trustline for {ticker}.</p>
        <Button onClick={handleContinueClicked}>Continue</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-96 flex flex-col items-center">
        <XMarkIcon className="text-red mb-4" size="2rem" />
        <h3 className="text-xl font-bold mb-4">Error</h3>
        <p className="text-lg mb-8">{error.message}</p>
        <Button onClick={closeModal}>Close</Button>
      </div>
    );
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
