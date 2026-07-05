import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter,} from 'react-router-dom'

import './index.css'
import App from './App.tsx'

// const router = createBrowserRouter([
//     {
//         path: "/",
//         element: <App />,
//         children: [
//             {path: "/", element: <TeamStandingsTable />},
//             {path: "/nhl_standings", element: <TeamStandingsTable />},
//         ],
//     },
//     {
//         path: "/",
//         element: <App />,
//         children: [
//             {path: "/nhl_stats_chart", element: <TeamStandingsChart />},
//         ],
//     },
//     {
//         path: "/",
//         element: <App />,
//         children: [
//             {path: "/league_shape_quiz", element: <LeagueShapeQuiz />},
//         ],
//     },
//     {
//         path: "*",
//         element: <NotFound />,
//     },
// ]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
  </StrictMode>,
)
