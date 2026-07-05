import {useLocation, useNavigate} from 'react-router-dom'
import {useEffect} from 'react'

export default function NotFound() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        setTimeout(() => {
            navigate('/nhl_standings', {state: `NotFound: ${location.pathname}`})
        }, 3000)
    })

    return (<h3 className='m-8'>⚠️ 😡 - 404 - The page {location.pathname} could not be found - 404 - 😡 ⚠️</h3>)
}