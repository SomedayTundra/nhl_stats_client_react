import { Outlet } from "react-router-dom";
import Navbar from "./components/NavBar.tsx";
import {ToastContainer} from 'react-toastify';
import logo_full from ".//assets//somedaytundra_full.png"

const App = () => {
    return (
        <div className="w-full p-6">
            <Navbar />
            <Outlet/>
            <ToastContainer/>
            <div className="bg-neutral-100 p-4 w-full">
                <img alt="SomedayTundra logo" className="h-10 mx-auto" src={logo_full}></img>
            </div>
        </div>
    );
};

export default App;