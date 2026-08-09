import {UnplacedTeamBucket} from '@/components/UnplacedTeamBucket.tsx'
import {LeagueBoard} from '@/components/LeagueBoard.tsx'
import QuizToolbar from '@/components/QuizToolbar.tsx'

export default function LeagueShapeQuiz() {
    return (
        <div className='h-full min-h-0 flex flex-col'>
            <QuizToolbar/>
            <div className='flex flex-row flex-1 min-h-0'>
                <div className='w-1/3 align-top justify-end mx-4 min-h-0 overflow-hidden [container-type:size]'><UnplacedTeamBucket/></div>
                <div className='w-2/3 align-top justify-start mx-4 min-h-0 overflow-hidden [container-type:size]'><LeagueBoard/></div>
            </div>
        </div>
    );
}