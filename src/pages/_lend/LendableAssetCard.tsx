import { Button } from '@components/Button';
import { Card } from '@components/Card';
import loanManager from '@contracts/loan_manager';
import { useCallback, useEffect, useState } from 'react';
import type { Currency } from 'src/currencies';
import { useWallet } from 'src/stellar-wallet';

export interface LendableAssetCardProps {
  currency: Currency;
}

export const LendableAssetCard = ({ currency }: LendableAssetCardProps) => {
  const { icon, name, symbol, loanPoolContract } = currency;
  const { wallet, signTransaction } = useWallet();

  const [totalSupplied, setTotalSupplied] = useState<bigint | null>(null);
  const [totalSuppliedPrice, setTotalSuppliedPrice] = useState<bigint | null>(null);
  const [supplyAPY, setSupplyAPY] = useState('0.00%');

  const fetchAvailableContractBalance = useCallback(async () => {
    if (!loanPoolContract) return;

    try {
      const supplied = await loanPoolContract.get_contract_balance();
      const supplied_hi = BigInt(supplied.simulation.result.retval._value._attributes.hi);
      const supplied_lo = BigInt(supplied.simulation.result.retval._value._attributes.lo);
      const supplied_combined = (supplied_hi << BigInt(64)) + supplied_lo;

      setTotalSupplied(supplied_combined);
      // const apy = await loanPoolContract.getSupplyAPY();
      // setSupplyAPY(formatAPY(apy));
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }
  }, [loanPoolContract]); // Dependency on loanPoolContract

  const formatSuppliedAmount = useCallback((amount: bigint | null) => {
    if (amount === BigInt(0)) return '0';
    if (!amount) return 'Loading';

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
    if (!loanManager) return;

    try {
      const currentPrice = await loanManager.get_price({ token: currency.symbol });
      const price_hi = BigInt(currentPrice.simulation.result.retval._value._attributes.hi);
      const price_lo = BigInt(currentPrice.simulation.result.retval._value._attributes.lo);
      const price_combined = (price_hi << BigInt(64)) + price_lo;

      setTotalSuppliedPrice(price_combined);
    } catch (error) {
      console.error('Error fetchin price data:', error);
    }
  }, [currency.symbol]);

  const formatSuppliedAmountPrice = useCallback(
    (price: bigint | null) => {
      if (totalSupplied === BigInt(0)) return '$0';
      if (!totalSupplied || !price) return 'Loading';

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

  const handleDepositClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    loanPoolContract.options.publicKey = wallet.address;

    const amount = BigInt(2000000);
    const tx = await loanPoolContract.deposit({ user: wallet.address, amount });

    try {
      const { result } = await tx.signAndSend({ signTransaction });
      alert(`Deposit successful, result: ${result}`);
    } catch (err) {
      alert(`Error depositing: ${JSON.stringify(err)}`);
    }
    fetchAvailableContractBalance();
  };

  return (
    <Card className="mb-6 p-6 flex flex-row items-center">
      <img src={icon} alt="" className="w-12" />

      <div className="ml-6 w-64">
        <h2 className="font-bold text-2xl">{name}</h2>
        <span>{symbol}</span>
      </div>

      <div className="w-64">
        <p className="text-grey">Total Supplied</p>
        <p className="text-xl font-bold leading-6">{formatSuppliedAmount(totalSupplied)}</p>
        <p>{formatSuppliedAmountPrice(totalSuppliedPrice)}</p>
      </div>

      <div className="w-64">
        <p className="text-grey">Supply APY</p>
        <p className="text-xl font-bold leading-6">{supplyAPY}</p>
      </div>

      {wallet && <Button onClick={handleDepositClick}>Deposit</Button>}
    </Card>
  );
};
