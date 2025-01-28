import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { getIntegerPart, to7decimals } from '@lib/converters';
import { SCALAR_7, toCents } from '@lib/formatting';
import { type ChangeEvent, type PropsWithChildren, useEffect, useState } from 'react';
import { FaCircleCheck as CheckMarkIcon } from 'react-icons/fa6';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface DepositModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
}

export const DepositModal = ({ modalId, onClose, currency }: DepositModalProps) => {
  const { name, ticker } = currency;

  const { sendTransaction, isDepositing, isDepositSuccess, depositError } = useDepositTransaction(currency);
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
      <Dialog modalId={modalId} onClose={() => {}}>
        <h3 className="font-bold text-xl mb-8">Deposit {name}</h3>
        <div className="flex flex-grow flex-col items-center justify-center">
          <Loading size="lg" className="mb-4" />
          <p className="text-lg">Depositing...</p>
        </div>
      </Dialog>
    );
  }

  if (isDepositSuccess) {
    <Dialog modalId={modalId} onClose={closeModal}>
      <CheckMarkIcon />
      Succesfully deposited {amount} {ticker}
    </Dialog>;
  }

  if (depositError) {
    return (
      <Dialog modalId={modalId} onClose={closeModal}>
        Vituix män
      </Dialog>
    );
  }

  return (
    <Dialog modalId={modalId} onClose={closeModal}>
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
  useEffect(() => {
    console.log('mounted');
    return () => console.log('unmounted');
  }, []);
  const { wallet, signTransaction } = useWallet();
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState<any>(null);

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
      setDepositError(err);
      setIsDepositSuccess(false);
    }
    setIsDepositing(false);
  };

  return { isDepositing, isDepositSuccess, depositError, sendTransaction };
};

interface DialogProps {
  modalId: string;
  onClose: VoidFunction;
}

const Dialog = ({ modalId, onClose, children }: PropsWithChildren<DialogProps>) => (
  <dialog id={modalId} className="modal">
    <div className="modal-box p-10 min-w-160 min-h-72 flex flex-col">{children}</div>
    {/* Invisible backdrop that closes the modal on click */}
    <form method="dialog" className="modal-backdrop">
      <button onClick={onClose} type="button">
        close
      </button>
    </form>
  </dialog>
);
