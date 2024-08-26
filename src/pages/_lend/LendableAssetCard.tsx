import { Button } from '@components/Button';
import { Card } from '@components/Card';
import type { Currency } from 'src/currencies';
import { useWallet } from 'src/stellar-wallet';

export interface LendableAssetCardProps {
  currency: Currency;
}

export const LendableAssetCard = ({ currency }: LendableAssetCardProps) => {
  const { icon, name, symbol, loanPoolContract } = currency;
  const { wallet, signTransaction } = useWallet();

  const handleDepositClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    loanPoolContract.options.publicKey = wallet.address;

    const amount = BigInt(1000000);
    const tx = await loanPoolContract.deposit({ user: wallet.address, amount });

    try {
      const { result } = await tx.signAndSend({ signTransaction });
      alert(`Deposit successful, result: ${result}`);
    } catch (err) {
      alert(`Error depositing: ${JSON.stringify(err)}`);
    }
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
        <p className="text-xl font-bold leading-6">5.82M</p>
        <p>$5.82M</p>
      </div>

      <div className="w-64">
        <p className="text-grey">Supply APY</p>
        <p className="text-xl font-bold leading-6">12.34%</p>
      </div>

      {wallet && <Button onClick={handleDepositClick}>Deposit</Button>}
    </Card>
  );
};
