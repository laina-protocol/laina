import { GoLinkExternal } from 'react-icons/go';

export interface LinkProps {
  className?: string;
  text?: string;
  contractId: string;
}

export const StellarExpertLink = ({ className = '', text = 'View contract', contractId }: LinkProps) => {
  const href = `https://stellar.expert/explorer/testnet/contract/${contractId}`;
  return (
    <a className={`link flex flex-row ${className}`} href={href} target="_blank" rel="noreferrer">
      {text}
      <GoLinkExternal className="ml-1 mt-1" size=".9rem" />
    </a>
  );
};
