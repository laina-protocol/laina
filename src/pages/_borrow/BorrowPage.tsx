import { CURRENCY_BINDINGS } from 'src/currency-bindings';
import { BorrowableAssetCard } from './BorrowableAssetCard';

const BorrowPage = () => (
  <div className="mt-14">
    <h1 className="text-3xl font-semibold mb-8 tracking-tight">Borrow Assets</h1>
    {CURRENCY_BINDINGS.map((currency) => (
      <BorrowableAssetCard key={currency.ticker} currency={currency} />
    ))}
  </div>
);

export default BorrowPage;
