import {Link} from "react-router-dom";

export default function NotFound() {
    return (
        <>
            <p className="bg-neutral-100 p-4 text-3xl flex justify-center items-center">The page you asked for could not be found!</p>
            <p className="bg-neutral-100 p-4 text-3xl flex justify-center items-center">Punch the igloo to head back to safety.</p>
            <div className="bg-neutral-100 p-4 w-full">
                <Link to={`/`}>
                    <img alt="MongoDB logo" className="h-10 mx-auto" src="src/assets/somedaytundra.png"></img>
                </Link>
            </div>
        </>
    );
}