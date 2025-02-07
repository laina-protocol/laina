import { type ChangeEvent, useState } from 'react';

import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { ErrorDialogContent, LoadingDialogContent, SuccessDialogContent } from '@components/Dialog';
import { HEALTH_FACTOR_AUTO_THRESHOLD, HEALTH_FACTOR_MIN_THRESHOLD, HealthFactor } from '@components/HealthFactor';
import { Loading } from '@components/Loading';
import { useLoans } from '@contexts/loan-context';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { getIntegerPart, isBalanceZero, to7decimals } from '@lib/converters';
import { SCALAR_7, formatAPR, fromCents, toCents } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { CURRENCY_BINDINGS, CURRENCY_BINDINGS_ARR, type CurrencyBinding } from 'src/currency-bindings';

export interface BorrowStepProps {
  onClose: () => void;
  currency: CurrencyBinding;
}

export const BorrowStep = ({ onClose, currency }: BorrowStepProps) => {
  const { name, ticker, contractId: loanCurrencyId } = currency;
  const { signTransaction, wallet, walletBalances, refetchBalances } = useWallet();
  const { pools, prices } = usePools();
  const { refetchLoans } = useLoans();

  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isBorrowingSuccess, setIsBorrowingSuccess] = useState(false);
  const [borrowingError, setBorrowingError] = useState<Error | null>(null);
  const [loanAmount, setLoanAmount] = useState<string>('0');

  const collateralOptions: SupportedCurrency[] = CURRENCY_BINDINGS_ARR.filter((c) => c.ticker !== ticker).map(
    ({ ticker }) => ticker,
  );
  const initialCollateral = collateralOptions.find((t) => {
    const balance = walletBalances?.[t];
    return balance?.trustLine && !isBalanceZero(balance.balanceLine.balance);
  });

  const [collateralTicker, setCollateralTicker] = useState<SupportedCurrency>(initialCollateral ?? 'XLM');
  const [collateralAmount, setCollateralAmount] = useState<string>('0');

  if (!pools || !prices || !walletBalances) return null;

  const { annualInterestRate, availableBalanceTokens } = pools[ticker];

  const loanBalance = walletBalances[ticker];
  const collateralBalance = walletBalances[collateralTicker];

  const loanPrice = prices[ticker];
  const collateralPrice = prices[collateralTicker];

  const loanAmountCents = loanPrice ? toCents(loanPrice, BigInt(loanAmount) * SCALAR_7) : undefined;
  const collateralAmountCents = collateralPrice
    ? toCents(collateralPrice, BigInt(collateralAmount) * SCALAR_7)
    : undefined;

  const healthFactor =
    loanAmountCents && loanAmountCents > 0n ? Number(collateralAmountCents) / Number(loanAmountCents) : 0;

  const handleClose = () => {
    setLoanAmount('0');
    setCollateralAmount('0');
    setIsBorrowing(false);
    setIsBorrowingSuccess(false);
    setBorrowingError(null);
    onClose();
  };

  const handleBorrowClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }
    if (!loanAmount || !collateralAmount) {
      alert('Empty loan amount or collateral!');
      return;
    }

    setIsBorrowing(true);

    try {
      const { contractId: collateralCurrencyId } = CURRENCY_BINDINGS[collateralTicker];

      const tx = await loanManagerClient.create_loan({
        user: wallet.address,
        borrowed: to7decimals(loanAmount),
        borrowed_from: loanCurrencyId,
        collateral: to7decimals(collateralAmount),
        collateral_from: collateralCurrencyId,
      });
      await tx.signAndSend({ signTransaction });
      setIsBorrowingSuccess(true);
      setBorrowingError(null);
    } catch (err) {
      console.error('Error borrowing', err);
      setBorrowingError(err as Error);
      setIsBorrowingSuccess(false);
    }
    refetchLoans();
    refetchBalances();
    setIsBorrowing(false);
  };

  const handleLoanAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setLoanAmount(ev.target.value);

    if (!loanPrice || !collateralPrice) return;

    // Move the collateral to reach the good health threshold
    const loanAmountCents = toCents(loanPrice, BigInt(ev.target.value) * SCALAR_7);
    const minHealthyCollateralCents = BigInt(Math.ceil(HEALTH_FACTOR_AUTO_THRESHOLD * Number(loanAmountCents) + 100));
    const minHealthyCollateral = fromCents(collateralPrice, minHealthyCollateralCents) / SCALAR_7;
    if (minHealthyCollateral <= BigInt(maxCollateral)) {
      setCollateralAmount(minHealthyCollateral.toString());
    } else {
      setCollateralAmount(maxCollateral);
    }
  };

  const handleCollateralAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setCollateralAmount(ev.target.value);
  };

  const handleCollateralTickerChange = (ticker: SupportedCurrency) => {
    setCollateralTicker(ticker);
    setCollateralAmount('0');
  };

  const isTrustline = loanBalance.trustLine;

  const isBorrowDisabled =
    !isTrustline || loanAmount === '0' || collateralAmount === '0' || healthFactor < HEALTH_FACTOR_MIN_THRESHOLD;

  const maxLoan = (availableBalanceTokens / 10_000_000n).toString();

  const maxCollateral = getIntegerPart(collateralBalance.trustLine ? collateralBalance.balanceLine.balance : '0');

  const handleSelectMaxLoan = () => setLoanAmount(maxLoan);

  const handleSelectMaxCollateral = () => setCollateralAmount(maxCollateral);

  if (isBorrowing) {
    return (
      <LoadingDialogContent
        title="Creating a loan"
        subtitle={`Borrowing ${loanAmount} ${ticker}`}
        onClick={handleClose}
      />
    );
  }

  if (isBorrowingSuccess) {
    return <SuccessDialogContent subtitle={`Succesfully borrowed ${loanAmount} ${ticker}`} onClick={handleClose} />;
  }

  if (borrowingError) {
    return <ErrorDialogContent error={borrowingError} onClick={handleClose} />;
  }

  return (
    <div className="md:w-[700px]">
      <h3 className="font-bold text-xl mb-4">Borrow {name}</h3>
      <p className="my-4">
        Borrow {name} using another asset as a collateral. The value of the collateral must exceed the value of the
        borrowed asset. You will receive the collateral back to your wallet after repaying the loan in full.
      </p>
      <p className="my-4">
        The higher the value of the collateral is to the value of the borrowed asset, the safer this loan is. This is
        visualised by the health factor.
      </p>
      <p className="my-4">
        The loan will be available for liquidation if the value of the borrowed asset raises to the value of the
        collateral, causing you to lose some of your collateral.
      </p>
      <p className="my-4">The interest rate changes as the amount of assets borrowed from the pools changes.</p>
      <p className="my-4">The annual interest rate is currently {formatAPR(annualInterestRate)}.</p>

      <p className="font-bold mb-2 mt-6">Amount to borrow</p>
      <CryptoAmountSelector
        max={maxLoan}
        value={loanAmount}
        valueCents={loanAmountCents}
        ticker={ticker}
        onChange={handleLoanAmountChange}
        onSelectMaximum={handleSelectMaxLoan}
      />

      <p className="font-bold mb-2 mt-4">Amount of collateral</p>
      <CryptoAmountSelector
        max={maxCollateral}
        value={collateralAmount}
        valueCents={collateralAmountCents}
        ticker={collateralTicker}
        onChange={handleCollateralAmountChange}
        onSelectMaximum={handleSelectMaxCollateral}
        tickerChangeOptions={{
          onSelectTicker: handleCollateralTickerChange,
          options: collateralOptions,
        }}
      />

      <p className="font-bold mt-6 mb-2">Health Factor</p>
      <HealthFactor value={healthFactor} />

      <div className="flex flex-row justify-end mt-8">
        <Button onClick={handleClose} variant="ghost" className="mr-4">
          Cancel
        </Button>
        {!isBorrowing ? (
          <Button disabled={isBorrowDisabled} onClick={handleBorrowClick}>
            Borrow
          </Button>
        ) : (
          <Button disabled>
            <Loading />
            Borrowing
          </Button>
        )}
      </div>
    </div>
  );
};
