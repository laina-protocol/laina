import { Button } from '@components/Button';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { formatAPR, formatAmount, toDollarsFormatted } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

interface LoansViewProps {
  onClose: () => void;
  onRepay: (ticker: SupportedCurrency) => void;
}

const LoansView = ({ onClose, onRepay }: LoansViewProps) => {
  const { positions } = useWallet();
  return (
    <>
      <h3 className="text-xl font-bold tracking-tight mb-8">My Loans</h3>
      <table className="table">
        <thead className="text-base text-grey">
          <tr>
            <th className="w-20" />
            <th>Asset</th>
            <th>Balance</th>
            <th>APR</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {Object.entries(positions).map(([ticker, { liabilities }]) => (
            <TableRow
              key={ticker}
              ticker={ticker as SupportedCurrency}
              liabilities={liabilities}
              onRepay={() => onRepay(ticker as SupportedCurrency)}
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
  liabilities: bigint;
  ticker: SupportedCurrency;
  onRepay: () => void;
}

const TableRow = ({ liabilities, ticker, onRepay }: TableRowProps) => {
  const { prices, pools } = usePools();

  if (liabilities === 0n) return null;

  const { icon, name } = CURRENCY_BINDINGS[ticker];
  const price = prices?.[ticker];
  const pool = pools?.[ticker];

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
        <p className="text-lg font-semibold leading-5">{formatAmount(liabilities)}</p>
        <p className="text-base">{!isNil(price) && toDollarsFormatted(price, liabilities)}</p>
      </td>
      <td className="text-lg font-semibold">{pool ? formatAPR(pool.annualInterestRate) : null}</td>
      <td>
        <Button onClick={onRepay}>Repay</Button>
      </td>
    </tr>
  );
};

export default LoansView;
