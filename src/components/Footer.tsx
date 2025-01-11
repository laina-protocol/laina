import type { ComponentType } from 'react';
import { FaDiscord, FaGithub, FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="bg-black px-4 flex flex-col items-center justify-center">
      <div className="flex flex-row w-[74rem] max-w-full flex-wrap items-center mb-20">
        <div className="md:w-1/2 flex flex-col pt-10 px-4">
          <SocialLink href="https://discord.com/invite/gnUAFr3fUv" text="Laina Discord" Icon={FaDiscord} />
          <SocialLink href="https://x.com/Lainadefi" text="@Lainadefi" Icon={FaXTwitter} />
          <SocialLink href="https://github.com/laina-protocol" text="laina-protocol" Icon={FaGithub} />
        </div>
        <div className="md:w-1/2 pt-10 px-4 md:pl-14">
          <p className="text-white max-w-full text-lg">This website does not use cookies.</p>
          <p className="text-white max-w-full text-sm">&copy; Copyright 2025, Laina Protocol</p>
        </div>
      </div>
    </footer>
  );
}

interface IconProps {
  className?: string;
  size?: number;
}

const SocialLink = ({ href, text, Icon }: { href: string; text: string; Icon: ComponentType<IconProps> }) => {
  return (
    <span className="flex flex-row items-center my-1">
      <Icon className="text-white hover:text-grey mr-2" size={32} />
      <a className="text-lg text-white cursor-pointer hover:underline" href={href} target="_blank" rel="noreferrer">
        {text}
      </a>
    </span>
  );
};
