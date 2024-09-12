import { CURRENCIES } from 'src/currencies';
import { LendableAssetCard } from './LendableAssetCard';

const LendPage = () => {
  return (
    <>
      <h1 className="text-3xl font-semibold mb-8 tracking-tight">Lend Assets</h1>
      {CURRENCIES.map((currency) => (
        <LendableAssetCard currency={currency} key={currency.symbol} />
      ))}
    </>
  );
};

export default LendPage;
