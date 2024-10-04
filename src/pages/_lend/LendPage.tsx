import WalletCard from '@components/WalletCard/WalletCard';
import { CURRENCY_BINDINGS_ARR } from 'src/currency-bindings';
import { LendableAssetCard } from './LendableAssetCard';

const LendPage = () => {
  return (
    <div className="mt-14">
      <WalletCard />
      <h1 className="text-3xl font-semibold mb-8 tracking-tight">Lend Assets</h1>
      {CURRENCY_BINDINGS_ARR.map((currency) => (
        <LendableAssetCard currency={currency} key={currency.ticker} />
      ))}
    </div>
  );
};

export default LendPage;
