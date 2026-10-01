import {createRootRoute, createRoute, createRouter, redirect} from '@tanstack/react-router'
import App from './App.tsx'
import NavBar from './components/NavBar.tsx'
import TeamStandingsTable from '@/components/TeamStandingsTable.tsx'
import TeamStandingsChart from '@/components/TeamStandingsChart.tsx'
import Playoffs from '@/components/Playoffs.tsx'
import LeagueShapeQuiz from '@/components/LeagueShapeQuiz.tsx'
import PatchNotes from '@/components/PatchNotes.tsx'
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

const playoffsRoute = createRoute({
    path: '/nhl_playoffs',
    getParentRoute: () => navBarRoute,
    component: Playoffs,
})

const quizRoute = createRoute({
    path: '/league_shape_quiz',
    getParentRoute: () => navBarRoute,
    component: LeagueShapeQuiz,
})

// not linked from the nav yet; it'll move under an About section once that exists
const patchNotesRoute = createRoute({
    path: '/about/patch_notes',
    getParentRoute: () => navBarRoute,
    component: PatchNotes,
})

const routeTree = rootRoute.addChildren([
    navBarRoute.addChildren([indexRoute, standingsRoute, chartRoute, playoffsRoute, quizRoute, patchNotesRoute]),
])

export const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
})

// IMPORTANT: IDEA doesn't think that Register or HistoryState are used, but they are;
//            this is exactly how tanstack sets things up.  Read more about TypeScript
//            module augmentation here:
//
//            https://www.typescriptlang.org/docs/handbook/declaration-merging.html
//
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
    interface HistoryState {
        notFoundPath?: string
    }
}
