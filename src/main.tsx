import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

import './index.css'
import App from './App.tsx'
import NotFound from "./components/NotFound.tsx";
import NHLStandingsTable from "./components/NHLStandingsTable.tsx"
import NHLStatsChart from "./components/NHLStatsChart.tsx"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {path: "/", element: <NHLStandingsTable />},
            {path: "/nhl_standings", element: <NHLStandingsTable />},
        ],
    },
    {
        path: "/",
        element: <App />,
        children: [
            {path: "/", element: <NHLStandingsTable />},
            {path: "/nhl_stats_chart", element: <NHLStatsChart />},
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
