interface IdenticonProps {
  address: string;
}

const Identicon = ({ address }: IdenticonProps) => (
  <div className="avatar bg-white rounded-full">
    <div className="w-16 p-3">
      <img src={`https://id.lobstr.co/${address}.png`} alt="Your wallet's identicon" />
    </div>
  </div>
);

export default Identicon;
