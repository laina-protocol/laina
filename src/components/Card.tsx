import type { PropsWithChildren } from 'react';

export interface CardProps {
  className?: string;
  bgColor?: string;
}

export const Card = ({ bgColor = 'white', className = '', children }: PropsWithChildren<CardProps>) => (
  <div className={`bg-${bgColor} rounded drop-shadow ${className}`}>{children}</div>
);
