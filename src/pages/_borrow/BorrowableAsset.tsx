import { isNil } from 'ramda';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { useWallet } from '@contexts/wallet-context';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { isBalanceZero } from '@lib/converters';
import { formatAPR } from '@lib/formatting';
import type { CurrencyBinding } from 'src/currency-bindings';
import { BorrowModal } from './BorrowModal/BorrowModal';

interface BorrowableAssetCardProps {
  currency: CurrencyBinding;
}

export const BorrowableAsset = ({ currency }: BorrowableAssetCardProps) => {
  const { icon, name, ticker, contractClient } = currency;

  const modalId = `borrow-modal-${ticker}`;

  const { wallet, walletBalances } = useWallet();

  const [poolAPR, setPoolAPR] = useState<bigint | null>(null);
  const [totalSupplied, setTotalSupplied] = useState<bigint | null>(null);
  const [totalSuppliedPrice, setTotalSuppliedPrice] = useState<bigint | null>(null);

  // Does the user have some other token in their wallet to use as a collateral?
  const isCollateral = !walletBalances
    ? false
    : Object.entries(walletBalances)
      .filter(([t, _b]) => t !== ticker)
      .some(([_t, b]) => b.trustLine && !isBalanceZero(b.balanceLine.balance));

  const borrowDisabled = !wallet || !isCollateral || !totalSupplied;

  const formatPoolAPR = useCallback((apr: bigint | null) => {
    if (apr === null) return <Loading size="xs" />;
    return formatAPR(apr);
  }, []);

  const fetchAvailableContractBalance = useCallback(async () => {
    if (!contractClient) return;

    try {
      const { result } = await contractClient.get_available_balance();
      setTotalSupplied(result);
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }
  }, [contractClient]); // Dependency on loanPoolContract

  const fetchPoolAPR = useCallback(async () => {
    if (!contractClient) return;

    try {
      const { result } = await contractClient.get_interest();
      setPoolAPR(result);
    } catch (error) {
      console.error('Error fetching APR data', error);
    }
  }, [contractClient]);

  const formatSuppliedAmount = useCallback((amount: bigint | null) => {
    if (amount === BigInt(0)) return '0';
    if (!amount) return <Loading size="xs" />;

    const ten_k = BigInt(10_000 * 10_000_000);
    const one_m = BigInt(1_000_000 * 10_000_000);
    switch (true) {
      case amount > one_m:
        return `${(Number(amount) / (1_000_000 * 10_000_000)).toFixed(2)}M`;
      case amount > ten_k:
        return `${(Number(amount) / (1_000 * 10_000_000)).toFixed(1)}K`;
      default:
        return `${(Number(amount) / 10_000_000).toFixed(1)}`;
    }
  }, []);

  const fetchPriceData = useCallback(async () => {
    if (!loanManagerClient) return;

    try {
      const { result } = await loanManagerClient.get_price({ token: currency.ticker });
      setTotalSuppliedPrice(result);
    } catch (error) {
      console.error('Error fetching price data:', error);
    }
  }, [currency.ticker]);

  const formatSuppliedAmountPrice = useCallback(
    (price: bigint | null) => {
      if (totalSupplied === BigInt(0)) return '$0';
      if (!totalSupplied || !price) return null;

      const ten_k = BigInt(10_000 * 10_000_000);
      const one_m = BigInt(1_000_000 * 10_000_000);
      const total_price = ((price / BigInt(10_000_000)) * totalSupplied) / BigInt(10_000_000);
      switch (true) {
        case total_price > one_m:
          return `$${(Number(total_price) / (1_000_000 * 10_000_000)).toFixed(2)}M`;
        case total_price > ten_k:
          return `$${(Number(total_price) / (1_000 * 10_000_000)).toFixed(1)}K`;
        default:
          return `$${(Number(total_price) / 10_000_000).toFixed(1)}`;
      }
    },
    [totalSupplied],
  );

  useEffect(() => {
    // Fetch contract data immediately and set an interval to run every 6 seconds
    fetchAvailableContractBalance();
    fetchPriceData();
    fetchPoolAPR();
    const intervalId = setInterval(fetchAvailableContractBalance, 6000);

    // Cleanup function to clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchAvailableContractBalance, fetchPriceData, fetchPoolAPR]); // Now dependent on the memoized function

  const openModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.close();
  };

  const tooltip = useMemo(() => {
    if (!totalSupplied) return 'The pool has no assets to borrow';
    if (!wallet) return 'Connect a wallet first';
    if (!isCollateral) return 'Another token needed for the collateral';
    return 'Something odd happened.';
  }, [totalSupplied, wallet, isCollateral]);

  return (
    <tr className="border-none text-base h-[6.5rem]">
      <td className="w-20 pl-2 pr-6">
        <img src={icon} alt="" className="mx-auto max-h-12" />
      </td>

      <td>
        <h2 className="font-semibold text-2xl leading-6 mt-3 tracking-tight">{name}</h2>
        <span>{ticker}</span>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">{formatSuppliedAmount(totalSupplied)}</p>
        <p>{formatSuppliedAmountPrice(totalSuppliedPrice)}</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">{formatPoolAPR(poolAPR)}</p>
      </td>

      <td>
        {borrowDisabled ? (
          <div className="tooltip" data-tip={tooltip}>
            <Button disabled={true} onClick={() => { }}>
              Borrow
            </Button>
          </div>
        ) : (
          <Button onClick={openModal}>Borrow</Button>
        )}
      </td>
      {!isNil(totalSupplied) && (
        <BorrowModal modalId={modalId} onClose={closeModal} currency={currency} totalSupplied={totalSupplied} />
      )}
    </tr>
  );
};
