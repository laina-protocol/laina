import { LinkButton, NativeLinkButton } from '@components/Button';
import CardsImage from '@images/cards.jpg';
import Konsta from '@images/konsta.jpeg';
import Teemu from '@images/teemu.jpg';
import { FaDiscord, FaGithub } from 'react-icons/fa';

const team = [
  {
    image: Teemu.src,
    name: 'Teemu Hynnä',
    discord: '.h0suja',
    github: 'teolhyn',
  },
  {
    image: Konsta.src,
    name: 'Konsta Purtsi',
    discord: 'konsta',
    github: 'kovipu',
  },
];

const LandingPage = () => (
  <>
    <section className="flex flex-row mb-14">
      <div className="w-1/2">
        <h1 className="text-[42px] font-medium mb-8 tracking-tight">
          A trustless loan platform focusing on single-token lending pools.
        </h1>
        <h2 className="text-[42px] font-bold tracking-tight">DeFi made simple.</h2>
      </div>
      <div className="w-1/2">
        <img src={CardsImage.src} alt="" />
      </div>
    </section>
    <section className="border-t-4 flex flex-row my-14">
      <div className="w-1/2 pt-14 pr-14 border-r-4">
        <p className="text-2xl leading-relaxed mb-8 tracking-tight">
          Laina is currently in the early development stage and is only operating on the Stellar Testnet.
        </p>
        <p className="text-2xl leading-relaxed mb-8 tracking-tight">Now that you're here, take a peek.</p>
        <LinkButton to="/lend" className="text-lg">
          Open the app
        </LinkButton>
      </div>
      <div className="w-1/2 pt-14 pl-14">
        <p className="text-lg mb-8 leading-relaxed">
          Laina is a low fee, trustless, and easy-to-use decentralized loan platform.
        </p>
        <p className="text-lg leading-relaxed">
          We are focusing on making a simple and efficient DeFi product, where there is minimal need for token swapping
          or liquidity other than what is used for lending. Our vision is to change DeFi by making it accessible and
          understandable for everyone, regardless of their technical knowledge or financial status. By providing
          efficient single-token lending pools, we eliminate the complexities often associated with multi-token systems.
        </p>
      </div>
    </section>
    <section className="flex flex-row my-20">
      <div className="w-1/2">
        <h3 className="text-[42px] font-bold mb-14 tracking-tight">The Team</h3>
        <div className="flex flex-row">
          {team.map((member) => (
            <TeamMember key={member.name} {...member} />
          ))}
        </div>
      </div>
      <div className="w-1/2 p-14 my-auto">
        <p className="text-xl mb-8 leading-relaxed tracking-tight">
          Got a question? Ask us in the Stellar Dev Discord!
        </p>
        <NativeLinkButton to="https://discord.com/invite/stellardev" className="text-lg">
          Join Stellar Discord
        </NativeLinkButton>
      </div>
    </section>
  </>
);

interface TeamMemberProps {
  image: string;
  name: string;
  discord: string;
  github: string;
}

const TeamMember = ({ image, name, discord, github }: TeamMemberProps) => (
  <div className="mr-14">
    <div className="aspect-square rounded mb-8 overflow-hidden">
      <img src={image} alt={name} />
    </div>
    <p className="text-xl font-semibold">{name}</p>
    <span className="flex flex-row items-center text-lg my-2">
      <FaDiscord size="2rem" className="mr-2" />
      {discord}
    </span>
    <span className="flex flex-row items-center text-lg my-2">
      <FaGithub size="2rem" className="mr-2" />
      {github}
    </span>
  </div>
);

export default LandingPage;
