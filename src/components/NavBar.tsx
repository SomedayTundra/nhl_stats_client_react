import {NavLink, type NavLinkRenderProps, Outlet} from 'react-router-dom'
import logo from "../assets/nhl_logo.png"
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

const NavBar = () => {

    const linkClass = ({isActive}: NavLinkRenderProps) => isActive ?
        'text-white bg-black hover:bg-gray-900 hover:text-white rounded-md px-3 py-2' :
        'text-[var(--navbar-fg)] hover:bg-gray-900 hover:text-white rounded-md px-3 py-2';

    return (
        <div className="flex flex-col h-full min-h-0">
            <nav className="navbar shrink-0">
                <div className="mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex h-[3.75rem] items-center justify-start">
                        <div className="flex flex-1 items-start justify-left md:items-stretch md:justify-start">
                            <NavLink to="/" className="flex shrink-0 items-center mr-8">
                                <img
                                    className="h-10 w-auto"
                                    src={logo}
                                    alt="NHL Stats"
                                />
                                <span className="navbar-label hidden md:block text-2xl font-bold ml-2">
                                    NHL Stats
                                </span>
                            </NavLink>
                            <NavLink className={linkClass} to="/nhl_standings">Table</NavLink>
                            <NavLink className={linkClass} to="/nhl_stats_chart">Chart</NavLink>
                            <NavLink className={linkClass} to="/league_shape_quiz">Quiz</NavLink>
                            <ReactQueryDevtools/>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="flex-1 min-h-0 overflow-y-auto">
                <Outlet/>
            </div>
        </div>
    );
};

export default NavBar;