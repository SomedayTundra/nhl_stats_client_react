'use client'

type WinOverlayProps = {
    teamsSorted: number
    correctGuesses: number
    incorrectGuesses: number
    onDismiss: () => void
}

function scoreColor(scorePercent: number): string {
    if (scorePercent >= 90) return '#22c55e' // green
    if (scorePercent >= 75) return '#eab308' // yellow
    if (scorePercent >= 51) return '#f97316' // orange
    return '#ef4444' // red
}

function scoreTitle(scorePercent: number): string {
    if (scorePercent >= 90) return 'Fantastic Job!!!'
    if (scorePercent >= 75) return 'Good Job!'
    if (scorePercent >= 51) return 'Adequate Job'
    return 'Terrible Job'
}

export function WinOverlay({teamsSorted, correctGuesses, incorrectGuesses, onDismiss}: WinOverlayProps) {
    const scorePercent = Math.round((correctGuesses / (correctGuesses + incorrectGuesses)) * 100)

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/60 text-center text-white cursor-pointer"
            onClick={onDismiss}
        >
            <span className="text-7xl font-bold drop-shadow-lg">{scoreTitle(scorePercent)}</span>
            <span className="text-2xl drop-shadow-lg">You correctly sorted {teamsSorted} teams in {correctGuesses + incorrectGuesses} attempts</span>
            <span className="text-2xl drop-shadow-lg">
                Your score is: <span className="font-bold" style={{color: scoreColor(scorePercent)}}>{scorePercent}%</span>
            </span>
        </div>
    )
}
