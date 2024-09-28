import { type PropsWithChildren, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from 'src/stellar-wallet';
import logo from '/public/laina_v3_shrinked.png';

export default function Nav() {
  const { pathname } = useLocation();
  const { createConnectWalletButton } = useWallet();

  const buttonWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    buttonWrapperRef.current && createConnectWalletButton(buttonWrapperRef.current);
  }, [createConnectWalletButton]);

  const isIndex = pathname === '/';

  return (
    <nav
      className={`relative mx-auto flex justify-between items-center pt-12 pb-6 px-4 max-w-full ${isIndex ? 'w-[74rem]' : 'w-[64rem]'}`}
    >
      <div>
        <Link to="/">
          <img src={logo.src} alt="logo" className="w-32" />
        </Link>
      </div>

      <div className="hidden md:flex flex-row ml-auto mr-14">
        <LinkItem to="/laina">Laina</LinkItem>
        <LinkItem to="/lend">Lend</LinkItem>
        <LinkItem to="/borrow">Borrow</LinkItem>
        <LinkItem to="/liquidate">Liquidate</LinkItem>
      </div>

      <div ref={buttonWrapperRef} />
    </nav>
  );
}

const LinkItem = ({ to, children }: PropsWithChildren<{ to: string }>) => {
  const { pathname } = useLocation();
  const selected = pathname === to;

  return (
    <Link
      to={to}
      className={`text-base font-semibold p-4 hover:underline ${selected ? 'underline decoration-2' : ''}}`}
    >
      {children}
    </Link>
  );
};
