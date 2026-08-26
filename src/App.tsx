import {Outlet} from '@tanstack/react-router'
import {ToastContainer} from 'react-toastify'
import logo_full from './assets/somedaytundra_full.png'

const App = () => {
    return (
        <div className='w-full h-full p-4 flex flex-col'>
            <div className='flex-1 min-h-0 flex flex-col'>
                <Outlet/>
            </div>

            <ToastContainer/>
            <div className='nhl-page-footer w-'>
                <img alt='SomedayTundra logo' className='h-[1.875rem] mx-auto' src={logo_full}></img>
            </div>
        </div>
    )
}

export default App
