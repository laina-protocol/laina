import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Loading } from '@components/Loading';
import { isNil } from 'ramda';
import { useCallback, useEffect, useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';
import { formatAmount, toDollarsFormatted } from 'src/lib/formatting';
import { type Balance, useWallet } from 'src/stellar-wallet';
import { DepositModal } from './DepositModal';

export interface LendableAssetProps {
  currency: CurrencyBinding;
}

export const LendableAsset = ({ currency }: LendableAssetProps) => {
  const { icon, name, ticker, contractClient } = currency;

  const { wallet, walletBalances, prices } = useWallet();
  const [totalSupplied, setTotalSupplied] = useState<bigint | null>(null);

  const price = prices?.[ticker];

  const modalId = `deposit-modal-${ticker}`;

  const balance: Balance | undefined = walletBalances[ticker];

  const isPoor = !balance?.balance || balance.balance === '0';

  const fetchAvailableContractBalance = useCallback(async () => {
    if (!contractClient) return;

    try {
      const { result } = await contractClient.get_contract_balance();
      setTotalSupplied(result);
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }
  }, [contractClient]); // Dependency on loanPoolContract

  const formatSuppliedAmount = useCallback((amount: bigint | null) => {
    if (amount === null) return <Loading size="xs" />;
    return formatAmount(amount);
  }, []);

  useEffect(() => {
    // Fetch contract data immediately and set an interval to run every 6 seconds
    fetchAvailableContractBalance();
    const intervalId = setInterval(fetchAvailableContractBalance, 6000);

    // Cleanup function to clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchAvailableContractBalance]); // Now dependent on the memoized function

  const openModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.close();
    fetchAvailableContractBalance();
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
        <p className="text-xl font-semibold leading-6">{formatSuppliedAmount(totalSupplied)}</p>
        <p>{!isNil(price) && !isNil(totalSupplied) && toDollarsFormatted(price, totalSupplied)}</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">1.23%</p>
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
