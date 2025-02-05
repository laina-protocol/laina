import { Dialog } from '@components/Dialog';
import { useWallet } from '@contexts/wallet-context';
import { useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';
import { BorrowStep } from './BorrowStep';
import { TrustLineStep } from './TrustlineStep';

export interface BorrowModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding | null;
}

export const BorrowModal = ({ modalId, onClose, currency }: BorrowModalProps) => {
  const { walletBalances, refetchBalances } = useWallet();

  if (!currency) {
    // Return an empty dialog if no currency set to make displaying the modal still work.
    return <Dialog modalId={modalId} onClose={onClose} />;
  }

  const { ticker } = currency;
  const isTrustline = walletBalances?.[ticker].trustLine;
  // state to keep the user in the trustline step until they click ok.
  const [isSettingTrustline, setIsSettingTrustline] = useState(false);

  const closeModal = () => {
    refetchBalances();
    onClose();
  };

  const handleAddTrustline = () => {
    setIsSettingTrustline(true);
  };

  const handleTrustlineAdded = () => {
    setIsSettingTrustline(false);
  };

  return (
    <Dialog modalId={modalId} onClose={closeModal}>
      {!isTrustline || isSettingTrustline ? (
        <TrustLineStep
          onClose={closeModal}
          currency={currency}
          onAddTrustline={handleAddTrustline}
          onTrustlineAdded={handleTrustlineAdded}
        />
      ) : (
        <BorrowStep onClose={closeModal} currency={currency} />
      )}
    </Dialog>
  );
};
