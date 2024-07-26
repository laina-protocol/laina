import logo from "/home/teemu/Laina-protocol/Laina/public/laina_v3_shrinked.png"
import {motion} from 'framer-motion'
import { useState } from "react"

export default function Nav() {
    const [toggled, setToggled] = useState(false)

    return (
        <nav className="relative mx-12 mb-24 flex justify-between items-center pt-12 pb-6">
            <div>
                <img src={logo.src} alt="logo" width={250}/>
            </div>

            <div className="flex gap-12 bg-gray-400">
                <a>Lend</a>
                <a>Borrow</a>
                <a>Liquidate</a>
            </div>

            <div>
                <a>Connect</a>
            </div>
        </nav>
    )
}