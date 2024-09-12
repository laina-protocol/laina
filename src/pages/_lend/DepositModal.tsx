import { Button } from '@components/Button';
import { type ChangeEvent, useState } from 'react';
import type { Currency } from 'src/currencies';
import { useWallet } from 'src/stellar-wallet';

export interface DepositModalProps {
  modalId: string;
  onClose: () => void;
  currency: Currency;
}

export const DepositModal = ({ modalId, onClose, currency }: DepositModalProps) => {
  const { loanPoolContract, name, symbol } = currency;

  const { wallet, balances, signTransaction } = useWallet();
  const [isDepositing, setIsDepositing] = useState(false);
  const [amount, setAmount] = useState('0');

  const balance = balances[symbol];

  if (!balance) return null;

  const handleDepositClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsDepositing(true);

    loanPoolContract.options.publicKey = wallet.address;

    // Multiply by ten million by adding zeroes.
    const stroops = BigInt(amount) * BigInt(10_000_000);

    const tx = await loanPoolContract.deposit({
      user: wallet.address,
      amount: stroops,
    });

    try {
      const { result } = await tx.signAndSend({ signTransaction });
      alert(`Deposit successful, result: ${result}`);
      onClose();
    } catch (err) {
      alert(`Error depositing: ${JSON.stringify(err)}`);
    }
    setIsDepositing(false);
  };

  const handleAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setAmount(ev.target.value);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-8">Deposit {name}</h3>

        <div className="flex flex-row items-center">
          <div className="w-full">
            <p className="text-lg mb-2">Amount to deposit</p>
            <input
              type="range"
              min={0}
              max={balance.balance}
              value={amount}
              className="range"
              onChange={handleAmountChange}
            />
            <div className="flex w-full justify-between px-2 text-xs">
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
            </div>
          </div>
        </div>

        <p>
          {amount} {symbol} out of {balance.balance} {symbol}
        </p>

        <div className="flex flex-row justify-end mt-8">
          <Button onClick={onClose} className="btn-ghost mr-4">
            Cancel
          </Button>
          {!isDepositing ? (
            <Button disabled={amount === '0'} onClick={handleDepositClick}>
              Deposit
            </Button>
          ) : (
            <Button disabled>
              <span className="loading loading-spinner" />
              Depositing
            </Button>
          )}
        </div>
      </div>
      {/* Invisible backdrop that closes the modal on click */}
      <form method="dialog" className="modal-backdrop">
        <button type="button">close</button>
      </form>
    </dialog>
  );
};
