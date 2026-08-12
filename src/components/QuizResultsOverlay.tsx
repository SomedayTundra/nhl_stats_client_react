'use client'

import {cn} from '@/lib/utils.ts'

type QuizResultsOverlayProps = {
    teamsSorted: number
    correctGuesses: number
    incorrectGuesses: number
    onDismiss: () => void
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

export function QuizResultsOverlay({teamsSorted, correctGuesses, incorrectGuesses, onDismiss}: QuizResultsOverlayProps) {
    const scorePercent = Math.round((correctGuesses / (correctGuesses + incorrectGuesses)) * 100)

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/60 text-center text-white cursor-pointer"
            onClick={onDismiss}
        >
            <span className="bg-yel text-7xl font-bold drop-shadow-lg">{scoreTitle(scorePercent)}</span>
            <span className="text-2xl drop-shadow-lg">You correctly sorted {teamsSorted} teams in {correctGuesses + incorrectGuesses} attempts</span>
            <span className="text-2xl drop-shadow-lg">
                Your score is: <span className={cn("font-bold", scoreColor(scorePercent))}>{scorePercent}%</span>
            </span>
        </div>
    )
}
