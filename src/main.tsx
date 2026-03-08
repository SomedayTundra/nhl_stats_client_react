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
import DateRangeTest from "@/components/DateRangeTest.tsx";
// import UserContextTest from "@/components/UserContextTest.tsx";

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
            {path: "/nhl_stats_chart", element: <TeamStandingsChart />},
        ],
    },
    {
        path: "/",
        element: <App />,
        children: [
            {path: "/date_range_test", element: <DateRangeTest />},
        ],
    },
    // {
    //     path: "/",
    //     element: <App />,
    //     children: [
    //         {path: "/user_context_test", element: <UserContextTest />},
    //     ],
    // },
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
