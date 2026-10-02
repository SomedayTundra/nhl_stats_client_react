import {Link, Outlet} from '@tanstack/react-router'
import logo from "../assets/nhl_logo.png"
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'

const NavBar = () => {

    const inactiveClass = 'text-[var(--navbar-fg)] hover:bg-[var(--navbar-fg)] hover:text-[var(--navbar-bg)] rounded-md px-3 py-2';
    const activeClass = 'text-white bg-[var(--navbar-fg)] hover:bg-[var(--navbar-fg)] hover:text-white rounded-md px-3 py-2';

    return (
        <div className="flex flex-col h-full min-h-0">
            <nav className="navbar shrink-0">
                <div className="mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex h-15 items-center justify-start">
                        <div className="flex flex-1 items-start justify-left md:items-stretch md:justify-start">
                            <Link to="/" className="flex shrink-0 items-center mr-8">
                                <img
                                    className="h-10 w-auto"
                                    src={logo}
                                    alt="NHL Stats"
                                />
                                <span className="navbar-label hidden md:block text-2xl font-bold ml-2">
                                    NHL Stats
                                </span>
                            </Link>
                            <Link className={inactiveClass} activeProps={{className: activeClass}} to="/nhl_standings">Table</Link>
                            <Link className={inactiveClass} activeProps={{className: activeClass}} to="/nhl_stats_chart">Chart</Link>
                            <Link className={inactiveClass} activeProps={{className: activeClass}} to="/nhl_playoffs">Playoffs</Link>
                            <Link className={inactiveClass} activeProps={{className: activeClass}} to="/league_shape_quiz">Quiz</Link>
                            <Link className={`${inactiveClass} ml-auto`} activeProps={{className: `${activeClass} ml-auto`}} to="/about/patch_notes">Patch Notes</Link>
                            {import.meta.env.DEV && <ReactQueryDevtools/>}
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