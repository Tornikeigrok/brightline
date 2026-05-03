
import { useEffect, useState, PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { getValidatedToken } from "./RefreshRequest";
import { UserProvider } from "./ProfileContext";

export function AuthoProvider({children}: PropsWithChildren){
    const [ready,setsReady] = useState(false);
    const navigate = useNavigate();

    useEffect(()=>{
        const getToken = async()=>{
            const token = await getValidatedToken();
            if(!token){
                navigate('/');
            }
            else{
                setsReady(true);
            }
        }
        getToken();

        const interval = setInterval(getToken, 5 * 60 * 1000);
        return ()=> clearInterval(interval);
    },[navigate])
    if(!ready){
        return(
            <div className="flex justify-center items-center h-screen">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }
    return <UserProvider>{children}</UserProvider>
}