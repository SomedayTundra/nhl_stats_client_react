import {useLocation, useNavigate} from '@tanstack/react-router'
import {useEffect} from 'react'

export default function NotFound() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        setTimeout(() => {
            navigate({to: '/nhl_standings', state: {notFoundPath: location.pathname}})
        }, 3000)
    })

    return (<h3 className='m-8'>⚠️ 😡 - 404 - The page {location.pathname} could not be found - 404 - 😡 ⚠️</h3>)
}