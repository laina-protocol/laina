

export interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const Loading = ({ size = 'md' }: LoadingProps) => (
  <span className={`loading loading-${size} loading-spinner`} />
)
