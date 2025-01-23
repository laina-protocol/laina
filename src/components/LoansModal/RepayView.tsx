import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { SCALAR_7, toCents } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { type ChangeEvent, useState } from 'react';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

interface RepayViewProps {
  ticker: SupportedCurrency;
  onBack: () => void;
  onSuccess: (ticker: SupportedCurrency, amount: string) => void;
}

const RepayView = ({ ticker, onBack, onSuccess }: RepayViewProps) => {
  const { name } = CURRENCY_BINDINGS[ticker];
  const { wallet, signTransaction, positions } = useWallet();
  const { prices } = usePools();
  const [amount, setAmount] = useState('0');
  const [isRepaying, setIsRepaying] = useState(false);
  const [isRepayingAll, setIsRepayingAll] = useState(false);

  if (!positions[ticker]) {
    throw Error('Unexpectedly opened RepayView without balance');
  }

  const price = prices?.[ticker];
  const valueCents = price ? toCents(price, BigInt(amount) * SCALAR_7) : undefined;

  const { liabilities } = positions[ticker];

  const max = (liabilities / SCALAR_7).toString();

  const handleAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setAmount(ev.target.value);
  };

  const handleSelectMax = () => {
    setAmount(max);
  };

  const handleRepayClick = async () => {
    if (!wallet) return;

    setIsRepaying(true);

    loanManagerClient.options.publicKey = wallet.address;

    const tx = await loanManagerClient.repay({ user: wallet.address, amount: BigInt(amount) * SCALAR_7 });
    try {
      await tx.signAndSend({ signTransaction });
      onSuccess(ticker, amount);
    } catch (err) {
      console.error('Error repaying', err);
      alert('Error repaying');
    }
    setIsRepaying(false);
  };

  const handleRepayAllClick = async () => {
    if (!wallet) return;

    setIsRepayingAll(true);

    loanManagerClient.options.publicKey = wallet.address;

    const tx = await loanManagerClient.repay_and_close({ user: wallet.address, max_allowed_amount: (BigInt(liabilities) * BigInt(5) / BigInt(100)) + BigInt(liabilities) });
    try {
      await tx.signAndSend({ signTransaction });
      onSuccess(ticker, max);
    } catch (err) {
      console.error('Error repaying', err);
      alert('Error repaying');
    }
    setIsRepayingAll(false);
  };

  return (
    <>
      <h3 className="text-xl font-bold tracking-tight mb-8">Repay {name}</h3>
      <p>Select the amount to repay</p>
      <CryptoAmountSelector
        max={max}
        value={amount}
        valueCents={valueCents}
        ticker={ticker}
        onChange={handleAmountChange}
        onSelectMaximum={handleSelectMax}
      />
      <div className="flex flex-row justify-end mt-8 gap-4">
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
        {!isRepaying ? (
          <Button disabled={isRepayingAll || amount === '0'} onClick={handleRepayClick}>
            Repay
          </Button>
        ) : (
          <LoadingButton />
        )}
        {!isRepayingAll ? (
          <Button disabled={isRepaying} onClick={handleRepayAllClick}>
            Repay All
          </Button>
        ) : (
          <LoadingButton />
        )}
      </div>
    </>
  );
};

const LoadingButton = () => (
  <Button disabled>
    <Loading />
    Repaying
  </Button>
);

export default RepayView;
