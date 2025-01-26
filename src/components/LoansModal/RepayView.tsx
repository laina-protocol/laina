import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { type Loan, useLoans } from '@contexts/loan-context';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { SCALAR_7, formatAPR, formatAmount, toCents } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { type ChangeEvent, useState } from 'react';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

interface RepayViewProps {
  loan: Loan;
  onBack: () => void;
  onSuccess: (ticker: SupportedCurrency, amount: string) => void;
  onFullSuccess: (ticker: SupportedCurrency) => void;
}

const RepayView = ({ loan, onBack, onSuccess, onFullSuccess }: RepayViewProps) => {
  const { borrowedAmount, borrowedTicker, collateralAmount, collateralTicker, unpaidInterest } = loan;
  const { name } = CURRENCY_BINDINGS[borrowedTicker];
  const { wallet, signTransaction, refetchBalances } = useWallet();
  const { prices, pools } = usePools();
  const { refetchLoans } = useLoans();
  const [amount, setAmount] = useState('0');
  const [isRepaying, setIsRepaying] = useState(false);
  const [isRepayingAll, setIsRepayingAll] = useState(false);

  const loanBalance = borrowedAmount + unpaidInterest;
  const apr = pools?.[borrowedTicker]?.annualInterestRate;
  const price = prices?.[borrowedTicker];
  const valueCents = price ? toCents(price, BigInt(amount) * SCALAR_7) : undefined;

  const max = (loanBalance / SCALAR_7).toString();

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
      onSuccess(borrowedTicker, amount);
    } catch (err) {
      console.error('Error repaying', err);
      alert('Error repaying');
    }
    refetchLoans();
    refetchBalances();
    setIsRepaying(false);
  };

  const handleRepayAllClick = async () => {
    if (!wallet) return;

    setIsRepayingAll(true);

    loanManagerClient.options.publicKey = wallet.address;

    const tx = await loanManagerClient.repay_and_close_manager({
      user: wallet.address,
      // +5% to liabilities. TEMPORARY hard-coded solution for max allowance.
      max_allowed_amount: (BigInt(loanBalance) * BigInt(5)) / BigInt(100) + BigInt(loanBalance),
    });
    try {
      await tx.signAndSend({ signTransaction });
      onFullSuccess(borrowedTicker);
    } catch (err) {
      console.error('Error repaying', err);
      alert('Error repaying');
    }
    refetchLoans();
    refetchBalances();
    setIsRepayingAll(false);
  };

  return (
    <>
      <h3 className="text-xl font-bold tracking-tight">Repay {name}</h3>
      <p className="my-4">
        Repay some or all of your loan. Repaying the loan in full will return the collateral back to you.
      </p>
      {apr && <p className="mb-4">The annual interest rate is currently {formatAPR(apr)}.</p>}
      <p>
        Borrowed amount: {formatAmount(loanBalance)} {borrowedTicker}
      </p>
      <p>
        Collateral: {formatAmount(collateralAmount)} {collateralTicker}
      </p>
      <p className="font-bold mb-2 mt-6">Select the amount to repay</p>
      <CryptoAmountSelector
        max={max}
        value={amount}
        valueCents={valueCents}
        ticker={borrowedTicker}
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
