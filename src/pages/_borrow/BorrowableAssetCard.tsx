import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { contractClient } from '@contracts/loan_manager';
import type { Currency } from 'src/currencies';
import { useWallet } from 'src/stellar-wallet';

interface BorrowableAssetCardProps {
  currency: Currency;
}

export const BorrowableAssetCard = ({ currency }: BorrowableAssetCardProps) => {
  const { icon, name, symbol, contractId } = currency;

  const { wallet, signTransaction } = useWallet();

  const handleBorrowClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      contractClient.options.publicKey = wallet.address;

      const tx = await contractClient.initialize({
        user: wallet.address,
        borrowed: BigInt(10),
        borrowed_from: contractId,
        collateral: BigInt(1000),
        collateral_from: contractId,
      });
      await tx.signAndSend({ signTransaction });
      alert('Loan created succesfully!');
    } catch (err) {
      console.error('Error borrowing', err);
      alert('Error borrowing');
    }
  };

  return (
    <Card className="mb-6 p-6 flex flex-row items-center">
      <img src={icon} alt="" className="w-12" />

      <div className="ml-6 w-64">
        <h2 className="font-semibold text-2xl leading-6 mt-3 tracking-tight">{name}</h2>
        <span>{symbol}</span>
      </div>

      <div className="w-64">
        <p className="text-grey font-semibold">Total Borrowed</p>
        <p className="text-xl font-semibold leading-6">1.82M</p>
        <p>$196.10K</p>
      </div>

      <div className="w-64">
        <p className="text-grey font-semibold">Borrow APY</p>
        <p className="text-xl font-semibold leading-6">1.61%</p>
      </div>

      {wallet && <Button onClick={handleBorrowClick}>Borrow</Button>}
    </Card>
  );
};
