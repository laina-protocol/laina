import { useWallet } from '@contexts/wallet-context';
import type { CurrencyBinding } from 'src/currency-bindings';
import { BorrowStep } from './BorrowStep';
import { TrustLineStep } from './TrustlineStep';

export interface BorrowModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
}

export const BorrowModal = ({ modalId, onClose, currency }: BorrowModalProps) => {
  const { name, ticker } = currency;
  const { walletBalances, refetchBalances } = useWallet();

  const closeModal = () => {
    refetchBalances();
    onClose();
  };

  const isTrustline = walletBalances?.[ticker].trustLine;

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[700px] p-10">
        <h3 className="font-bold text-xl mb-4">Borrow {name}</h3>
        {!isTrustline ? (
          <TrustLineStep onClose={closeModal} currency={currency} />
        ) : (
          <BorrowStep onClose={closeModal} currency={currency} />
        )}
      </div>
      {/* Invisible backdrop that closes the modal on click */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={closeModal} type="button">
          close
        </button>
      </form>
    </dialog>
  );
};
