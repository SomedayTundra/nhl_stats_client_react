import { NavLink } from "react-router-dom";

export default function Navbar() {
    return (
        <div>
            <nav className="flex justify-between items-center mb-6 p-4 bg-neutral-100 text-blue-800 text-2xl font-bold">
                <NavLink to="/">
                    NAVBAR LIVES HERE
                </NavLink>

                {/*  LINKS TO VARIOUS TYPES OF STATS-VIEW PAGES GO HERE  */}

            </nav>
        </div>
    );
}