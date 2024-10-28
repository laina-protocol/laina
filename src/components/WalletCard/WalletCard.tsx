import { Loading } from '@components/Loading';
import { formatCentAmount, toCents } from '@lib/formatting';
import type { SupportedCurrency } from 'currencies';
import { isNil } from 'ramda';
import { type PositionsRecord, type PriceRecord, useWallet } from 'src/stellar-wallet';
import { Button } from '../Button';
import { Card } from '../Card';
import Identicon from '../Identicon';
import AssetsModal from './AssetsModal';
import LoansModal from './LoansModal';

const ASSET_MODAL_ID = 'assets-modal';
const LOANS_MODAL_ID = 'loans-modal';

const WalletCard = () => {
  const { wallet, openConnectWalletModal, positions, prices } = useWallet();

  if (!wallet) {
    return (
      <Card bgColor="black" className="text-white p-12 mb-12 min-h-36 flex flex-col justify-center items-start">
        <h2 className="text-xl font-semibold">My Account</h2>
        <p className="mt-2 mb-6">To view your assets, connect a wallet first.</p>
        <Button variant="white" onClick={openConnectWalletModal}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  const values = prices ? calculateTotalValue(prices, positions) : null;

  if (isNil(values)) {
    return (
      <Card bgColor="black" className="text-white p-12 mb-12 flex flex-row flex-wrap justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">My Account</h2>
          <div className="my-6 flex flex-row items-center">
            <Identicon address={wallet.address} />
            <div className="ml-9">
              <p className="text-xl">{wallet.displayName}</p>
              <p className="text-grey leading-tight">{wallet.name}</p>
            </div>
          </div>
        </div>
        <span className="flex flex-row items-center">
          <Loading size="lg" className="mr-4" />
          <p>Loading balance</p>
        </span>
      </Card>
    );
  }

  const hasReceivables = values.receivablesCents > 0n;
  const hasLiabilities = values.liabilitiesCents > 0n;

  const openAssetModal = () => {
    const modalEl = document.getElementById(ASSET_MODAL_ID) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeAssetModal = () => {
    const modalEl = document.getElementById(ASSET_MODAL_ID) as HTMLDialogElement;
    modalEl.close();
  };

  const openLoansModal = () => {
    const modalEl = document.getElementById(LOANS_MODAL_ID) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeLoansModal = () => {
    const modalEl = document.getElementById(LOANS_MODAL_ID) as HTMLDialogElement;
    modalEl.close();
  };

  return (
    <>
      <Card bgColor="black" className="text-white p-12 mb-12 flex flex-row flex-wrap justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">My Account</h2>
          <div className="my-6 flex flex-row items-center">
            <Identicon address={wallet.address} />
            <div className="ml-9">
              <p className="text-xl">{wallet.displayName}</p>
              <p className="text-grey leading-tight">{wallet.name}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-9 my-auto items-end">
          {hasReceivables ? (
            <div className="flex flex-row">
              <div className="w-40 mr-10">
                <p className="text-grey">Total deposited</p>
                <p className="text-xl leading-5">{formatCentAmount(values.receivablesCents)}</p>
              </div>
              <Button variant="white" className="w-44" onClick={openAssetModal}>
                View Assets
              </Button>
            </div>
          ) : (
            <p>You haven't deposited any assets.</p>
          )}
          {hasLiabilities ? (
            <div className="flex flex-row">
              <div className="w-40 mr-10">
                <p className="text-grey">Total borrowed</p>
                <p className="text-xl leading-5">{formatCentAmount(values.liabilitiesCents)}</p>
              </div>
              <Button variant="white" className="w-44" onClick={openLoansModal}>
                View Loans
              </Button>
            </div>
          ) : (
            <p>You haven't borrowed any assets.</p>
          )}
        </div>
      </Card>
      <AssetsModal modalId={ASSET_MODAL_ID} onClose={closeAssetModal} />
      <LoansModal modalId={LOANS_MODAL_ID} onClose={closeLoansModal} />
    </>
  );
};

type ValueObj = {
  receivablesCents: bigint;
  liabilitiesCents: bigint;
};

const calculateTotalValue = (prices: PriceRecord, positions: PositionsRecord): ValueObj => {
  return Object.entries(positions).reduce(
    (acc, [ticker, { receivables, liabilities }]) => {
      const price = prices[ticker as SupportedCurrency];
      acc.receivablesCents += toCents(price, receivables);
      acc.liabilitiesCents += toCents(price, liabilities);
      return acc;
    },
    {
      receivablesCents: 0n,
      liabilitiesCents: 0n,
    } as ValueObj,
  );
};

export default WalletCard;
