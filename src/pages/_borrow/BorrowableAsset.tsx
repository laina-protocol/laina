import { useMemo } from 'react';

import { Button } from '@components/Button';
import { StellarExpertLink } from '@components/Link';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { isBalanceZero } from '@lib/converters';
import { formatAPR, formatAmount, toDollarsFormatted } from '@lib/formatting';
import type { CurrencyBinding } from 'src/currency-bindings';

interface BorrowableAssetCardProps {
  currency: CurrencyBinding;
  onBorrowClicked: VoidFunction;
}

export const BorrowableAsset = ({ currency, onBorrowClicked }: BorrowableAssetCardProps) => {
  const { icon, name, ticker, issuerName, contractId } = currency;

  const { wallet, walletBalances } = useWallet();
  const { prices, pools } = usePools();
  const price = prices?.[ticker];
  const pool = pools?.[ticker];

  // Does the user have some other token in their wallet to use as a collateral?
  const isCollateral = !walletBalances
    ? false
    : Object.entries(walletBalances)
        .filter(([t, _b]) => t !== ticker)
        .some(([_t, b]) => b.trustLine && !isBalanceZero(b.balanceLine.balance));

  const borrowDisabled = !wallet || !isCollateral || !pool || pool.availableBalanceTokens === 0n;

  const tooltip = useMemo(() => {
    if (!pool) return 'The pool is loading';
    if (pool.availableBalanceTokens === 0n) return 'the pool has no assets to borrow';
    if (!wallet) return 'Connect a wallet first';
    if (!isCollateral) return 'Another token needed for the collateral';
    return 'Something odd happened.';
  }, [pool, wallet, isCollateral]);

  return (
    <tr className="border-none text-base h-[6.5rem]">
      <td className="w-20 pl-2 pr-6">
        <img src={icon} alt="" className="mx-auto max-h-12" />
      </td>

      <td>
        <h2 className="font-semibold text-2xl mt-3 tracking-tight">{name}</h2>
        <StellarExpertLink contractId={contractId} text="View pool contract" />
      </td>

      <td>
        <h2 className="text-xl font-semibold mt-3 leading-6">{ticker}</h2>
        <span>{issuerName}</span>
      </td>

      <td>
        <p className="text-xl font-semibold mt-3 leading-6">
          {pool ? formatAmount(pool.availableBalanceTokens) : <Loading size="xs" />}
        </p>
        <p>{pool && price ? toDollarsFormatted(price, pool.availableBalanceTokens) : null}</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">
          {pool ? formatAPR(pool.annualInterestRate) : <Loading size="xs" />}
        </p>
      </td>

      <td>
        {borrowDisabled ? (
          <div className="tooltip" data-tip={tooltip}>
            <Button disabled={true} onClick={() => {}}>
              Borrow
            </Button>
          </div>
        ) : (
          <Button onClick={onBorrowClicked}>Borrow</Button>
        )}
      </td>
    </tr>
  );
};
