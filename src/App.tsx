import React from 'react';
import { Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';

import Footer from '@components/Footer';
import Nav from '@components/Nav';
import BorrowPage from '@pages/_borrow/BorrowPage';
import LandingPage from '@pages/_landing/LandingPage';
import LendPage from '@pages/_lend/LendPage';
import LiquidatePage from '@pages/_liquidate/LiquidatePage';
import { WalletProvider } from './stellar-wallet';

const PageWrapper = () => {
  const { pathname } = useLocation();

  const isIndex = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className={`max-w-screen flex-1 ${isIndex ? 'w-[74rem]' : 'w-256'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const router = createBrowserRouter([
  {
    element: <PageWrapper />,
    children: [
      { path: '', element: <LandingPage /> },
      { path: 'lend', element: <LendPage /> },
      { path: 'borrow', element: <BorrowPage /> },
      { path: 'liquidate', element: <LiquidatePage /> },
    ],
  },
]);

const App = () => {
  return (
    <React.StrictMode>
      <WalletProvider>
        <RouterProvider router={router} />
      </WalletProvider>
    </React.StrictMode>
  );
};

export default App;
