import { Card } from '@components/Card';
import { Table } from '@components/Table';
import WalletCard from '@components/WalletCard/WalletCard';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';
import { BorrowableAsset } from './BorrowableAsset';

const links = [
  { to: '/lend', label: 'Lend' },
  { to: '/borrow', label: 'Borrow' },
  { to: '/liquidate', label: 'Liquidate' },
];

const BorrowPage = () => (
  <div className="my-14">
    <WalletCard />
    <Card links={links}>
      <div className="px-12 pb-12 pt-4">
        <h1 className="text-2xl font-semibold mb-4 tracking-tight">Borrow Assets</h1>
        <Table headers={['Asset', null, 'Available Balance', 'Borrow APY', null]}>
          {CURRENCY_BINDINGS.map((currency) => (
            <BorrowableAsset key={currency.ticker} currency={currency} />
          ))}
        </Table>
      </div>
    </Card>
  </div>
);

export default BorrowPage;
