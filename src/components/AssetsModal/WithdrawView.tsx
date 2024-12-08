import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { SCALAR_7, toCents } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { type ChangeEvent, useState } from 'react';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

export interface WithdrawViewProps {
  ticker: SupportedCurrency;
  onBack: () => void;
  onSuccess: (ticker: SupportedCurrency, amount: string) => void;
}

const WithdrawView = ({ ticker, onBack, onSuccess }: WithdrawViewProps) => {
  const { name, contractClient } = CURRENCY_BINDINGS[ticker];
  const { positions, wallet, signTransaction } = useWallet();
  const { prices } = usePools();
  const [amount, setAmount] = useState('0');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const price = prices?.[ticker];

  const valueCents = price ? toCents(price, BigInt(amount) * SCALAR_7) : undefined;

  if (!positions[ticker]) {
    throw Error('Unexpectedly opened WithdrawView without balance');
  }

  const { receivables } = positions[ticker];

  const max = (receivables / SCALAR_7).toString();

  const handleAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setAmount(ev.target.value);
  };

  const handleSelectMax = () => {
    setAmount(max);
  };

  const handleWithdrawClick = async () => {
    if (!wallet) return;

    setIsWithdrawing(true);

    contractClient.options.publicKey = wallet.address;

    const tx = await contractClient.withdraw({
      user: wallet.address,
      amount: BigInt(amount) * SCALAR_7,
    });
    try {
      await tx.signAndSend({ signTransaction });
      onSuccess(ticker, amount);
    } catch (err) {
      console.error('Error withdrawing', err);
      alert('Error withdrawing');
    }
  };

  return (
    <>
      <h3 className="text-xl font-bold tracking-tight mb-8">Withdraw {name}</h3>
      <p className="text-lg mb-2">Select the amount to withdraw</p>
      <CryptoAmountSelector
        max={max}
        value={amount}
        valueCents={valueCents}
        ticker={ticker}
        onChange={handleAmountChange}
        onSelectMaximum={handleSelectMax}
      />
      <div className="flex flex-row justify-end mt-8">
        <Button onClick={onBack} variant="ghost" className="mr-4">
          Back
        </Button>
        {!isWithdrawing ? (
          <Button disabled={amount === '0'} onClick={handleWithdrawClick}>
            Withdraw
          </Button>
        ) : (
          <Button disabled>
            <Loading />
            Withdrawing
          </Button>
        )}
      </div>
    </>
  );
};

export default WithdrawView;
