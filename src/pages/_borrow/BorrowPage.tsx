import WalletCard from '@components/WalletCard/WalletCard';
import { CURRENCY_BINDINGS_ARR } from 'src/currency-bindings';
import { BorrowableAssetCard } from './BorrowableAssetCard';

const BorrowPage = () => (
  <div className="mt-14">
    <WalletCard />
    <h1 className="text-3xl font-semibold mb-8 tracking-tight">Borrow Assets</h1>
    {CURRENCY_BINDINGS_ARR.map((currency) => (
      <BorrowableAssetCard key={currency.ticker} currency={currency} />
    ))}
  </div>
);

export default BorrowPage;
