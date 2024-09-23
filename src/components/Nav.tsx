import { type PropsWithChildren, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from 'src/stellar-wallet';
import logo from '/public/laina_v3_shrinked.png';
import { SelectButtonWrapper, SelectLinkButton } from './Button';

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
      className={`relative mx-auto mb-12 flex justify-between items-center pt-12 pb-6 px-4 max-w-screen ${isIndex ? 'w-[74rem]' : 'w-[64rem]'}`}
    >
      <div>
        <Link to="/">
          <img src={logo.src} alt="logo" width={200} />
        </Link>
      </div>

      {isIndex ? <LinkCluster /> : <SelectButtonCluster pathname={pathname} />}

      <div ref={buttonWrapperRef} />
    </nav>
  );
}

const LinkCluster = () => (
  <div className="flex flex-row ml-auto mr-14">
    <LinkItem to="/lend">Lend</LinkItem>
    <LinkItem to="/borrow">Borrow</LinkItem>
    <LinkItem to="/liquidate">Liquidate</LinkItem>
  </div>
);

const LinkItem = ({ to, children }: PropsWithChildren<{ to: string }>) => (
  <Link to={to} className="text-base font-semibold p-4 hover:underline">
    {children}
  </Link>
);

const SelectButtonCluster = ({ pathname }: { pathname: string }) => (
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
);
