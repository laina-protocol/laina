import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export interface ButtonProps {
  onClick: () => void;
  className?: string;
}

const buttonStyle = 'bg-black font-semibold text-white rounded-full px-8 py-2 hover:bg-grey-dark transition';

export const Button = ({ onClick, className = '', children }: PropsWithChildren<ButtonProps>) => (
  <button type="button" onClick={onClick} className={`${buttonStyle} ${className}`}>
    {children}
  </button>
);

export interface LinkButtonProps {
  to: string;
  className?: string;
}

export const LinkButton = ({ to, className = '', children }: PropsWithChildren<LinkButtonProps>) => (
  <Link to={to} className={`${buttonStyle} ${className}`}>
    {children}
  </Link>
);

export const NativeLinkButton = ({ to, className = '', children }: PropsWithChildren<LinkButtonProps>) => (
  <a href={to} target="_blank" className={`${buttonStyle} ${className}`} rel="noreferrer">
    {children}
  </a>
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
    className={`font-semibold px-6 py-1.5 rounded-full hover:text-black transition ${selected ? 'bg-white text-black' : 'text-white'}`}
    to={to}
  >
    {children}
  </Link>
);
