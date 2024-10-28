import { Button } from '@components/Button';
import { CryptoAmountSelector } from '@components/CryptoAmountSelector';
import { Loading } from '@components/Loading';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { getIntegerPart, to7decimals } from '@lib/converters';
import { SCALAR_7, fromCents, toCents } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { type ChangeEvent, useState } from 'react';
import { CURRENCY_BINDINGS, CURRENCY_BINDINGS_ARR, type CurrencyBinding } from 'src/currency-bindings';
import { type BalanceRecord, type PriceRecord, type Wallet, useWallet } from 'src/stellar-wallet';

const HEALTH_FACTOR_AUTO_THRESHOLD = 1.65;
const HEALTH_FACTOR_MIN_THRESHOLD = 1.2;
const HEALTH_FACTOR_GOOD_THRESHOLD = 1.6;
const HEALTH_FACTOR_EXCELLENT_THRESHOLD = 2.0;

export interface BorrowStepProps {
  onClose: () => void;
  currency: CurrencyBinding;
  totalSupplied: bigint;
  wallet: Wallet;
  walletBalances: BalanceRecord;
  prices: PriceRecord;
}

export const BorrowStep = ({ onClose, currency, totalSupplied, wallet, walletBalances, prices }: BorrowStepProps) => {
  const { name, ticker, contractId: loanCurrencyId } = currency;
  const { signTransaction } = useWallet();

  const [isBorrowing, setIsBorrowing] = useState(false);
  const [loanAmount, setLoanAmount] = useState<string>('0');
  const [collateralTicker, setCollateralTicker] = useState<SupportedCurrency>('XLM');
  const [collateralAmount, setCollateralAmount] = useState<string>('0');

  const collateralOptions: SupportedCurrency[] = CURRENCY_BINDINGS_ARR.filter((c) => c.ticker !== ticker).map(
    ({ ticker }) => ticker,
  );

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

  // TODO: get this from the contract.
  const interestRate = '7.5%';

  const handleCancel = () => {
    setLoanAmount('0');
    setCollateralAmount('0');
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
      loanManagerClient.options.publicKey = wallet.address;

      const { contractId: collateralCurrencyId } = CURRENCY_BINDINGS[collateralTicker];

      const tx = await loanManagerClient.create_loan({
        user: wallet.address,
        borrowed: to7decimals(loanAmount),
        borrowed_from: loanCurrencyId,
        collateral: to7decimals(collateralAmount),
        collateral_from: collateralCurrencyId,
      });
      await tx.signAndSend({ signTransaction });
      alert('Loan created succesfully!');
      onClose();
    } catch (err) {
      console.error('Error borrowing', err);
      alert('Error borrowing');
    }

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

  const maxLoan = (totalSupplied / 10_000_000n).toString();

  const maxCollateral = getIntegerPart(collateralBalance.trustLine ? collateralBalance.balanceLine.balance : '0');

  const handleSelectMaxLoan = () => setLoanAmount(maxLoan);

  const handleSelectMaxCollateral = () => setCollateralAmount(maxCollateral);

  return (
    <>
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
      <p className="my-4">The annual interest rate is currently {interestRate}.</p>

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
        <Button onClick={handleCancel} variant="ghost" className="mr-4">
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
    </>
  );
};

const HealthFactor = ({ value }: { value: number }) => {
  if (value < HEALTH_FACTOR_MIN_THRESHOLD) {
    return <HealthBar text="Would liquidate immediately" textColor="text-red" bgColor="bg-red" bars={1} />;
  }
  if (value < HEALTH_FACTOR_GOOD_THRESHOLD) {
    return <HealthBar text="At risk of liquidation" textColor="text-yellow" bgColor="bg-yellow" bars={2} />;
  }
  if (value < HEALTH_FACTOR_EXCELLENT_THRESHOLD) {
    return <HealthBar text="Good" textColor="text-blue" bgColor="bg-blue" bars={3} />;
  }
  return <HealthBar text="Excellent" textColor="text-green" bgColor="bg-green" bars={4} />;
};

interface HealthBarProps {
  text: string;
  textColor: string;
  bgColor: string;
  bars: number;
}

const HealthBar = ({ text, textColor, bgColor, bars }: HealthBarProps) => (
  <>
    <p className={`${textColor} font-semibold transition-all`}>{text}</p>
    <div className="w-full flex flex-row gap-2">
      <div className={`transition-all h-3 w-full rounded-l ${bgColor}`} />
      <div className={`transition-all h-3 w-full ${bars > 1 ? bgColor : 'bg-grey'}`} />
      <div className={`transition-all h-3 w-full ${bars > 2 ? bgColor : 'bg-grey'}`} />
      <div className={`transition-all h-3 w-full rounded-r ${bars > 3 ? bgColor : 'bg-grey'}`} />
    </div>
  </>
);
