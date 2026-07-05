import {UnplacedTeamBucket} from '@/components/UnplacedTeamBucket.tsx'
import {LeagueBoard} from '@/components/LeagueBoard.tsx'

export default function LeagueShapeQuiz() {
    return (
        <div className='flex flex-row'>
            <div className='w-1/3 align-top justify-end m-4 h-2/4 min-h-2/4'><UnplacedTeamBucket/></div>
            <div className='w-2/3 align-top justify-start m-4'><LeagueBoard/></div>
        </div>
    );
}