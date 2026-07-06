import {TeamInfoCard} from '@/components/TeamInfoCard.tsx';
import {refresh, useLeagueInfo} from '@/state/useLeagueInfo.ts';
import {useEffect} from 'react';


/**
 * React component that shows all loaded team info content, one-team-per-TeamInfoCard
 */
export function LeagueBoard() {
    const { conferences } = useLeagueInfo();

    useEffect(() => {
        refresh();
    }, [])

    // FIXME: FIND A BETTER WAY TO STORE AND ITERATE THE CONFERENCE, DIVISION, AND TEAM INFO
    //        REFERENES LIKE "conferenceInfo[1]" ARE RIDICULOUS
    return (
        <>
            <div className='league-ref-everything'>
                <h1 className='league-ref-header'>LEAGUE</h1>
                <div className='league-ref-all-conferences-container'>
                    {[...conferences.entries()].map((conferenceInfo) => (
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
    );
}