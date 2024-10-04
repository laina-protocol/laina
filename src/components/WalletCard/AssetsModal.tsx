import { Button } from '@components/Button';
import { Loading } from '@components/Loading';
import { formatAmount, toDollarsFormatted } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { useState } from 'react';
import { CURRENCY_BINDINGS } from 'src/currency-bindings';
import { useWallet } from 'src/stellar-wallet';

export interface AssetsModalProps {
  modalId: string;
  onClose: () => void;
}

const AssetsModal = ({ modalId, onClose }: AssetsModalProps) => {
  const { positions } = useWallet();
  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-full max-w-full md:w-[800px] flex flex-col">
        <h3 className="text-xl font-bold tracking-tight mb-8">My Assets</h3>
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
            {Object.entries(positions).map(([ticker, { receivables }]) => (
              <TableRow key={ticker} ticker={ticker as SupportedCurrency} receivables={receivables} />
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
  receivables: bigint;
  ticker: SupportedCurrency;
}

const TableRow = ({ receivables, ticker }: TableRowProps) => {
  const { wallet, prices, signTransaction, refetchBalances } = useWallet();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  if (receivables === 0n) return null;

  const { icon, name, contractClient } = CURRENCY_BINDINGS[ticker];
  const price = prices?.[ticker];

  const handleWithdrawClick = async () => {
    if (!wallet) return;

    setIsWithdrawing(true);

    contractClient.options.publicKey = wallet.address;

    const tx = await contractClient.withdraw({ user: wallet.address, amount: receivables });
    try {
      const { result } = await tx.signAndSend({ signTransaction });
      alert(`Withdraw successful, result: ${result}`);
    } catch (err) {
      console.error('Error withdrawing', err);
      alert('Error withdrawing');
    }
    refetchBalances();
    setIsWithdrawing(false);
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
      <td className="text-lg font-semibold">{formatAmount(receivables)}</td>
      <td className="text-lg font-semibold">{!isNil(price) && toDollarsFormatted(price, receivables)}</td>
      <td>
        {isWithdrawing ? (
          <Button disabled>
            <Loading />
            Withdrawing
          </Button>
        ) : (
          <Button onClick={handleWithdrawClick}>Withdraw</Button>
        )}
      </td>
    </tr>
  );
};

export default AssetsModal;
