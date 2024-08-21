import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export interface ButtonProps {
  onClick: () => void;
  className?: string;
}

export const Button = ({ onClick, className = '', children }: PropsWithChildren<ButtonProps>) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-black text-white rounded-full px-8 py-2 hover:bg-grey-dark transition ${className}`}
  >
    {children}
  </button>
);

export const SelectButtonWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex bg-grey p-1 gap-2 rounded-full">{children}</div>
);

export interface SelectLinkButtonProps {
  to: string;
  selected: boolean;
}

export const SelectLinkButton = ({ to, selected, children }: PropsWithChildren<SelectLinkButtonProps>) => (
  <Link
    className={`font-bold px-6 py-1.5 rounded-full hover:text-black transition ${selected ? 'bg-white text-black' : 'text-white'}`}
    to={to}
  >
    {children}
  </Link>
);
