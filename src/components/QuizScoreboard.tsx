'use client'

type QuizScoreboardProps = {
    correctGuesses: number
    incorrectGuesses: number
}

export function QuizScoreboard({correctGuesses, incorrectGuesses}: QuizScoreboardProps) {
    return (
        <div className="flex flex-row items-center gap-4 whitespace-nowrap rounded-md bg-white px-3 py-0.5">
            <span>Correct: <span className="text-green-600 font-semibold">{correctGuesses}</span></span>
            <span>Incorrect: <span className="text-red-600 font-semibold">{incorrectGuesses}</span></span>
        </div>
    )
}
