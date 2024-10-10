interface IdenticonProps {
  address: string;
}

const Identicon = ({ address }: IdenticonProps) => (
  <div className="avatar bg-white rounded-full border-4">
    <div className="w-14 p-[.6rem]">
      <img src={`https://id.lobstr.co/${address}.png`} alt="Your wallet's identicon" />
    </div>
  </div>
);

export default Identicon;
