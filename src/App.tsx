import React from 'react';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';

import Nav from '@components/Nav';
import BorrowPage from '@pages/borrow/BorrowPage';
import LandingPage from '@pages/landing/LandingPage';
import LendPage from '@pages/lend/LendPage';
import LiquidatePage from '@pages/liquidate/LiquidatePage';

const PageWrapper = () => (
  <>
    <Nav />
    <main className="max-w-screen w-256">
      <Outlet />
    </main>
  </>
);

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
      <RouterProvider router={router} />
    </React.StrictMode>
  );
};

export default App;
