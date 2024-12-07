import { isNil } from 'ramda';
import { useState } from 'react';

import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { useWallet } from '@contexts/wallet-context';
import { contractClient as loanManagerClient } from '@contracts/loan_manager';
import { formatAmount, toDollarsFormatted } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';

export interface AssetsModalProps {
  modalId: string;
  onClose: () => void;
}

const LoansModal = ({ modalId, onClose }: AssetsModalProps) => {
  const { positions } = useWallet();
  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[800px] flex flex-col">
        <h3 className="text-xl font-bold tracking-tight mb-8">My Loans</h3>
        <table className="table">
          <thead className="text-base text-grey">
            <tr>
              <th className="w-20" />
              <th>Asset</th>
              <th>Amount</th>
              <th>Value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Object.entries(positions).map(([ticker, { liabilities }]) => (
              <TableRow key={ticker} ticker={ticker as SupportedCurrency} liabilities={liabilities} />
            ))}
          </tbody>
        </table>
        <div className="modal-action">
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
};

interface TableRowProps {
  liabilities: bigint;
  ticker: SupportedCurrency;
}

const TableRow = ({ liabilities, ticker }: TableRowProps) => {
  const { wallet, prices, signTransaction, refetchBalances } = useWallet();
  const [isRepaying, setIsRepaying] = useState(false);

  if (liabilities === 0n) return null;

  const { icon, name } = CURRENCY_BINDINGS[ticker];
  const price = prices?.[ticker];

  const handleWithdrawClick = async () => {
    if (!wallet) return;

    setIsRepaying(true);

    loanManagerClient.options.publicKey = wallet.address;

    const tx = await loanManagerClient.repay({ user: wallet.address, amount: liabilities });
    try {
      const { result } = await tx.signAndSend({ signTransaction });
      alert(`Repay successful, result: ${result}`);
    } catch (err) {
      console.error('Error repaying', err);
      alert('Error repaying');
    }
    refetchBalances();
    setIsRepaying(false);
  };

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
      <td className="text-lg font-semibold">{formatAmount(liabilities)}</td>
      <td className="text-lg font-semibold">{!isNil(price) && toDollarsFormatted(price, liabilities)}</td>
      <td>
        {isRepaying ? (
          <Button disabled>
            <Loading />
            Repaying
          </Button>
        ) : (
          <Button onClick={handleWithdrawClick}>Repay</Button>
        )}
      </td>
    </tr>
  );
};

export default LoansModal;
