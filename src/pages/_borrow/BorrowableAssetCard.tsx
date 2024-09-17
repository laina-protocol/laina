import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { CURRENCIES, type Currency } from 'src/currencies';
import { useWallet } from 'src/stellar-wallet';
import { BorrowModal } from './BorrowModal';

interface BorrowableAssetCardProps {
  currency: Currency;
}

export const BorrowableAssetCard = ({ currency }: BorrowableAssetCardProps) => {
  const { icon, name, symbol } = currency;

  const modalId = `borrow-modal-${symbol}`

  const { wallet, balances } = useWallet();

  // Collateral is the other supported currency for now.
  const collateral = symbol === 'XLM'
    ? CURRENCIES[1] // USDC
    : CURRENCIES[0]; // XLM

  const collateralBalance = balances[collateral.symbol];

  const borrowDisabled = !wallet || !collateralBalance;

  const openModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.showModal();
  };

  const closeModal = () => {
    const modalEl = document.getElementById(modalId) as HTMLDialogElement;
    modalEl.close();
  };

  return (
    <Card className="mb-6 p-6 flex flex-row items-center">
      <img src={icon} alt="" className="w-12" />

      <div className="ml-6 w-64">
        <h2 className="font-semibold text-2xl leading-6 mt-3 tracking-tight">{name}</h2>
        <span>{symbol}</span>
      </div>

      <div className="w-64">
        <p className="text-grey font-semibold">Total Borrowed</p>
        <p className="text-xl font-semibold leading-6">1.82M</p>
        <p>$196.10K</p>
      </div>

      <div className="w-64">
        <p className="text-grey font-semibold">Borrow APY</p>
        <p className="text-xl font-semibold leading-6">1.61%</p>
      </div>

      {borrowDisabled ? (
        <div className="tooltip" data-tip={!wallet ? 'Connect a wallet first' : 'Not enough funds for collateral'}>
          <Button disabled={true} onClick={() => { }}>
            Borrow
          </Button>
        </div>
      ) : (
        <Button onClick={openModal}>Borrow</Button>
      )}
      <BorrowModal modalId={modalId} onClose={closeModal} currency={currency} collateral={collateral} />
    </Card>
  );
};
