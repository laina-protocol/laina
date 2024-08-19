import logo from '/public/laina_v3_shrinked.png';
import { SelectButtonWrapper, SelectLinkButton } from './Button';

interface NavProps {
  pathname: 'index' | 'lend' | 'borrow' | 'liquidate';
}

export default function Nav({ pathname }: NavProps) {
  return (
    <nav className="relative max-w-screen-lg mx-auto mb-12 flex justify-between items-center pt-12 pb-6">
      <div>
        <a href="/">
          <img src={logo.src} alt="logo" width={200} />
        </a>
      </div>

      <SelectButtonWrapper>
        <SelectLinkButton href="/lend" selected={pathname === 'lend'}>
          Lend
        </SelectLinkButton>
        <SelectLinkButton href="/borrow" selected={pathname === 'borrow'}>
          Borrow
        </SelectLinkButton>
        <SelectLinkButton href="/liquidate" selected={pathname === 'liquidate'}>
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
