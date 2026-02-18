import {Link} from "react-router-dom";
import logo_somedaytundra_full from "../assets/somedaytundra_full.png"

export default function NotFound() {
    return (
        <>
            <p className="bg-neutral-100 p-4 text-3xl flex justify-center items-center">The page you asked for could not be found!</p>
            <p className="bg-neutral-100 p-4 text-3xl flex justify-center items-center">Punch the igloo to head back to safety.</p>
            <div className="bg-neutral-100 p-4 w-full">
                <Link to={`/`}>
                    <img alt="SomedayTundra logo" className="h-10 mx-auto" src={logo_somedaytundra_full}></img>
                </Link>
            </div>
        </>
    );
}