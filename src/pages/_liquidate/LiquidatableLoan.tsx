import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import * as LoanManager from '@contracts/loan_manager';

export const LiquidatableLoan = ({ currency }: BorrowableAssetCardProps) => {
  return (
    <tr className="border-none text-base h-[6.5rem]">
      <td>
        <p className="text-xl font-semibold leading-6">L000123</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">moro</p>
        <p>moro</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">moro</p>
        <p>moro</p>
      </td>

      <td>
        <p className="text-xl font-semibold leading-6">5.00%</p>
      </td>

      <td className="pr-0">
        <Button disabled={false} onClick={() => {}}>
          Details
        </Button>
      </td>
    </tr>
  );
};
