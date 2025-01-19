import { Success } from '@components/Alert';
import { CircleButton } from '@components/Button';
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

type RepayAlert = {
  kind: 'success';
  ticker: SupportedCurrency;
  amount: string;
};

const LoansModal = ({ modalId, onClose }: LoansModalProps) => {
  const [tickerToRepay, setTickerToRepay] = useState<SupportedCurrency | null>(null);
  const [alert, setAlert] = useState<RepayAlert | null>(null);

  const handleBackClicked = () => setTickerToRepay(null);

  const handleClose = () => {
    setTickerToRepay(null);
    setAlert(null);
    onClose();
  };

  const handleRepaySuccess = (ticker: SupportedCurrency, amount: string) => {
    setTickerToRepay(null);
    setAlert({ kind: 'success', ticker, amount });
  };

  const handleAlertClose = () => setAlert(null);

  const handleRepayClicked = (ticker: SupportedCurrency) => {
    setAlert(null);
    setTickerToRepay(ticker);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[800px] flex flex-col">
        {alert ? <RepaySuccessAlert onClose={handleAlertClose} ticker={alert.ticker} amount={alert.amount} /> : null}
        {isNil(tickerToRepay) ? (
          <LoansView onClose={handleClose} onRepay={handleRepayClicked} />
        ) : (
          <RepayView ticker={tickerToRepay} onBack={handleBackClicked} onSuccess={handleRepaySuccess} />
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
      Successfully Repaid {amount} {ticker}
    </span>
    <CircleButton onClick={onClose} variant="ghost-dark">
      <CloseIcon size="1.4rem" />
    </CircleButton>
  </Success>
);

export default LoansModal;
