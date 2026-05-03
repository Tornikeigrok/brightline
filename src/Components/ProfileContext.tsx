import { useEffect, useState, createContext, useContext } from "react";
import Cookies from 'js-cookie';
import { ReactNode } from "react";
import { getUrl } from "./Request";

interface User {
    first: string,
    last: string,
    email: string
}
interface UserContextRule{
    user: User  | null,
    loading: boolean,
    refetchUser: ()=> Promise<void>
}

const UserContext = createContext<UserContextRule | undefined>(undefined);

export function UserProvider({children}: {children: ReactNode}){
    const [user, setUser]= useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchUser = async()=>{
        try {
        const token = Cookies.get('token');
        if(!token){
            setLoading(false);
            return;
        }
        const res = await fetch(getUrl('profile'),{
            method: 'GET',
            headers: {'Authorization' : "Bearer " + token}
        })
        if(res.ok){
            const data = await res.json();
            setUser(data);
        }
        } catch (error) {
            console.error(error);
        }
        finally{
            setLoading(false);
        } 
    }

    useEffect(()=>{
        fetchUser();
    }, [])

    return(
        <UserContext.Provider value={{user, loading, refetchUser: fetchUser}}>
            {children}
        </UserContext.Provider>
    )
}
export const useUser = ()=>{
    const context = useContext(UserContext);
    if(!context){
        throw new Error("Error has occured");
    }
    return context;
}

