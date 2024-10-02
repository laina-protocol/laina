import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { getIntegerPart, to7decimals } from '@lib/converters';
import { type ChangeEvent, useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';
import { useWallet } from 'src/stellar-wallet';

export interface BorrowModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
  collateral: CurrencyBinding;
  totalSupplied: bigint;
}

export const BorrowModal = ({ modalId, onClose, currency, collateral, totalSupplied }: BorrowModalProps) => {
  const { name, ticker, contractId: loanCurrencyId } = currency;
  const { wallet, walletBalances, signTransaction, refetchBalances, prices } = useWallet();

  const [isBorrowing, setIsBorrowing] = useState(false);
  const [loanAmount, setLoanAmount] = useState<string>('0');
  const [collateralAmount, setCollateralAmount] = useState<string>('0');

  const collateralBalance = walletBalances[collateral.ticker];

  const loanPrice = prices?.[ticker];
  const collateralPrice = prices?.[collateral.ticker];

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
    if (!loanAmount || !collateralAmount) {
      alert('Empty loan amount or collateral!');
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

  const maxLoan = (totalSupplied / 10_000_000n).toString();

  const maxCollateral = getIntegerPart(collateralBalance.balance);

  const handleSelectMaxLoan = () => setLoanAmount(maxLoan);

  const handleSelectMaxCollateral = () => setCollateralAmount(maxCollateral);

  // TODO: get this from the contract.
  const interestRate = '7.5%';

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[700px] p-10">
        <h3 className="font-bold text-xl mb-4">Borrow {name}</h3>
        <p className="my-4">
          Borrow {name} using another asset as a collateral. The value of the collateral must exceed the value of the
          borrowed asset.
        </p>
        <p className="my-4">
          The higher the value of the collateral is to the value of the borrowed asset, the safer this loan is. This is
          visualised by the health factor.
        </p>
        <p className="my-4">
          The loan will be available for liquidation if the value of the borrowed asset raises to the value of the
          collateral, causing you to lose some of your collateral.
        </p>
        <p className="my-4">The interest rate changes as the amount of assets borrowed from the pools changes.</p>
        <p className="my-4">The annual interest rate is currently {interestRate}.</p>

        <p className="font-bold mb-2 mt-6">Amount to borrow</p>
        <CryptoAmountSelector
          max={maxLoan}
          value={loanAmount}
          ticker={ticker}
          price={loanPrice}
          onChange={handleLoanAmountChange}
          onSelectMaximum={handleSelectMaxLoan}
        />

        <p className="font-bold mb-2 mt-4">Amount of collateral</p>
        <CryptoAmountSelector
          max={maxCollateral}
          value={collateralAmount}
          ticker={collateral.ticker}
          price={collateralPrice}
          onChange={handleCollateralAmountChange}
          onSelectMaximum={handleSelectMaxCollateral}
        />

        <div className="flex flex-row justify-end mt-8">
          <Button onClick={closeModal} variant="ghost" className="mr-4">
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
