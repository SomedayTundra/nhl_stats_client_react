import type * as React from 'react'
import {useTheme} from '@somedaytundra/theme'
import {handleLogoError, teamLogoSources, type TeamLogoSourceOptions} from '@/lib/teamLogo.ts'

type TeamLogoProps = Omit<TeamLogoSourceOptions, 'darkTheme'> &
    Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'>

// A team crest that follows the theme: the dark-background version on Aurora when the team has
// one, falling back to the light crest (and then the NHL's own URL) if that fails to load.
export default function TeamLogo({logo, logoDark, size, fallbackUrl, darkFallbackUrl, alt = '', ...imgProps}: TeamLogoProps) {
    const {theme} = useTheme()
    const [src, ...fallbacks] = teamLogoSources({logo, logoDark, size, fallbackUrl, darkFallbackUrl, darkTheme: theme === 'aurora'})
    // keyed on the first choice, so a theme switch starts the fallback chain over on a fresh element
    return <img key={src} src={src} alt={alt} onError={(event) => handleLogoError(event, fallbacks)} {...imgProps}/>
}
