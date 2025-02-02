import { type ChangeEvent, useState } from 'react';
import { FaCircleCheck as CheckMarkIcon, FaCircleXmark as XMarkIcon } from 'react-icons/fa6';

import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import Dialog from '@components/Dialog';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { getIntegerPart, to7decimals } from '@lib/converters';
import { SCALAR_7, toCents } from '@lib/formatting';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface DepositModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
}

export const DepositModal = ({ modalId, onClose, currency }: DepositModalProps) => {
  const { name, ticker } = currency;

  const { sendTransaction, isDepositing, isDepositSuccess, depositError, resetState } = useDepositTransaction(currency);
  const { walletBalances, refetchBalances } = useWallet();
  const { prices } = usePools();
  const [amount, setAmount] = useState('0');

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
        className="w-96 items-center"
        modalId={modalId}
        onClose={() => {
          /* Disallow closing */
        }}
      >
        <Loading size="lg" className="mb-4" />
        <h3 className="font-bold text-xl mb-4">Depositing</h3>
        <p className="text-lg mb-8">
          Depositing {amount} {ticker}.
        </p>
        <Button disabled={true}>Close</Button>
      </Dialog>
    );
  }

  if (isDepositSuccess) {
    return (
      <Dialog className="w-96 items-center" modalId={modalId} onClose={closeModal}>
        <CheckMarkIcon className="text-green mb-4" size="2rem" />
        <h3 className="font-bold text-xl mb-4 ">Success</h3>
        <p className="text-lg mb-8">
          Succesfully deposited {amount} {ticker}.
        </p>
        <Button onClick={closeModal}>Close</Button>
      </Dialog>
    );
  }

  if (depositError) {
    return (
      <Dialog className="min-w-96 items-center" modalId={modalId} onClose={closeModal}>
        <XMarkIcon className="text-red mb-4" size="2rem" />
        <h3 className="font-bold text-xl mb-4 ">Error</h3>
        <p className="text-lg mb-8">{depositError.message}</p>
        <Button className="ml-auto" onClick={closeModal}>
          Close
        </Button>
      </Dialog>
    );
  }

  return (
    <Dialog className="min-w-160" modalId={modalId} onClose={closeModal}>
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

const useDepositTransaction = ({ contractClient }: CurrencyBinding) => {
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

    setIsDepositing(true);

    const tx = await contractClient.deposit({
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
