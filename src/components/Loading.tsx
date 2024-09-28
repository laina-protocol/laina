export interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading = ({ size = 'md', className = '' }: LoadingProps) => (
  <span className={`loading loading-${size} loading-spinner ${className}`} />
);
