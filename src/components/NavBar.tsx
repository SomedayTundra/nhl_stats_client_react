import {Link, Outlet} from '@tanstack/react-router'
import logo from "../assets/nhl_logo.png"
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {ThemeToggle} from '@somedaytundra/theme'
import AuthCard from '@/components/auth/AuthCard.tsx'

const NavBar = () => {

    // the SomedayTundra theme's nav colors, matching the dashboard's sidebar; Link marks the current
    // page with data-status="active"
    const navClass = 'text-st-ink-2 hover:bg-st-nav-hover hover:text-st-ink rounded-md px-3 py-2 data-[status=active]:bg-st-accent-soft data-[status=active]:text-st-accent-soft-ink';

    return (
        <div className="flex flex-col h-full min-h-0">
            <nav className="navbar shrink-0">
                <div className="mx-auto px-2 sm:px-6 lg:px-4">
                    <div className="flex h-15 items-center justify-start">
                        <div className="flex flex-1 items-center justify-start">
                            <Link to="/" className="flex shrink-0 items-center mr-4">
                                <img
                                    className="h-10 w-auto"
                                    src={logo}
                                    alt="NHL Logo"
                                />
                            </Link>
                            <Link className={navClass} to="/nhl_standings">Standings</Link>
                            <Link className={navClass} to="/nhl_stats_chart">Chart</Link>
                            <Link className={navClass} to="/nhl_playoffs">Playoffs</Link>
                            <Link className={navClass} to="/league_shape_quiz">Quiz</Link>
                            <Link className={`${navClass} ml-auto`} to="/jira">Jira</Link>
                            <Link className={navClass} to="/about/patch_notes">Patch Notes</Link>
                            <Link className={navClass} to="/farm_runs">Farm Runs</Link>
                            <div className="ml-3 flex items-center">
                                <ThemeToggle compact animationToggle={false}/>
                            </div>
                            <div className="ml-3 flex items-center">
                                <AuthCard/>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="flex-1 min-h-0 overflow-y-auto">
                <Outlet/>
            </div>
            {/* outside the nav: its backdrop-filter would pin the devtools' fixed button to the nav */}
            {import.meta.env.DEV && <ReactQueryDevtools/>}
        </div>
    );
};

export default NavBar;
