import { useWallet } from '@contexts/wallet-context';
import { decimalStringToStroops, isBalanceZero, stroopsToDecimalString } from '@lib/converters';
import { formatCentAmount } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import type { ChangeEvent } from 'react';
import { Button } from './Button';

export interface CryptoAmountSelectorProps {
  max: bigint;
  value: bigint;
  valueCents: bigint | undefined;
  ticker: SupportedCurrency;
  onChange: (stroops: bigint) => void;
  onSelectMaximum: () => void;
  tickerChangeOptions?: TickerChangeOptions;
}

export interface TickerChangeOptions {
  options: SupportedCurrency[];
  onSelectTicker: (ticker: SupportedCurrency) => void;
}

export const CryptoAmountSelector = ({
  max,
  value,
  valueCents,
  ticker,
  onChange,
  onSelectMaximum,
  tickerChangeOptions,
}: CryptoAmountSelectorProps) => {
  const maxStr = stroopsToDecimalString(max);
  const valueStr = stroopsToDecimalString(value);

  const handleSliderChange = (ev: ChangeEvent<HTMLInputElement>) => {
    onChange(BigInt(ev.target.value))
  }

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    onChange(decimalStringToStroops(ev.target.value));
  };

  return (
    <>
      <input type="range" min={0} max={max.toString()} value={value.toString()} className="range" onChange={handleSliderChange} />
      <div className="flex w-full justify-between px-2 text-xs">
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
      </div>
      <div className="flex flex-row items-center max-w-full gap-2">
        {isNil(tickerChangeOptions) ? (
          <label className="input input-bordered flex items-center gap-2 w-1/2">
            <input type="number" value={valueStr} onChange={handleChange} placeholder="" className="text-right w-1/2" />
            <span className="text-grey w-1/2">{ticker}</span>
          </label>
        ) : (
          <div className="join w-1/2">
            <input
              type="number"
              max={maxStr}
              step="0.0000001"
              value={valueStr}
              onChange={handleChange}
              placeholder=""
              className="input input-bordered text-right w-1/2 join-item"
            />
            <select
              className="select select-bordered w-1/2 join-item"
              value={ticker}
              onChange={(ev) => {
                tickerChangeOptions.onSelectTicker(ev.target.value as SupportedCurrency);
              }}
            >
              {tickerChangeOptions.options.map((ticker) => (
                <TickerOption key={ticker} ticker={ticker} />
              ))}
            </select>
          </div>
        )}
        <span className="w-1/3">{valueCents ? `≈ ${formatCentAmount(valueCents)}` : null}</span>
        <Button variant="outline" onClick={onSelectMaximum}>
          Select maximum
        </Button>
      </div>
    </>
  );
};

const TickerOption = ({ ticker }: { ticker: SupportedCurrency }) => {
  const { walletBalances } = useWallet();
  const balance = walletBalances?.[ticker];
  const disabled = isNil(balance) || !balance.trustLine || isBalanceZero(balance.balanceLine.balance);

  return (
    <option disabled={disabled} value={ticker}>
      {ticker}
    </option>
  );
};
