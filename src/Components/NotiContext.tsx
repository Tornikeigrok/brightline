import { useEffect, useContext, createContext, useState } from "react";
import { useUser } from "./ProfileContext";
import { ReactNode } from "react";
import { getUrl } from "./Request";

interface inviteRule{
    project_id: number,
    role: string,
    invited_at: string,
    invited_by: string,
    user_email: string,
    status: string
}

interface contextRule{
    invite: inviteRule[] | null,
    loadingdata: boolean,
    acceptedInvites: inviteRule[] | null, 
    refetchData: ()=> Promise<void>
}

export const NotificationContext = createContext<contextRule | undefined>(undefined);

//function to fill up the box
export  function FetchInvite({children}: {children: ReactNode}){
    const {user} = useUser();
    const [loadingdata, setLoadingData] = useState(true);
    const [inviteInfo, setinviteInfo] = useState<inviteRule[] | null>(null);
    const [acceptedInvites, setAcceptedInvites] = useState<inviteRule[] | null>(null);

     const invitedata = async()=>{
            if(!user?.email){
                setLoadingData(false);
                return;
            }
           try {
                const res = await fetch(getUrl(`viewInvitations/email?email=${user?.email}`))
                const data = await res.json();
                if(res.ok){
                    setinviteInfo(data.project_members.filter(prev => prev.status !== 'declined' && prev.status !== 'accepted'));
                    setAcceptedInvites(data.project_members.filter(prev => prev.status === 'accepted'));
                }
               
        } catch (error) {
                console.log('Error has occured');
        }
            finally{
                 setLoadingData(false);
            }
              }

    useEffect(()=>{
       invitedata()
    }, [user?.email])

    return(
        <NotificationContext.Provider value={{invite: inviteInfo, acceptedInvites, loadingdata, refetchData: invitedata}}>
            {children}
        </NotificationContext.Provider>
    )
}
export const useNotificationInfo = ()=>{
    const context = useContext(NotificationContext);
    if(!context){
        throw new Error('Error has occred');
    }
    return context;
}