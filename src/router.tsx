import {createRootRoute, createRoute, createRouter, redirect} from '@tanstack/react-router'
import App from './App.tsx'
import NavBar from './components/NavBar.tsx'
import TeamStandingsTable from '@/components/TeamStandingsTable.tsx'
import TeamStandingsChart from '@/components/TeamStandingsChart.tsx'
import LeagueShapeQuiz from '@/components/LeagueShapeQuiz.tsx'
import NotFound from '@/components/NotFound.tsx'

const rootRoute = createRootRoute({
    component: App,
})

const navBarRoute = createRoute({
    id: 'navbar-layout',
    getParentRoute: () => rootRoute,
    component: NavBar,
})

const indexRoute = createRoute({
    path: '/',
    getParentRoute: () => navBarRoute,
    beforeLoad: () => {
        throw redirect({to: '/nhl_standings'})
    },
})

const standingsRoute = createRoute({
    path: '/nhl_standings',
    getParentRoute: () => navBarRoute,
    component: TeamStandingsTable,
})

const chartRoute = createRoute({
    path: '/nhl_stats_chart',
    getParentRoute: () => navBarRoute,
    component: TeamStandingsChart,
})

const quizRoute = createRoute({
    path: '/league_shape_quiz',
    getParentRoute: () => navBarRoute,
    component: LeagueShapeQuiz,
})

const routeTree = rootRoute.addChildren([
    navBarRoute.addChildren([indexRoute, standingsRoute, chartRoute, quizRoute]),
])

export const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
    interface HistoryState {
        notFoundPath?: string
    }
}
