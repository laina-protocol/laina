import StellarIcon from '../../images/Stellar_Symbol.png';
import USDCIcon from '../../images/usdc.svg';
import { LendableAssetCard } from './LendableAssetCard';

const currencies = [
  {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: USDCIcon.src,
  },
  {
    name: 'Stellar Lumen',
    symbol: 'XLM',
    icon: StellarIcon.src,
  },
];

const LendPage = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Lend Assets</h1>
      {currencies.map(({ name, symbol, icon }) => (
        <LendableAssetCard key={name} name={name} symbol={symbol} icon={icon} />
      ))}
    </>
  );
};

export default LendPage;
