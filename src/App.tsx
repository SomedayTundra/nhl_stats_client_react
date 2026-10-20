import {Outlet} from '@tanstack/react-router'
import {ToastContainer} from 'react-toastify'

const App = () => {
    return (
        <div className='w-full h-full flex flex-col'>
            <div className='flex-1 min-h-0 flex flex-col'>
                <Outlet/>
            </div>

            <ToastContainer/>
        </div>
    )
}

export default App
