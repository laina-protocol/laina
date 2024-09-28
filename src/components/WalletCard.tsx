import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { CURRENCY_BINDINGS, type CurrencyBinding } from 'src/currency-bindings';
import { type Positions, useWallet } from 'src/stellar-wallet';
import { formatAmount, formatDollarPrice } from 'src/util/formatting';
import { Button } from './Button';
import { Card } from './Card';
import Identicon from './Identicon';

const ASSET_MODAL_ID = 'assets-modal';
const LOANS_MODAL_ID = 'loans-modal';

const WalletCard = () => {
  const { wallet, positions } = useWallet();

  const hasReceivables = Object.values(positions).some(({ receivables }) => receivables > 0n);
  const hasLiabilities = Object.values(positions).some(({ liabilities }) => liabilities > 0n);

  if (!wallet) {
    return (
      <Card bgColor="black" className="text-white p-6 mb-12 min-h-36 flex flex-col justify-center">
        <h2 className="text-xl font-semibold">My Account</h2>
        <p className="mt-2">To view your assets, connect a wallet first.</p>
      </Card>
    );
  }

  const openAssetModal = () => {
    const modalEl = document.getElementById(ASSET_MODAL_ID) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeAssetModal = () => {
    const modalEl = document.getElementById(ASSET_MODAL_ID) as HTMLDialogElement;
    modalEl.close();
  };

  return (
    <>
      <Card bgColor="black" className="text-white p-6 mb-12 flex flex-row flex-wrap justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">My Account</h2>
          <div className="my-6 flex flex-row items-center">
            <Identicon address={wallet.address} />
            <div className="ml-9">
              <p className="text-xl">{wallet.displayName}</p>
              {/* TODO: Get wallet type from the kit. */}
              <p className="text-grey leading-tight">Freighter</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-9 my-auto">
          {hasReceivables ? (
            <Button color="white" onClick={openAssetModal}>
              View Assets
            </Button>
          ) : (
            <p>You haven't deposited any assets.</p>
          )}
          {hasLiabilities ? <Button color="white">View Loans</Button> : <p>You haven't borrowed any assets.</p>}
        </div>
      </Card>
      <AssetsModal onClose={closeAssetModal} />
    </>
  );
};

interface AssetModalProps {
  onClose: () => void;
}

const AssetsModal = ({ onClose }: AssetModalProps) => {
  const { positions } = useWallet();
  return (
    <dialog id={ASSET_MODAL_ID} className="modal">
      <div className="modal-box w-full max-w-full md:w-[700px] flex flex-col">
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
          <Button className="btn-ghost ml-auto" onClick={onClose}>
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
  const { prices } = useWallet();

  if (receivables === 0n) return null;

  const { icon, name } = CURRENCY_BINDINGS.find((b) => b.ticker === ticker) as CurrencyBinding;
  const price = prices?.[ticker];

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
      <td className="text-lg font-semibold">{!isNil(price) && formatDollarPrice(price, receivables)}</td>
      <td>
        <Button>Withdraw</Button>
      </td>
    </tr>
  );
};

export default WalletCard;
