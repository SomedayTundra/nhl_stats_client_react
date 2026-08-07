import {Route, Routes} from 'react-router-dom'
import Navbar from './components/NavBar.tsx'
import {ToastContainer} from 'react-toastify'
import logo_full from './assets/somedaytundra_full.png'
import TeamStandingsTable from '@/components/TeamStandingsTable.tsx'
import TeamStandingsChart from '@/components/TeamStandingsChart.tsx'
import LeagueShapeQuiz from '@/components/LeagueShapeQuiz.tsx'
import NotFound from '@/components/NotFound.tsx'

const App = () => {
    return (
        <div className='w-full h-full p-4 flex flex-col'>
            <div className='flex-1 min-h-0 flex flex-col'>
                <Routes>
                    <Route path='/' element={<Navbar/>}>
                        <Route path='/nhl_standings' element={<TeamStandingsTable/>}/>
                        <Route path='/nhl_stats_chart' element={<TeamStandingsChart/>}/>
                        <Route path='/league_shape_quiz' element={<LeagueShapeQuiz/>}/>
                        <Route path='*' element={<NotFound/>}/>
                    </Route>
                </Routes>
            </div>

            <ToastContainer/>
            <div className='nhl-page-footer w-'>
                <img alt='SomedayTundra logo' className='h-10 mx-auto' src={logo_full}></img>
            </div>
        </div>
    )
}

export default App