import { Success } from '@components/Alert';
import { CircleButton } from '@components/Button';
import type { Loan } from '@contexts/loan-context';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { useState } from 'react';
import { IoClose as CloseIcon } from 'react-icons/io5';
import LoansView from './LoansView';
import RepayView from './RepayView';

export interface LoansModalProps {
  modalId: string;
  onClose: () => void;
}

type RepayAlert =
  | {
      kind: 'success';
      ticker: SupportedCurrency;
      amount: string;
    }
  | {
      kind: 'full-success';
      ticker: SupportedCurrency;
    };

const LoansModal = ({ modalId, onClose }: LoansModalProps) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [alert, setAlert] = useState<RepayAlert | null>(null);

  const handleBackClicked = () => setSelectedLoan(null);

  const handleClose = () => {
    setSelectedLoan(null);
    setAlert(null);
    onClose();
  };

  const handleRepaySuccess = (ticker: SupportedCurrency, amount: string) => {
    setSelectedLoan(null);
    setAlert({ kind: 'success', ticker, amount });
  };

  const handleRepayFullSuccess = (ticker: SupportedCurrency) => {
    setSelectedLoan(null);
    setAlert({ kind: 'full-success', ticker });
  };

  const handleAlertClose = () => setAlert(null);

  const handleRepayClicked = (loan: Loan) => {
    setAlert(null);
    setSelectedLoan(loan);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[800px] flex flex-col">
        {alert && alert.kind === 'success' ? (
          <RepaySuccessAlert onClose={handleAlertClose} ticker={alert.ticker} amount={alert.amount} />
        ) : null}
        {alert && alert.kind === 'full-success' ? (
          <FullRepaySuccessAlert onClose={handleAlertClose} ticker={alert.ticker} />
        ) : null}
        {isNil(selectedLoan) ? (
          <LoansView onClose={handleClose} onRepay={handleRepayClicked} />
        ) : (
          <RepayView
            loan={selectedLoan}
            onBack={handleBackClicked}
            onSuccess={handleRepaySuccess}
            onFullSuccess={handleRepayFullSuccess}
          />
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>
          close
        </button>
      </form>
    </dialog>
  );
};

type RepaySuccessAlertProps = {
  ticker: SupportedCurrency;
  amount: string;
  onClose: () => void;
};

const RepaySuccessAlert = ({ ticker, amount, onClose }: RepaySuccessAlertProps) => (
  <Success className="mb-8">
    <span>
      Successfully repaid {amount} {ticker}
    </span>
    <CircleButton onClick={onClose} variant="ghost-dark">
      <CloseIcon size="1.4rem" />
    </CircleButton>
  </Success>
);

const FullRepaySuccessAlert = ({ ticker, onClose }: { ticker: SupportedCurrency; onClose: VoidFunction }) => (
  <Success className="mb-8">
    <span>Successfully repaid all of the borrowed {ticker}</span>
    <CircleButton onClick={onClose} variant="ghost-dark">
      <CloseIcon size="1.4rem" />
    </CircleButton>
  </Success>
);

export default LoansModal;
