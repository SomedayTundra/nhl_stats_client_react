import {useState} from 'react'
import {ClerkLoading, Show, UserButton, useClerk, useUser} from '@clerk/react'
import {ChevronsUpDown} from 'lucide-react'
import {IglooMark} from '@somedaytundra/theme'
import {CLERK_ENABLED} from '@/lib/clerk.ts'

// The SomedayTundra dashboard's sidebar sign-in card, cut down to one row so it fits the navbar: the
// prompt and igloo when signed out, only the Clerk user when signed in.
const cardClass = 'flex h-12 items-center rounded-2xl border border-st-line bg-st-surface shadow-st-card'

function SignedOutCard({onClick, note, disabled}: { onClick?: () => void; note: string; disabled?: boolean }) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            className={`${cardClass} cursor-pointer gap-2.5 px-3.5 hover:bg-st-nav-hover disabled:cursor-default disabled:hover:bg-st-surface`}
        >
            <span className='text-[12.5px] font-semibold text-st-muted'>{note}</span>
            <IglooMark width={40} height={19} crop='tight'/>
        </button>
    )
}

// Clerk's UserButton, stretched so the whole avatar-and-name section is its trigger: a click anywhere
// on it opens Clerk's account menu.
const userButtonAppearance = {
    elements: {
        rootBox: {height: '100%'},
        userButtonTrigger: {
            height: '100%',
            justifyContent: 'flex-start',
            padding: '0 36px 0 12px',
            borderRadius: 0,
            '&:focus': {boxShadow: 'none'},
            '&:focus-visible': {outline: '2px solid var(--st-accent)', outlineOffset: '-2px'},
            '&:hover': {background: 'var(--st-nav-hover)'},
        },
        // Clerk puts the name before the avatar; flip it so the avatar leads
        userButtonBox: {flexDirection: 'row-reverse', gap: '10px', color: 'var(--st-ink)'},
        userButtonOuterIdentifier: {fontSize: '14px', fontWeight: 700, padding: 0, color: 'var(--st-ink)'},
        userButtonAvatarBox: {width: '32px', height: '32px'},
    },
}

function SignedInCard() {
    const {user} = useUser()
    if (!user) return null

    return (
        // the user id in a tooltip on dev builds stands in for the dashboard card's dev-only id line
        <div className={`${cardClass} overflow-hidden`} title={import.meta.env.DEV ? `dev · ${user.id}` : undefined}>
            <div className='relative h-full'>
                <UserButton showName appearance={userButtonAppearance}/>
                <ChevronsUpDown
                    aria-hidden='true'
                    className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-st-muted'
                />
            </div>
        </div>
    )
}

function ClerkAuthCard() {
    const clerk = useClerk()
    return (
        <>
            <ClerkLoading>
                <SignedOutCard note='Loading…' disabled/>
            </ClerkLoading>
            <Show when='signed-out'>
                <SignedOutCard note='(click to sign in)' onClick={() => clerk.openSignIn()}/>
            </Show>
            <Show when='signed-in'>
                <SignedInCard/>
            </Show>
        </>
    )
}

function UnconfiguredAuthCard() {
    const [explained, setExplained] = useState(false)
    return (
        <div className='relative'>
            <SignedOutCard note='(click to sign in)' onClick={() => setExplained(true)}/>
            {/* below the card rather than under it in the flow, so the navbar keeps its height */}
            {explained && (
                <p role='status'
                   className='absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-st-line bg-st-surface p-2.5 text-[12.5px] leading-snug text-st-muted shadow-st-card'>
                    {/* the setup hint is for developers; a visitor to a deployment missing its key just
                        gets told sign-in is unavailable */}
                    {import.meta.env.DEV ? (
                        <>
                            Sign-in isn't set up yet: add <code className='font-mono'>VITE_CLERK_PUBLISHABLE_KEY</code> to{' '}
                            <code className='font-mono'>.env.local</code>.
                        </>
                    ) : (
                        "Sign-in isn't available right now."
                    )}
                </p>
            )}
        </div>
    )
}

// The navbar's last item: a sign-in prompt when signed out, the Clerk user when signed in.
export default function AuthCard() {
    return CLERK_ENABLED ? <ClerkAuthCard/> : <UnconfiguredAuthCard/>
}
