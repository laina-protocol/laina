import { Dialog } from '@components/Dialog';
import { useWallet } from '@contexts/wallet-context';
import { useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';
import { BorrowStep } from './BorrowStep';
import { TrustLineStep } from './TrustlineStep';

export interface BorrowModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
}

export const BorrowModal = ({ modalId, onClose, currency }: BorrowModalProps) => {
  const { ticker } = currency;
  const { walletBalances, refetchBalances } = useWallet();

  const [isTrustline, setIsTrustline] = useState<boolean>(walletBalances?.[ticker].trustLine || false);

  const closeModal = () => {
    refetchBalances();
    onClose();
  };

  const handleTrustlineAdded = () => {
    setIsTrustline(true);
  };

  return (
    <Dialog modalId={modalId} onClose={closeModal}>
      {isTrustline ? (
        <BorrowStep onClose={closeModal} currency={currency} />
      ) : (
        <TrustLineStep onClose={closeModal} currency={currency} onTrustlineAdded={handleTrustlineAdded} />
      )}
    </Dialog>
  );
};
