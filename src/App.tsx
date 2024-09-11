import React from 'react';
import { Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';

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
    <body className={`font-sans min-h-screen ${isIndex ? 'bg-white' : 'bg-grey-light'}`}>
      < Nav />
      <main className="max-w-screen w-256">
        <Outlet />
      </main>
    </body >
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
