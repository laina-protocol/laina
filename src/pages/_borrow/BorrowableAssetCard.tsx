import { Button } from '@components/Button';
import { Card } from '@components/Card';
import loanManagerContract from '@contracts/loan_manager';
import type { Currency } from 'src/currencies';
import { useWallet } from 'src/stellar-wallet';

// Temporary hack to use XLM pool for all loans and collaterals.
const XLM_LOAN_POOL_ID = 'CCME5C2PJFCWGW5O5MCO4O6X3AUJLD6XHVH3ZJHC7SD7XK5OTPJRPHF7';

interface BorrowableAssetCardProps {
  currency: Currency;
}

export const BorrowableAssetCard = ({ currency }: BorrowableAssetCardProps) => {
  const { icon, name, symbol } = currency;

  const { wallet, signTransaction } = useWallet();

  const handleBorrowClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      loanManagerContract.options.publicKey = wallet.address;

      const tx = await loanManagerContract.initialize({
        user: wallet.address,
        borrowed: BigInt(10),
        borrowed_from: XLM_LOAN_POOL_ID,
        collateral: BigInt(1000),
        collateral_from: XLM_LOAN_POOL_ID,
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
        <h2 className="font-bold text-2xl leading-6 mt-3">{name}</h2>
        <span>{symbol}</span>
      </div>

      <div className="w-64">
        <p className="text-grey">Total Borrowed</p>
        <p className="text-xl font-bold leading-6">1.82M</p>
        <p>$196.10K</p>
      </div>

      <div className="w-64">
        <p className="text-grey">Borrow APY</p>
        <p className="text-xl font-bold leading-6">1.61%</p>
      </div>

      {wallet && <Button onClick={handleBorrowClick}>Borrow</Button>}
    </Card>
  );
};
