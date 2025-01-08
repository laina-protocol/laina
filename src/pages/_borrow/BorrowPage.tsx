import { Card } from '@components/Card';
import { StellarExpertLink } from '@components/Link';
import { Table } from '@components/Table';
import WalletCard from '@components/WalletCard/WalletCard';
import { contractId } from '@contracts/loan_manager';
import { CURRENCY_BINDINGS_ARR } from 'src/currency-bindings';
import { BorrowableAsset } from './BorrowableAsset';

const links = [
  { to: '/lend', label: 'Lend' },
  { to: '/borrow', label: 'Borrow' },
];

const BorrowPage = () => (
  <div className="my-14">
    <WalletCard />
    <Card links={links}>
      <div className="px-12 pb-12 pt-4">
        <h1 className="text-2xl font-semibold mb-4 tracking-tight">Borrow Assets</h1>
        <Table headers={['Asset', null, 'Ticker', 'Balance', 'Borrow APY', null]}>
          {CURRENCY_BINDINGS_ARR.map((currency) => (
            <BorrowableAsset key={currency.ticker} currency={currency} />
          ))}
        </Table>
        <StellarExpertLink className="mt-3" contractId={contractId} text="View Loan Manager contract" />
      </div>
    </Card>
  </div>
);

export default BorrowPage;
