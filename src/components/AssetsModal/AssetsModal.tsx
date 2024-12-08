import { Success } from '@components/Alert';
import { CircleButton } from '@components/Button';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { useState } from 'react';
import { IoClose as CloseIcon } from 'react-icons/io5';
import PositionsView from './PositionsView';
import WithdrawView from './WithdrawView';

export type AssetsModalProps = {
  modalId: string;
  onClose: () => void;
};

type WithdrawAlert = {
  kind: 'success';
  ticker: SupportedCurrency;
  amount: string;
};

const AssetsModal = ({ modalId, onClose }: AssetsModalProps) => {
  const [tickerToWithdraw, setTickerToWithdraw] = useState<SupportedCurrency | null>(null);
  const [alert, setAlert] = useState<WithdrawAlert | null>({ ticker: 'XLM', amount: '20', kind: 'success' });

  const handleBackClicked = () => setTickerToWithdraw(null);

  const handleClose = () => {
    setTickerToWithdraw(null);
    setAlert(null);
    onClose();
  };

  const handleWithdrawSuccess = (ticker: SupportedCurrency, amount: string) => {
    setTickerToWithdraw(null);
    setAlert({ kind: 'success', ticker, amount });
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleWithdraw = (ticker: SupportedCurrency) => {
    setAlert(null);
    setTickerToWithdraw(ticker);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[800px] p-10 flex flex-col">
        {alert ? <WithdrawSuccessAlert onClose={handleAlertClose} ticker={alert.ticker} amount={alert.amount} /> : null}
        {isNil(tickerToWithdraw) ? (
          <PositionsView onClose={handleClose} onWithdraw={handleWithdraw} />
        ) : (
          <WithdrawView ticker={tickerToWithdraw} onBack={handleBackClicked} onSuccess={handleWithdrawSuccess} />
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

type WithdrawSuccessAlertProps = {
  ticker: SupportedCurrency;
  amount: string;
  onClose: () => void;
};

const WithdrawSuccessAlert = ({ ticker, amount, onClose }: WithdrawSuccessAlertProps) => (
  <Success className="mb-8">
    <span>
      Successfully withdrew {amount} {ticker}
    </span>
    <CircleButton onClick={onClose} variant="ghost-dark">
      <CloseIcon size="1.4rem" />
    </CircleButton>
  </Success>
);

export default AssetsModal;
