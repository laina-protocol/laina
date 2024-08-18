import logo from "/public/laina_v3_shrinked.png";

export default function Nav() {
	return (
		<nav className="relative max-w-screen-lg mx-auto mb-12 flex justify-between items-center pt-12 pb-6">
			<div>
				<a href="/">
					<img src={logo.src} alt="logo" width={200} />
				</a>
			</div>

			<div className="flex gap-12 bg-gray-200 rounded-full px-8 py-2 text-white font-bold">
				<a href="/lend">Lend</a>
				<a href="/borrow">Borrow</a>
				<a href="/liquidate">Liquidate</a>
			</div>

			<div className="bg-black text-white px-8 py-2 rounded-full">
				<a>Connect Wallet</a>
			</div>
		</nav>
	);
}
