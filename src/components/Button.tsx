import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export interface ButtonProps {
  onClick?: () => void;
  color?: ButtonColor;
  disabled?: boolean;
  className?: string;
}

export type ButtonColor = 'black' | 'white' | 'ghost';

const buttonStyle = (color: ButtonColor) => {
  return `btn ${getButtonColor(color)} font-semibold text-base rounded-full px-8 py-2`;
};

const getButtonColor = (color: ButtonColor): string => {
  switch (color) {
    case 'black':
      return 'btn-neutral text-white';
    case 'white':
      return 'btn-primary';
    case 'ghost':
      return 'btn-ghost';
  }
};

export const Button = ({
  onClick,
  color = 'black',
  disabled = false,
  className = '',
  children,
}: PropsWithChildren<ButtonProps>) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`${buttonStyle(color)} ${className}`}>
    {children}
  </button>
);

export interface LinkButtonProps {
  to: string;
  color?: 'black' | 'white';
  className?: string;
}

export const LinkButton = ({ to, color = 'black', className = '', children }: PropsWithChildren<LinkButtonProps>) => (
  <Link to={to} className={`${buttonStyle(color)} ${className}`}>
    {children}
  </Link>
);

export const NativeLinkButton = ({
  to,
  color = 'black',
  className = '',
  children,
}: PropsWithChildren<LinkButtonProps>) => (
  <a href={to} target="_blank" className={`${buttonStyle(color)} ${className}`} rel="noreferrer">
    {children}
  </a>
);

export const SelectButtonWrapper = ({ className = '', children }: PropsWithChildren<{ className?: string }>) => (
  <div className={`flex bg-grey p-1 gap-2 rounded-full ${className}`}>{children}</div>
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
