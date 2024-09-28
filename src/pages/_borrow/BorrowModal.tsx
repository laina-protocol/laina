import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { type ChangeEvent, useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';
import { to7decimals } from 'src/lib/converters';
import { useWallet } from 'src/stellar-wallet';

export interface BorrowModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
  collateral: CurrencyBinding;
}

// TODO: calculate this from the amount of funds in the pool.
const MAX_LOAN = 10000;

export const BorrowModal = ({ modalId, onClose, currency, collateral }: BorrowModalProps) => {
  const { name, ticker, contractId: loanCurrencyId } = currency;
  const { wallet, walletBalances, signTransaction, refetchBalances } = useWallet();

  const [isBorrowing, setIsBorrowing] = useState(false);
  const [loanAmount, setLoanAmount] = useState('0');
  const [collateralAmount, setCollateralAmount] = useState('0');

  const collateralBalance = walletBalances[collateral.ticker];

  // The modal is impossible to open without collateral balance.
  if (!collateralBalance) return null;

  const closeModal = () => {
    refetchBalances();
    setLoanAmount('0');
    setCollateralAmount('0');
    onClose();
  };

  const handleBorrowClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsBorrowing(true);

    try {
      loanManagerClient.options.publicKey = wallet.address;

      const tx = await loanManagerClient.create_loan({
        user: wallet.address,
        borrowed: to7decimals(loanAmount),
        borrowed_from: loanCurrencyId,
        collateral: to7decimals(collateralAmount),
        collateral_from: collateral.contractId,
      });
      await tx.signAndSend({ signTransaction });
      alert('Loan created succesfully!');
      closeModal();
    } catch (err) {
      console.error('Error borrowing', err);
      alert('Error borrowing');
    }

    setIsBorrowing(false);
  };

  const handleLoanAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setLoanAmount(ev.target.value);
  };

  const handleCollateralAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setCollateralAmount(ev.target.value);
  };

  const isBorrowDisabled = loanAmount === '0' || collateralAmount === '0';

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-8">Borrow {name}</h3>

        <p className="text-lg mb-2">Amount to borrow</p>
        <input
          type="range"
          min={0}
          max={MAX_LOAN}
          value={loanAmount}
          className="range"
          onChange={handleLoanAmountChange}
        />
        <div className="flex w-full justify-between px-2 text-xs">
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
        </div>
        <p>
          {loanAmount} {ticker} out of {MAX_LOAN} {ticker}
        </p>

        <p className="text-lg mb-2 mt-4">Amount of collateral</p>
        <input
          type="range"
          min={0}
          max={collateralBalance.balance}
          value={collateralAmount}
          className="range"
          onChange={handleCollateralAmountChange}
        />
        <div className="flex w-full justify-between px-2 text-xs">
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
        </div>
        <p>
          {collateralAmount} {collateral.ticker} out of {collateralBalance.balance} {collateral.ticker}
        </p>

        <div className="flex flex-row justify-end mt-8">
          <Button onClick={closeModal} className="btn-ghost mr-4">
            Cancel
          </Button>
          {!isBorrowing ? (
            <Button disabled={isBorrowDisabled} onClick={handleBorrowClick}>
              Borrow
            </Button>
          ) : (
            <Button disabled>
              <Loading />
              Borrowing
            </Button>
          )}
        </div>
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
