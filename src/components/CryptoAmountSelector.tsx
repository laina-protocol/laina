import { SCALAR_7, toDollarsFormatted } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import type { ChangeEvent } from 'react';
import { Button } from './Button';

export interface CryptoAmountSelectorProps {
  max: string;
  value: string;
  ticker: SupportedCurrency;
  price: bigint | undefined;
  onChange: (ev: ChangeEvent<HTMLInputElement>) => void;
  onSelectMaximum: () => void;
}

export const CryptoAmountSelector = ({
  max,
  value,
  ticker,
  price,
  onChange,
  onSelectMaximum,
}: CryptoAmountSelectorProps) => {
  const dollarValue = price ? toDollarsFormatted(price, BigInt(value) * SCALAR_7) : undefined;

  return (
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
        <label className="input input-bordered flex items-center gap-2 w-1/3">
          <input type="number" value={value} onChange={onChange} placeholder="" className="text-right w-2/3" />
          <span className="text-grey w-1/3">{ticker}</span>
        </label>
        <span className="w-1/3">{dollarValue && `≈ ${dollarValue}`}</span>
        <Button variant="outline" onClick={onSelectMaximum}>
          Select maximum
        </Button>
      </div>
    </>
  );
};
