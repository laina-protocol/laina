import { Link, useLocation } from 'react-router-dom';
import { useWallet } from 'src/stellar-wallet';
import logo from '/public/laina_v3_shrinked.png';
import { Button, SelectButtonWrapper, SelectLinkButton } from './Button';

export default function Nav() {
  const { pathname } = useLocation();
  const { wallet, openConnectWalletModal } = useWallet();

  return (
    <nav className="relative max-w-screen-lg mx-auto mb-12 flex justify-between items-center pt-12 pb-6">
      <div>
        <Link to="/">
          <img src={logo.src} alt="logo" width={200} />
        </Link>
      </div>

      <SelectButtonWrapper>
        <SelectLinkButton to="/lend" selected={pathname === '/lend'}>
          Lend
        </SelectLinkButton>
        <SelectLinkButton to="/borrow" selected={pathname === '/borrow'}>
          Borrow
        </SelectLinkButton>
        <SelectLinkButton to="/liquidate" selected={pathname === '/liquidate'}>
          Liquidate
        </SelectLinkButton>
      </SelectButtonWrapper>

      {wallet ? (
        <div>
          <p className="text-sm">Signed in as</p>
          <p className="font-bold">{wallet.displayName}</p>
        </div>
      ) : (
        <Button onClick={openConnectWalletModal}>Connect Wallet</Button>
      )}
    </nav>
  );
}
