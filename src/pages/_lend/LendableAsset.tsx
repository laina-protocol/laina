import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { type Balance, useWallet } from '@contexts/wallet-context';
import { isBalanceZero } from '@lib/converters';
import { formatAPY, formatAmount, toDollarsFormatted } from '@lib/formatting';
import { isNil } from 'ramda';
import type { CurrencyBinding } from 'src/currency-bindings';
import { DepositModal } from './DepositModal';

export interface LendableAssetProps {
  currency: CurrencyBinding;
}

export const LendableAsset = ({ currency }: LendableAssetProps) => {
  const { icon, name, ticker } = currency;

  const { wallet, walletBalances } = useWallet();
  const { prices, pools, refetchPools } = usePools();
  const pool = pools?.[ticker];

  const price = prices?.[ticker];

  const modalId = `deposit-modal-${ticker}`;

  const balance: Balance | undefined = walletBalances?.[ticker];

  const isPoor = !balance?.trustLine || isBalanceZero(balance.balanceLine.balance);

  const openModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.close();
    refetchPools();
  };

  return (
    <tr className="border-none text-base h-[6.5rem]">
      <td className="pl-2 pr-6 w-20">
        <img src={icon} alt="" className="mx-auto max-h-12" />
      </td>

      <td>
        <h2 className="font-semibold text-2xl leading-6 mt-3 tracking-tight">{name}</h2>
        <span>{ticker}</span>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">
          {pool ? formatAmount(pool.totalBalance) : <Loading size="xs" />}
        </p>
        <p>{!isNil(price) && !isNil(pool) && toDollarsFormatted(price, pool.totalBalance)}</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">
          {pool ? formatAPY(pool.annualInterestRate) : <Loading size="xs" />}
        </p>
      </td>

      <td className="pr-0">
        {isPoor ? (
          <div className="tooltip" data-tip={!wallet ? 'Connect a wallet first' : 'Not enough funds'}>
            <Button disabled={true} onClick={() => {}}>
              Deposit
            </Button>
          </div>
        ) : (
          <Button onClick={openModal}>Deposit</Button>
        )}
      </td>
      <DepositModal modalId={modalId} onClose={closeModal} currency={currency} />
    </tr>
  );
};
