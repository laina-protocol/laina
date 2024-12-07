import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { useWallet } from '@contexts/wallet-context';
import { getIntegerPart, to7decimals } from '@lib/converters';
import { SCALAR_7, toCents } from '@lib/formatting';
import { type ChangeEvent, useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';

export interface DepositModalProps {
  modalId: string;
  onClose: () => void;
  currency: CurrencyBinding;
}

export const DepositModal = ({ modalId, onClose, currency }: DepositModalProps) => {
  const { contractClient, name, ticker } = currency;

  const { wallet, walletBalances, prices, signTransaction, refetchBalances } = useWallet();
  const [isDepositing, setIsDepositing] = useState(false);
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

  const handleDepositClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsDepositing(true);

    contractClient.options.publicKey = wallet.address;

    const tx = await contractClient.deposit({
      user: wallet.address,
      amount: to7decimals(amount),
    });

    try {
      const { result } = await tx.signAndSend({ signTransaction });
      alert(`Deposit successful, result: ${result}`);
      closeModal();
    } catch (err) {
      console.error('Error depositing', err);
      alert('Error depositing');
    }
    setIsDepositing(false);
  };

  const handleAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setAmount(ev.target.value);
  };

  const handleSelectMaxLoan = () => {
    setAmount(max);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-8">Deposit {name}</h3>

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
