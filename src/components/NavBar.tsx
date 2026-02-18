import {NavLink, type NavLinkRenderProps} from "react-router-dom";
import logo from "../assets/nhl_logo.png"

const NavBar = () => {

    const linkClass = ({isActive}: NavLinkRenderProps) => isActive ?
        'text-white bg-black hover:bg-gray-900 hover:text-white rounded-md px-3 py-2' :
        'text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2';

    return (
        <div>
            <nav className="bg-indigo-700 border-b border-indigo-500">
                <div className="mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-start">
                        <div className="flex flex-1 items-start justify-left md:items-stretch md:justify-start">
                            <NavLink to="/" className="flex shrink-0 items-center mr-4">
                                <img
                                    className="h-10 w-auto"
                                    src={logo}
                                    alt="NHL Stats"
                                />
                                <span className="hidden md:block text-white text-2xl font-bold ml-2">
                                    NHL Stats
                                </span>
                            </NavLink>
                            <NavLink to="/nhl_standings" className={linkClass}>
                                Table
                            </NavLink>
                            <NavLink to="/nhl_stats_chart" className={linkClass}>
                                Chart
                            </NavLink>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default NavBar;