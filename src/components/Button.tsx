import type { PropsWithChildren } from 'react';

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
  href: string;
  selected: boolean;
}

export const SelectLinkButton = ({ href, selected, children }: PropsWithChildren<SelectLinkButtonProps>) => (
  <a
    className={`font-bold px-6 py-1.5 rounded-full hover:text-black transition ${selected ? 'bg-white text-black' : 'text-white'}`}
    href={href}
  >
    {children}
  </a>
);
