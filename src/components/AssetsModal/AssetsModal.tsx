import { isNil } from 'ramda';
import { useState } from 'react';

import { Dialog } from '@components/Dialog';
import { useWallet } from '@contexts/wallet-context';
import type { SupportedCurrency } from 'currencies';
import PositionsView from './PositionsView';
import WithdrawView from './WithdrawView';

export type AssetsModalProps = {
  modalId: string;
  onClose: () => void;
};

const AssetsModal = ({ modalId, onClose }: AssetsModalProps) => {
  const { refetchBalances } = useWallet();

  const [tickerToWithdraw, setTickerToWithdraw] = useState<SupportedCurrency | null>(null);

  const handleBackClicked = () => {
    refetchBalances();
    setTickerToWithdraw(null);
  };

  const handleClose = () => {
    setTickerToWithdraw(null);
    onClose();
  };

  const handleWithdraw = (ticker: SupportedCurrency) => {
    setTickerToWithdraw(ticker);
  };

  return (
    <Dialog modalId={modalId} onClose={onClose}>
      {isNil(tickerToWithdraw) ? (
        <PositionsView onClose={handleClose} onWithdraw={handleWithdraw} />
      ) : (
        <WithdrawView ticker={tickerToWithdraw} onBack={handleBackClicked} />
      )}
    </Dialog>
  );
};

export default AssetsModal;
