import { type ChangeEvent, useState } from 'react';

import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Dialog, ErrorDialogContent, LoadingDialogContent, SuccessDialogContent } from '@components/Dialog';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { getIntegerPart, to7decimals } from '@lib/converters';
import { SCALAR_7, toCents } from '@lib/formatting';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface DepositModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding | null;
}

export const DepositModal = ({ modalId, onClose, currency }: DepositModalProps) => {
  const { sendTransaction, isDepositing, isDepositSuccess, depositError, resetState } = useDepositTransaction(currency);
  const { walletBalances, refetchBalances } = useWallet();
  const { prices } = usePools();
  const [amount, setAmount] = useState('0');

  if (!currency) {
    // Return an empty dialog if no currency set to make displaying the modal still work.
    return <Dialog modalId={modalId} onClose={onClose} />;
  }

  const { name, ticker } = currency;

  const balance = walletBalances?.[ticker];
  const price = prices?.[ticker];

  const amountCents = price ? toCents(price, BigInt(amount) * SCALAR_7) : undefined;

  if (!balance || !balance.trustLine) return null;

  const max = getIntegerPart(balance.balanceLine.balance);

  const closeModal = () => {
    refetchBalances();
    setAmount('0');
    resetState();
    onClose();
  };

  const handleDepositClick = () => {
    sendTransaction(amount);
  };

  const handleAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setAmount(ev.target.value);
  };

  const handleSelectMaxLoan = () => {
    setAmount(max);
  };

  if (isDepositing) {
    return (
      <Dialog
        modalId={modalId}
        onClose={() => {
          /* Disallow closing */
        }}
      >
        <LoadingDialogContent title="Depositing" subtitle={`Depositing ${amount} ${ticker}.`} onClick={closeModal} />
      </Dialog>
    );
  }

  if (isDepositSuccess) {
    return (
      <Dialog modalId={modalId} onClose={closeModal}>
        <SuccessDialogContent subtitle={`Successfully deposited ${amount} ${ticker}.`} onClick={closeModal} />
      </Dialog>
    );
  }

  if (depositError) {
    return (
      <Dialog modalId={modalId} onClose={closeModal}>
        <ErrorDialogContent error={depositError} onClick={closeModal} />
      </Dialog>
    );
  }

  return (
    <Dialog className="md:w-[700px]" modalId={modalId} onClose={closeModal}>
      <h3 className="font-bold text-xl mb-8">Deposit {name}</h3>
      <p className="text-lg mb-2">Amount to deposit</p>
      <CryptoAmountSelector
        max={max}
        value={amount}
        valueCents={amountCents}
        ticker={ticker}
        onChange={handleAmountChange}
        onSelectMaximum={handleSelectMaxLoan}
      />

      <div className="flex flex-row justify-end mt-8">
        <Button onClick={closeModal} variant="ghost" className="mr-4">
          Cancel
        </Button>
        {!isDepositing ? (
          <Button disabled={amount === '0'} onClick={handleDepositClick}>
            Deposit
          </Button>
        ) : (
          <Button disabled>
            <Loading />
            Depositing
          </Button>
        )}
      </div>
    </Dialog>
  );
};

const useDepositTransaction = (currency: CurrencyBinding | null) => {
  const { wallet, signTransaction } = useWallet();
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState<Error | null>(null);

  const resetState = () => {
    setIsDepositing(false);
    setIsDepositSuccess(false);
    setDepositError(null);
  };

  const sendTransaction = async (amount: string) => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }
    if (!currency) {
      alert('No currrency selected');
      return;
    }

    setIsDepositing(true);

    const tx = await currency.contractClient.deposit({
      user: wallet.address,
      amount: to7decimals(amount),
    });

    try {
      await tx.signAndSend({ signTransaction });

      setIsDepositSuccess(true);
      setDepositError(null);
    } catch (err) {
      setDepositError(err as Error);
      setIsDepositSuccess(false);
    }
    setIsDepositing(false);
  };

  return { isDepositing, isDepositSuccess, depositError, sendTransaction, resetState };
};
