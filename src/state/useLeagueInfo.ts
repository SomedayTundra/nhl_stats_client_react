import {create} from 'zustand';

const SERVER = 'localhost:8000';


export type TeamInfo = {
    teamAbbrev: string
    teamName: string
    teamCommonName: string
    logo: string
    conferenceName: string
    conferenceAbbrev: string
    divisionName: string
    divisionAbbrev: string
}


type LeagueInfo = {
    conferences: Map<string, Conference>;
}

type Conference = {
    divisions: Map<string, Division>;
}

type Division = {
    teams: Array<TeamInfo>;
}


export const useLeagueInfo = create<LeagueInfo>(() => {
    return {
        conferences: new Map()
    }
})


export async function refresh() {
    // FIXME: SWITCH TO https://
    const response = await fetch(`http://${SERVER}/api/nhl_team_info/`);    // FIXME: SWITCH TO https://
    let newConferences: Map<string, Conference> = new Map()

    if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        console.error(message);
        return newConferences;
    }

    const newAllTeamsInfo = await(response.json()) as TeamInfo[];

    // add each team's conference and division info to our 'newConferences' map
    newAllTeamsInfo.forEach((teamInfo) => {
        const conferenceName = teamInfo.conferenceName;
        let conferenceForThisTeam = newConferences.get(conferenceName);
        if(conferenceForThisTeam === undefined) {
            conferenceForThisTeam = {divisions: new Map()}
            newConferences.set(conferenceName, conferenceForThisTeam)
        }

        const divisionName = teamInfo.divisionName;
        let divisionForThisTeam = conferenceForThisTeam.divisions.get(divisionName);
        if(divisionForThisTeam === undefined) {
            divisionForThisTeam = {teams: []}
            conferenceForThisTeam.divisions.set(divisionName, divisionForThisTeam)
        }

        divisionForThisTeam.teams.push(teamInfo)
    });

    useLeagueInfo.setState({ conferences: newConferences })
}