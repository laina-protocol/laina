import { Dialog } from '@components/Dialog';
import type { Loan } from '@contexts/loan-context';
import { isNil } from 'ramda';
import { useState } from 'react';
import LoansView from './LoansView';
import RepayView from './RepayView';

export interface LoansModalProps {
  modalId: string;
  onClose: () => void;
}

const LoansModal = ({ modalId, onClose }: LoansModalProps) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const handleBackClicked = () => setSelectedLoan(null);

  const handleClose = () => {
    setSelectedLoan(null);
    onClose();
  };

  const handleRepayClicked = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  return (
    <Dialog modalId={modalId} onClose={handleClose} className="min-w-96">
      {isNil(selectedLoan) ? (
        <LoansView onClose={handleClose} onRepay={handleRepayClicked} />
      ) : (
        <RepayView loan={selectedLoan} onBack={handleBackClicked} />
      )}
    </Dialog>
  );
};

export default LoansModal;
