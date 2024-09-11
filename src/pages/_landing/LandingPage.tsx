import { LinkButton } from '@components/Button';
import CardsImage from '@images/cards.jpg';

const LandingPage = () => (
  <>
    <section className="flex flex-row mb-12">
      <div className="w-1/2">
        <h1 className="text-[42px] font-medium mb-8">
          A trustless loan platform focusing on single-token lending pools.
        </h1>
        <h2 className="text-[42px] font-bold">DeFi made simple.</h2>
      </div>
      <div className="w-1/2">
        <img src={CardsImage.src} alt="" />
      </div>
    </section>
    <section className="border-t-4 flex flex-row">
      <div className="w-1/2 pt-14 pr-14 border-r-4">
        <p className="text-2xl leading-relaxed mb-14">Laina is currently in the early development stage and is only operating on the Stellar Testnet.</p>
        <p className="text-2xl leading-relaxed mb-14">Now that you're here, take a peek.</p>
        <LinkButton to="/lend">Open the app</LinkButton>
      </div>
      <div className="w-1/2 pt-14 pl-14">
        <p className="text-lg mb-8 leading-relaxed">Laina is a low fee, trustless, and easy-to-use decentralized loan platform.</p>
        <p className="text-lg leading-relaxed">
          We are focusing on making a simple and efficient DeFi product, where there is minimal need for token swapping or liquidity other than what is used for lending. Our vision is to change DeFi by making it accessible and understandable for everyone, regardless of their technical knowledge or financial status. By providing efficient single-token lending pools, we eliminate the complexities often associated with multi-token systems.
        </p>
      </div>
    </section>
  </>
);

export default LandingPage;
