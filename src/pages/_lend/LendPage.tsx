import { CURRENCY_BINDINGS } from 'src/currency-bindings';
import { LendableAssetCard } from './LendableAssetCard';

const LendPage = () => {
  return (
    <>
      <h1 className="text-3xl font-semibold mb-8 tracking-tight">Lend Assets</h1>
      {CURRENCY_BINDINGS.map((currency) => (
        <LendableAssetCard currency={currency} key={currency.ticker} />
      ))}
    </>
  );
};

export default LendPage;
