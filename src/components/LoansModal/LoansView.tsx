import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { usePools } from '@contexts/pool-context';
import { useWallet } from '@contexts/wallet-context';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { formatAPR, formatAmount, toDollarsFormatted } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { useEffect, useState } from 'react';
import { CURRENCY_BINDINGS, CURRENCY_BINDINGS_BY_ADDRESS, type PoolAddress } from 'src/currency-bindings';

interface LoansViewProps {
  onClose: () => void;
  onRepay: (ticker: SupportedCurrency) => void;
}

const LoansView = ({ onClose, onRepay }: LoansViewProps) => {
  const loan = useLoan();
  return (
    <>
      <h3 className="text-xl font-bold tracking-tight mb-8">My Loans</h3>
      <table className="table">
        <thead className="text-base text-grey">
          <tr>
            <th className="w-20" />
            <th>Asset</th>
            <th>Collateral</th>
            <th>APR</th>
            <th />
          </tr>
        </thead>
        <tbody>{loan ? <TableRow loan={loan} onRepay={onRepay} /> : <Loading />}</tbody>
      </table>
      <div className="modal-action">
        <Button variant="ghost" className="ml-auto" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
};

interface Loan {
  borrower: string;
  borrowedAmount: bigint;
  borrowedTicker: SupportedCurrency;
  collateralAmount: bigint;
  collateralTicker: SupportedCurrency;
  healthFactor: bigint;
  unpaidInterest: bigint;
}

const useLoan = (): Loan | null => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const { wallet } = useWallet();

  useEffect(() => {
    const getLoan = async () => {
      if (!wallet) return;
      loanManagerClient.options.publicKey = wallet.address;
      const { result } = await loanManagerClient.get_loan({ addr: wallet.address });
      setLoan({
        borrower: result.borrower,
        borrowedAmount: result.borrowed_amount,
        borrowedTicker: CURRENCY_BINDINGS_BY_ADDRESS[result.borrowed_from as PoolAddress].ticker,
        collateralAmount: result.collateral_amount,
        collateralTicker: CURRENCY_BINDINGS_BY_ADDRESS[result.collateral_from as PoolAddress].ticker,
        healthFactor: result.health_factor,
        unpaidInterest: result.unpaid_interest,
      });
    };
    getLoan();
  }, [wallet]);

  return loan;
};

interface TableRowProps {
  loan: Loan;
  onRepay: (ticker: SupportedCurrency) => void;
}

const TableRow = ({ loan, onRepay }: TableRowProps) => {
  const { borrowedAmount, unpaidInterest, collateralAmount, borrowedTicker, collateralTicker } = loan;
  const { prices, pools } = usePools();

  const loanTotal = borrowedAmount + unpaidInterest;

  const loanPrice = prices?.[borrowedTicker];
  const collateralPrice = prices?.[collateralTicker];

  const pool = pools?.[borrowedTicker];

  const handleRepayClicked = () => onRepay(borrowedTicker);

  return (
    <tr key={borrowedTicker}>
      <td>
        <div className="h-12 w-12">
          <img src={CURRENCY_BINDINGS[borrowedTicker].icon} alt="" />
        </div>
      </td>
      <td>
        <div>
          <p className="text-lg font-semibold leading-5">
            {formatAmount(loanTotal)}
            {borrowedTicker}
          </p>
          <p className="text-base">{loanPrice && toDollarsFormatted(loanPrice, loanTotal)}</p>
        </div>
      </td>
      <td>
        <p className="text-lg font-semibold leading-5">
          {formatAmount(collateralAmount)}
          {collateralTicker}
        </p>
        <p className="text-base">{collateralPrice && toDollarsFormatted(collateralPrice, collateralAmount)}</p>
      </td>
      <td className="text-lg font-semibold">{pool ? formatAPR(pool.annualInterestRate) : null}</td>
      <td>
        <Button onClick={handleRepayClicked}>Repay</Button>
      </td>
    </tr>
  );
};

export default LoansView;
