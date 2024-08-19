import type { PropsWithChildren } from 'react';

export const SelectButtonWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex bg-grey p-1 gap-2 rounded-full">{children}</div>
);

export interface SelectLinkButtonProps {
  href: string;
  selected: boolean;
}

export const SelectLinkButton = ({ href, selected, children }: PropsWithChildren<SelectLinkButtonProps>) => (
  <a className={`font-bold px-6 py-1.5 rounded-full ${selected ? 'bg-white text-black' : 'text-white'}`} href={href}>
    {children}
  </a>
);
