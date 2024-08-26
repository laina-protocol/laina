import StellarIcon from '../../images/Stellar_Symbol.png';
import USDCIcon from '../../images/usdc.svg';
import { LendableAssetCard } from './LendableAssetCard';

import XLMPoolContract from '@contracts/loan_pool';
import USDCPoolContract from '@contracts/usdc_pool';

const currencies = [
  {
    name: 'Stellar Lumen',
    symbol: 'XLM',
    icon: StellarIcon.src,
    contractClient: XLMPoolContract,
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: USDCIcon.src,
    contractClient: USDCPoolContract,
  },
];

const LendPage = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Lend Assets</h1>
      {currencies.map(({ name, symbol, icon, contractClient }) => (
        <LendableAssetCard key={name} name={name} symbol={symbol} icon={icon} contractClient={contractClient} />
      ))}
    </>
  );
};

export default LendPage;
