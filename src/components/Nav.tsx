import { Link, useLocation } from 'react-router-dom';
import logo from '/public/laina_v3_shrinked.png';
import { SelectButtonWrapper, SelectLinkButton } from './Button';

export default function Nav() {
  const { pathname } = useLocation();

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

      <div className="bg-black text-white px-8 py-2 rounded-full">
        {/* biome-ignore lint: TODO: connect wallet */}
        <a href="#">Connect Wallet</a>
      </div>
    </nav>
  );
}
