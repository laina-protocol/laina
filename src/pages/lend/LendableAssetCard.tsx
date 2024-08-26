import { Button } from '@components/Button';
import { Card } from '@components/Card';
import type XLMPoolContract from '@contracts/loan_pool';
import { useWallet } from 'src/stellar-wallet';

export interface LendableAssetCardProps {
  name: string;
  symbol: string;
  icon: string;
  contractClient: typeof XLMPoolContract; // All loan pool contract clients have the same API
}

export const LendableAssetCard = ({ name, symbol, icon, contractClient }: LendableAssetCardProps) => {
  const { wallet, signTransaction } = useWallet();

  const handleDepositClick = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    contractClient.options.publicKey = wallet.address;

    const amount = BigInt(1000000);
    const tx = await contractClient.deposit({ user: wallet.address, amount });

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
