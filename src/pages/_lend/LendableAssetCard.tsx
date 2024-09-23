import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Loading } from '@components/Loading';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import type { xdr } from '@stellar/stellar-base';
import { Api as RpcApi } from '@stellar/stellar-sdk/rpc';
import { useCallback, useEffect, useState } from 'react';
import type { CurrencyBinding } from 'src/currency-bindings';
import { type Balance, useWallet } from 'src/stellar-wallet';
import { DepositModal } from './DepositModal';

export interface LendableAssetCardProps {
  currency: CurrencyBinding;
}

export const LendableAssetCard = ({ currency }: LendableAssetCardProps) => {
  const { icon, name, ticker, contractClient } = currency;
  const { wallet, balances } = useWallet();

  const [totalSupplied, setTotalSupplied] = useState<bigint | null>(null);
  const [totalSuppliedPrice, setTotalSuppliedPrice] = useState<bigint | null>(null);

  const modalId = `deposit-modal-${ticker}`;

  const balance: Balance | undefined = balances[ticker];

  const isPoor = !balance?.balance || balance.balance === '0';

  const fetchAvailableContractBalance = useCallback(async () => {
    if (!contractClient) return;

    try {
      const { simulation } = await contractClient.get_contract_balance();

      if (!simulation || !RpcApi.isSimulationSuccess(simulation)) {
        throw 'get_contract_balance simulation was unsuccessful.';
      }

      // TODO: why do we need to cast here? The type should infer properly.
      const value = simulation.result?.retval.value() as xdr.Int128Parts;
      const supplied = (value.hi().toBigInt() << BigInt(64)) + value.lo().toBigInt();
      setTotalSupplied(supplied);

      // const apy = await loanPoolContract.getSupplyAPY();
      // setSupplyAPY(formatAPY(apy));
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }
  }, [contractClient]); // Dependency on loanPoolContract

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
      const { simulation } = await loanManagerClient.get_price({ token: currency.ticker });

      if (!simulation || !RpcApi.isSimulationSuccess(simulation)) {
        throw 'get_price simulation was unsuccessful.';
      }

      // TODO: why do we need to cast here? The type should infer properly.
      const value = simulation.result?.retval.value() as xdr.Int128Parts;
      const price = (value.hi().toBigInt() << BigInt(64)) + value.lo().toBigInt();

      setTotalSuppliedPrice(price);
    } catch (error) {
      console.error('Error fetchin price data:', error);
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
    const intervalId = setInterval(fetchAvailableContractBalance, 6000);

    // Cleanup function to clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchAvailableContractBalance, fetchPriceData]); // Now dependent on the memoized function

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
    <Card className="mb-9 p-6 min-h-36 flex flex-row items-center">
      <div className="min-w-12">
        <img src={icon} alt="" className="mx-auto max-h-12" />
      </div>

      <div className="ml-6 w-64">
        <h2 className="font-semibold text-2xl leading-6 mt-3 tracking-tight">{name}</h2>
        <span>{ticker}</span>
      </div>

      <div className="w-64">
        <p className="text-grey font-semibold">Total Supplied</p>
        <p className="text-xl font-semibold leading-6">{formatSuppliedAmount(totalSupplied)}</p>
        <p>{formatSuppliedAmountPrice(totalSuppliedPrice)}</p>
      </div>

      <div className="w-64">
        <p className="text-grey font-semibold">Supply APY</p>
        <p className="text-xl font-semibold leading-6">1.23%</p>
      </div>

      {isPoor ? (
        <div className="tooltip" data-tip={!wallet ? 'Connect a wallet first' : 'Not enough funds'}>
          <Button disabled={true} onClick={() => {}}>
            Deposit
          </Button>
        </div>
      ) : (
        <Button onClick={openModal}>Deposit</Button>
      )}
      <DepositModal modalId={modalId} onClose={closeModal} currency={currency} />
    </Card>
  );
};
