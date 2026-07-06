import {TeamInfoCard} from '@/components/TeamInfoCard.tsx'
import {type TeamInfo} from '@/state/types'
import {useQuery} from '@tanstack/react-query'


const SERVER = 'localhost:8000'

type Conference = {
    divisions: Map<string, Division>;
}

type Division = {
    teams: Array<TeamInfo>;
}


/**
 * React component that shows all loaded team info content, one-team-per-TeamInfoCard
 */
export function LeagueBoard() {
    const {data: allTeamsInfo, isPending, error} = useQuery({
        queryKey: ['leagueInfo'],
        queryFn: async () => {
            // FIXME: SWITCH TO https://
            const response = await fetch(`http://${SERVER}/api/nhl_team_info/`)
            return (await response.json()) as TeamInfo[]
        }
    })

    let newConferences: Map<string, Conference> = new Map()

    if (!isPending && !error) {
        allTeamsInfo.forEach((teamInfo) => {
            const conferenceName = teamInfo.conferenceName
            let conferenceForThisTeam = newConferences.get(conferenceName)
            if (conferenceForThisTeam === undefined) {
                conferenceForThisTeam = {divisions: new Map()}
                newConferences.set(conferenceName, conferenceForThisTeam)
            }

            const divisionName = teamInfo.divisionName
            let divisionForThisTeam = conferenceForThisTeam.divisions.get(divisionName)
            if (divisionForThisTeam === undefined) {
                divisionForThisTeam = {teams: []}
                conferenceForThisTeam.divisions.set(divisionName, divisionForThisTeam)
            }

            divisionForThisTeam.teams.push(teamInfo)
        })
    }

    // FIXME: FIND A BETTER WAY TO STORE AND ITERATE THE CONFERENCE, DIVISION, AND TEAM INFO
    //        REFERENCES LIKE "conferenceInfo[1]" SEEM RIDICULOUS
    return (
        <>
            <div className='league-ref-everything'>
                <h1 className='league-ref-header'>LEAGUE</h1>
                <div className='league-ref-all-conferences-container'>
                    {[...newConferences.entries()].map((conferenceInfo) => (
                        <div key={conferenceInfo[0]} className='league-ref-one-conference-container'>
                            <h2 className='conference-name-row'>{conferenceInfo[0]} Conference</h2>
                            {[...conferenceInfo[1].divisions.entries()].map((divisionInfo) => (
                                <div key={divisionInfo[0]} className='league-ref-one-division-container'>
                                    <h2 className='division-name-row'>{divisionInfo[0]} Division</h2>
                                    <div className='team-info-card-row'>
                                        {[...divisionInfo[1].teams.map((teamInfo) => (
                                            <TeamInfoCard key={teamInfo.teamAbbrev} info={teamInfo}/>
                                        ))]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}