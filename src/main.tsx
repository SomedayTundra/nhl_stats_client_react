import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

import './index.css'
import App from './App.tsx'
import NotFound from "./components/NotFound.tsx";
import TeamStandingsTable from "./components/TeamStandingsTable.tsx"
import TeamStandingsChart from "./components/TeamStandingsChart.tsx"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {path: "/", element: <TeamStandingsTable />},
            {path: "/nhl_standings", element: <TeamStandingsTable />},
        ],
    },
    {
        path: "/",
        element: <App />,
        children: [
            {path: "/", element: <TeamStandingsTable />},
            {path: "/nhl_stats_chart", element: <TeamStandingsChart />},
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>,
)
