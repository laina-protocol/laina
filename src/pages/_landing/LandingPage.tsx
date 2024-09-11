import CardsImage from '@images/cards.jpg';

const LandingPage = () => (
  <div className="flex flex-row">
    <div className="w-1/2">
      <h1 className="text-[42px] font-medium mb-8">
        A trustless loan platform focusing on single-token lending pools.
      </h1>
      <h2 className="text-[42px] font-bold">DeFi made simple.</h2>
    </div>
    <div className="w-1/2">
      <img src={CardsImage.src} alt="" />
    </div>
  </div>
);

export default LandingPage;
