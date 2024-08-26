import { CURRENCIES } from 'src/currencies';
import { LendableAssetCard } from './LendableAssetCard';

const LendPage = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Lend Assets</h1>
      {CURRENCIES.map((currency) => (
        <LendableAssetCard currency={currency} key={currency.symbol} />
      ))}
    </>
  );
};

export default LendPage;
