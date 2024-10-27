import type { CurrencyBinding } from 'src/currency-bindings';
import { useWallet } from 'src/stellar-wallet';
import { BorrowStep } from './BorrowStep';
import { TrustLineStep } from './TrustlineStep';

export interface BorrowModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
  totalSupplied: bigint;
}

export const BorrowModal = ({ modalId, onClose, currency, totalSupplied }: BorrowModalProps) => {
  const { name, ticker } = currency;
  const { wallet, walletBalances, signTransaction, refetchBalances, prices } = useWallet();

  const closeModal = () => {
    refetchBalances();
    onClose();
  };

  // Modal is impossible to open before the wallet is loaded.
  if (!wallet || !walletBalances || !prices) return null;

  const isTrustline = walletBalances[ticker].trustLine;

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[700px] p-10">
        <h3 className="font-bold text-xl mb-4">Borrow {name}</h3>
        {!isTrustline ? (
          <TrustLineStep
            onClose={closeModal}
            currency={currency}
            wallet={wallet}
            signTransaction={signTransaction}
            refetchBalances={refetchBalances}
          />
        ) : (
          <BorrowStep
            onClose={closeModal}
            currency={currency}
            totalSupplied={totalSupplied}
            wallet={wallet}
            walletBalances={walletBalances}
            prices={prices}
          />
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
