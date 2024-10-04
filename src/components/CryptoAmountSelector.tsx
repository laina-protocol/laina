import { formatCentAmount } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { isNil, useWith } from 'ramda';
import type { ChangeEvent } from 'react';
import { CURRENCY_BINDINGS_ARR } from 'src/currency-bindings';
import { useWallet } from 'src/stellar-wallet';
import { Button } from './Button';

export interface CryptoAmountSelectorProps {
  max: string;
  value: string;
  valueCents: bigint | undefined;
  ticker: SupportedCurrency;
  onChange: (ev: ChangeEvent<HTMLInputElement>) => void;
  onSelectMaximum: () => void;
  onSelectTicker?: (ticker: SupportedCurrency) => void;
}

export const CryptoAmountSelector = ({
  max,
  value,
  valueCents,
  ticker,
  onChange,
  onSelectMaximum,
  onSelectTicker,
}: CryptoAmountSelectorProps) => (
  <>
    <input type="range" min={0} max={max} value={value ?? '0'} className="range" onChange={onChange} />
    <div className="flex w-full justify-between px-2 text-xs">
      <span>|</span>
      <span>|</span>
      <span>|</span>
      <span>|</span>
      <span>|</span>
    </div>
    <div className="flex flex-row items-center max-w-full gap-2">
      {isNil(onSelectTicker) ? (
        <label className="input input-bordered flex items-center gap-2 w-1/2">
          <input type="number" value={value} onChange={onChange} placeholder="" className="text-right w-1/2" />
          <span className="text-grey w-1/2">{ticker}</span>
        </label>
      ) : (
        <div className="join w-1/2">
          <input
            type="number"
            value={value}
            onChange={onChange}
            placeholder=""
            className="input input-bordered text-right w-1/2 join-item"
          />
          <select
            className="select select-bordered w-1/2 join-item"
            value={ticker}
            onChange={(ev) => {
              onSelectTicker(ev.target.value as SupportedCurrency);
            }}
          >
            {CURRENCY_BINDINGS_ARR.map(({ ticker }) => (
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

const TickerOption = ({ ticker }: { ticker: SupportedCurrency }) => {
  const { walletBalances } = useWallet();
  const balance = walletBalances[ticker];
  const disabled = isNil(balance) || balance.balance === '0';

  return (
    <option disabled={disabled} value={ticker}>
      {ticker}
    </option>
  );
};
