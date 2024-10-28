import type { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface CardProps {
  className?: string;
  bgColor?: 'white' | 'black';
  links?: LinkProps[];
}

export interface LinkProps {
  to: string;
  label: string;
}

export const Card = ({ bgColor = 'white', className = '', links, children }: PropsWithChildren<CardProps>) => (
  <div
    className={`rounded shadow border-2 ${bgColor === 'white' ? 'bg-white border-grey-light' : 'bg-black border-black'} ${className}`}
  >
    {links && (
      <div className="px-12 py-2 border-b-2 border-grey-light flex flex-row mb-8">
        {links.map(({ to, label }) => (
          <LinkItem to={to} key={to}>
            {label}
          </LinkItem>
        ))}
      </div>
    )}
    {children}
  </div>
);

const LinkItem = ({ to, children }: PropsWithChildren<{ to: string }>) => {
  const { pathname } = useLocation();
  const selected = pathname === to;

  return (
    <Link
      to={to}
      className={`text-base rounded font-semibold px-4 mr-2 py-2 transition hover:text-black ${selected ? 'text-black bg-grey-light' : 'text-grey'}`}
    >
      {children}
    </Link>
  );
};
