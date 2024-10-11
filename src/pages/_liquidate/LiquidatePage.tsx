import { Card } from '@components/Card';
import WalletCard from '@components/WalletCard/WalletCard';

const links = [
  { to: '/lend', label: 'Lend' },
  { to: '/borrow', label: 'Borrow' },
  { to: '/liquidate', label: 'Liquidate' },
];

const LiquidatePage = () => (
  <div className="mt-14">
    <WalletCard />
    <Card links={links}>
      <div className="px-12 pb-12 pt-4">
        <h1 className="text-2xl font-semibold mb-8 tracking-tight">Available for Liquidation</h1>
        <p>Coming soon!</p>
      </div>
    </Card>
  </div>
);

export default LiquidatePage;
