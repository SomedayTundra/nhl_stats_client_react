'use client'

import {cn} from '@/lib/utils.ts'

type QuizResultsProps = {
    teamsSorted: number
    correctGuesses: number
    incorrectGuesses: number
    era: string
    totalTeams: number
    showTeamNames: boolean
}

function scoreColor(scorePercent: number): string {
    if (scorePercent >= 90) return 'text-green-500' // green
    if (scorePercent >= 75) return 'text-yellow-500' // yellow
    if (scorePercent >= 51) return 'text-orange-500' // orange
    return 'text-red-500' // red
}

function scoreTitle(scorePercent: number): string {
    if (scorePercent >= 90) return 'Fantastic Job!!!'
    if (scorePercent >= 75) return 'Good Job!'
    if (scorePercent >= 51) return 'Adequate Job'
    return 'Terrible Job'
}

// Shown at the top of UnplacedTeamBucket once a round is complete, replacing the bucket's normal
// header + drop zone. Every value is a snapshot of the round that was just played (passed down
// frozen), so fiddling with the era / team-count / show-names controls afterwards leaves it
// untouched - only the next "Go!" clears it. Sized in cqh/cqw units (see .quiz-results in
// index.css) so it scales to the bucket panel instead of being a full-screen overlay.
export function QuizResults({teamsSorted, correctGuesses, incorrectGuesses, era, totalTeams, showTeamNames}: QuizResultsProps) {
    const scorePercent = Math.round((correctGuesses / (correctGuesses + incorrectGuesses)) * 100)

    return (
        <div className="quiz-results">
            <span className="quiz-results-title">{scoreTitle(scorePercent)}</span>
            <span className="quiz-results-line">
                You correctly sorted {teamsSorted} teams in {correctGuesses + incorrectGuesses} attempts
            </span>
            <span className="quiz-results-line rounded-md bg-white px-3 py-0.5">
                Your score is: <span className={cn('font-bold', scoreColor(scorePercent))}>{scorePercent}%</span>
            </span>
            <div className="quiz-results-details">
                <div>Era: {era}</div>
                <div>Number of teams: {teamsSorted} out of {totalTeams}</div>
                <div>Show team names: {String(showTeamNames).toUpperCase()}</div>
            </div>
        </div>
    )
}
