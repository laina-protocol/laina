import { Button } from '@components/Button';
import { Card } from '@components/Card';

export interface LendableAssetCardProps {
  name: string;
  symbol: string;
  icon: string;
}

export const LendableAssetCard = ({ name, symbol, icon }: LendableAssetCardProps) => {
  const handleDepositClick = () => {
    console.log('deposit clicked');
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

      <Button onClick={handleDepositClick}>Deposit</Button>
    </Card>
  );
};
