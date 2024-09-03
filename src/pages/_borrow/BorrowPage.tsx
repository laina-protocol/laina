import { CURRENCIES } from 'src/currencies';
import { BorrowableAssetCard } from './BorrowableAssetCard';

const BorrowPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-8">Borrow Assets</h1>
    {CURRENCIES.map((currency) => (
      <BorrowableAssetCard key={currency.symbol} currency={currency} />
    ))}
  </div>
);

export default BorrowPage;