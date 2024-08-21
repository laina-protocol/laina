import type { PropsWithChildren } from 'react';

export interface CardProps {
  className?: string;
}

export const Card = ({ className = '', children }: PropsWithChildren<CardProps>) => (
  <div className={`bg-white rounded drop-shadow ${className}`}>{children}</div>
);
