import { MdOutlineArrowOutward } from 'react-icons/md';

export interface LinkProps {
  className?: string;
  text?: string;
  contractId: string;
}

export const StellarExpertLink = ({ className = '', text = 'View contract', contractId }: LinkProps) => {
  const href = `https://stellar.expert/explorer/testnet/contract/${contractId}`;
  return (
    <a
      className={`link flex flex-row hover:text-grey transition ${className}`}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {text}
      <MdOutlineArrowOutward className="mt-1" size=".9rem" />
    </a>
  );
};
