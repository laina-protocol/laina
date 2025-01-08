import { Button } from '@components/Button';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { formatAPY, formatAmount, toDollarsFormatted } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

export interface PositionsViewProps {
  onClose: () => void;
  onWithdraw: (ticker: SupportedCurrency) => void;
}

const PositionsView = ({ onClose, onWithdraw }: PositionsViewProps) => {
  const { positions } = useWallet();
  return (
    <>
      <h3 className="text-xl font-bold tracking-tight mb-8">My Assets</h3>
      <table className="table">
        <thead className="text-base text-grey">
          <tr>
            <th className="w-20" />
            <th>Asset</th>
            <th>Balance</th>
            <th>APY</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {Object.entries(positions).map(([ticker, { receivables }]) => (
            <TableRow
              key={ticker}
              ticker={ticker as SupportedCurrency}
              receivables={receivables}
              onWithdraw={onWithdraw}
            />
          ))}
        </tbody>
      </table>
      <div className="modal-action">
        <Button variant="ghost" className="ml-auto" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
};

interface TableRowProps {
  receivables: bigint;
  ticker: SupportedCurrency;
  onWithdraw: (ticker: SupportedCurrency) => void;
}

const TableRow = ({ receivables, ticker, onWithdraw }: TableRowProps) => {
  const { prices, pools } = usePools();

  if (receivables === 0n) return null;

  const { icon, name } = CURRENCY_BINDINGS[ticker];
  const price = prices?.[ticker];
  const pool = pools?.[ticker];

  if (!pool) {
    console.warn('PoolState is not loaded');
    return null;
  }

  const shares = (pool.totalShares / receivables) * pool.totalBalance;

  const handleWithdrawClick = () => onWithdraw(ticker);

  return (
    <tr key={ticker}>
      <td>
        <div className="h-12 w-12">
          <img src={icon} alt="" />
        </div>
      </td>
      <td>
        <div>
          <p className="text-lg font-semibold leading-5">{name}</p>
          <p className="text-base">{ticker}</p>
        </div>
      </td>
      <td>
        <p className="text-lg font-semibold leading-5">{formatAmount(shares)}</p>
        <p className="text-base">{!isNil(price) && toDollarsFormatted(price, shares)}</p>
      </td>
      <td className="text-lg font-semibold">{pool && formatAPY(pool.annualInterestRate)}</td>
      <td>
        <Button onClick={handleWithdrawClick}>Withdraw</Button>
      </td>
    </tr>
  );
};

export default PositionsView;
