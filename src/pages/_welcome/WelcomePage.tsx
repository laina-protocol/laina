import { LinkButton } from '@components/Button';
import { Card } from '@components/Card';
import WalletCard from '@components/WalletCard/WalletCard';
import BorrowIcon from '@images/icons/borrow.svg';
import LendIcon from '@images/icons/lend.svg';
import LiquidateIcon from '@images/icons/liquidate.svg';

const WelcomePage = () => (
  <div className="my-14">
    <WalletCard />
    <h1 className="text-3xl font-semibold mb-8 tracking-tight">Welcome to Laina</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <InfoCard
        icon={LendIcon.src}
        title="Deposit Assets"
        content="Deposit crypto assets for lending to earn interest."
        to="/lend"
        buttonText="Deposit"
      />
      <InfoCard
        icon={BorrowIcon.src}
        title="Borrow Assets"
        content="Loan assets from lending pools against a collateral you deposit."
        to="/borrow"
        buttonText="Borrow"
      />
      <InfoCard
        icon={LiquidateIcon.src}
        title="Liquidate Loans"
        content="Liquidate undercollateralized loans to earn rewards."
        to="/liquidate"
        buttonText="Liquidate"
      />
    </div>
  </div>
);

interface InfoCardProps {
  icon: string;
  title: string;
  content: string;
  to: string;
  buttonText: string;
}

const InfoCard = ({ icon, title, content, to, buttonText }: InfoCardProps) => (
  <Card className="w-full p-12 flex flex-col">
    <img className="w-20" src={icon} alt="" />
    <h3 className="text-2xl font-bold tracking-tight my-6">{title}</h3>
    <p className="mb-6">{content}</p>
    <LinkButton className="mt-auto w-fit" to={to}>
      {buttonText}
    </LinkButton>
  </Card>
);

export default WelcomePage;
