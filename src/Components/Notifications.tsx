import { AppHeader } from "./Shared";
import { SharedHeader } from "./SharedHeader";
import { useUser } from "./ProfileContext";
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUrl } from "./Request";
import { useNotificationInfo, FetchInvite } from "./NotiContext";
import socket from "./Socket";

interface inviteRule {
    project_id: number,
    role: string,
    invited_at: string,
    invited_by: string,
    user_email: string,
    status: string
}
interface acceptedRule {
    email: string,
    project_id: number,
    message: string
}

export const NotificationsContent = () => {
    const [windowOption, setWindowOption] = useState<'received' | 'sent'>('received');
    const [sentInv, setSentInv] = useState<inviteRule[]>([]);
    const [useraccepted, setUserAccepted] = useState<acceptedRule[]>([]);

    const { invite, refetchData } = useNotificationInfo();
    const { user } = useUser();
    const navigate = useNavigate();

    function logout() {
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        navigate('/');
    }

    const fetchSentInvites = async (email: string) => {
        try {
            const res = await fetch(getUrl(`selfSentInvites/email/limit/offset?email=${email}&limit=${7}&offset=${0}`));
            if (res.ok) {
                const data = await res.json();
                setSentInv(data.project_members);
            }
        } catch {
            return;
        }
    };

    useEffect(() => {
        if (!user?.email) return;
        fetchSentInvites(user.email);
    }, [user?.email]);

    // Poll received invitations every 30s (no server socket event for new invites)
    useEffect(() => {
        if (!user?.email) return;
        const interval = setInterval(() => {
            refetchData();
        }, 30000);
        return () => clearInterval(interval);
    }, [user?.email]);

    useEffect(() => {
        if (!socket.connected) socket.connect();

        const handleConnect = () => {
            if (user?.email) socket.emit('register', user.email);
        };

        const handleAccepted = (data: acceptedRule) => {
            setUserAccepted(curr => [...curr, data]);
            // Refresh sent list so status flips from "pending" to "accepted"
            if (user?.email) fetchSentInvites(user.email);
        };

        const handleDeclined = () => {
            // Refresh sent list so status flips from "pending" to "declined"
            if (user?.email) fetchSentInvites(user.email);
        };

        socket.on('connect', handleConnect);
        socket.on('invitation-accepted', handleAccepted);
        socket.on('invitation-declined', handleDeclined);

        if (socket.connected && user?.email) {
            socket.emit('register', user.email);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('invitation-accepted', handleAccepted);
            socket.off('invitation-declined', handleDeclined);
        };
    }, [user?.email]);

    const acceptInvite = async (project_id: number) => {
        try {
            const res = await fetch(getUrl('acceptInvitation'), {
                method: 'POST',
                headers: { "Content-Type": 'application/json' },
                body: JSON.stringify({ email: user?.email, project_id })
            });
            const data = await res.json();
            if (data.success && data.projects) {
                navigate(`/TaskPage/${project_id}`);
                refetchData();
            }
        } catch {
            return;
        }
    };

    const declineInvite = async (id: number) => {
        try {
            const res = await fetch(getUrl('declineInvitation'), {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user?.email, project_id: id })
            });
            if (res.ok) refetchData();
        } catch {
            return;
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <SharedHeader first={user?.first || ''} last={user?.last || ''} userEmail={user?.email || ''} onLogout={logout} />

            <div className="flex min-h-screen relative">
                {/* Desktop sidebar */}
                <AppHeader projLength={0} />

                {/* Mobile bottom nav */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-lg">
                    <div className="h-full flex items-center justify-around px-2">
                        <div onClick={() => navigate("/SecondPage")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <i className="fa-solid fa-house text-neutral-400 text-sm"></i>
                            </div>
                            <span className="text-[10px] font-medium text-neutral-500">Dashboard</span>
                        </div>
                        <div onClick={() => navigate("/Tasks")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <i className="fa-solid fa-list-check text-neutral-400 text-sm"></i>
                            </div>
                            <span className="text-[10px] font-medium text-neutral-500">Tasks</span>
                        </div>
                        <div onClick={() => navigate("/Calendar")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <i className="fa-regular fa-calendar text-neutral-400 text-sm"></i>
                            </div>
                            <span className="text-[10px] font-medium text-neutral-500">Calendar</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                                <i className="fa-solid fa-bell text-white text-sm"></i>
                            </div>
                            <span className="text-[10px] font-medium text-neutral-900">Alerts</span>
                        </div>
                        <div onClick={() => navigate("/Analytics")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <i className="fa-solid fa-chart-simple text-neutral-400 text-sm"></i>
                            </div>
                            <span className="text-[10px] font-medium text-neutral-500">Analytics</span>
                        </div>
                    </div>
                </nav>

                {/* Main content */}
                <main className="flex-1 flex flex-col min-h-screen pt-16 pb-24 lg:pb-0 lg:pl-60">
                    <div className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
                        <div className="max-w-2xl mx-auto">

                            {/* Page header */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">Inbox</p>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Notifications</h1>
                                    </div>
                                    {invite && invite.length > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            {invite.length} pending
                                        </span>
                                    )}
                                </div>
                                <div className="mt-5 h-px bg-neutral-100"></div>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1 bg-neutral-100 rounded-xl border border-neutral-200 mb-6">
                                <button
                                    onClick={() => setWindowOption('received')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${windowOption === 'received' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'}`}
                                >
                                    <i className="fa-solid fa-inbox text-xs"></i>
                                    <span>Received</span>
                                    {invite && invite.length > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${windowOption === 'received' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-200 text-neutral-500'}`}>
                                            {invite.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setWindowOption('sent')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${windowOption === 'sent' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'}`}
                                >
                                    <i className="fa-solid fa-paper-plane text-xs"></i>
                                    <span>Sent</span>
                                    {sentInv && sentInv.length > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${windowOption === 'sent' ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-200 text-neutral-500'}`}>
                                            {sentInv.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Received tab */}
                            {windowOption === 'received' && (
                                <div>
                                    {/* Real-time accepted banners */}
                                    {useraccepted.length > 0 && (
                                        <div className="mb-4 space-y-2">
                                            {useraccepted.map((u, index) => (
                                                <div key={index} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <i className="fa-solid fa-check text-emerald-600 text-xs"></i>
                                                    </div>
                                                    <p className="text-sm text-emerald-800">
                                                        <span className="font-semibold">{u.email}</span> accepted your invitation to Project #{u.project_id}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {invite && invite.length > 0 ? (
                                        <div className="space-y-4">
                                            {invite.map((inv, index) => (
                                                <div key={index} className="relative overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-2xl"></div>

                                                    <div className="p-5 sm:p-6 pl-6 sm:pl-7">
                                                        {/* Top row */}
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-100">
                                                                    <i className="fa-solid fa-user-plus text-[9px]"></i>
                                                                    Project Invitation
                                                                </span>
                                                                <span className="text-[11px] text-neutral-400">
                                                                    {new Date(inv.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                                                                Pending
                                                            </span>
                                                        </div>

                                                        {/* Avatar + message */}
                                                        <div className="flex items-start gap-3 mb-5">
                                                            <div className="relative flex-shrink-0">
                                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                                    {inv.invited_by.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white">
                                                                    <i className="fa-solid fa-envelope text-[8px] text-white"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-neutral-900 text-[15px] leading-relaxed">
                                                                    <span className="font-semibold">{inv.invited_by}</span>
                                                                    <span className="text-neutral-500"> invited you to collaborate on </span>
                                                                    <span className="font-semibold">Project #{inv.project_id}</span>
                                                                </p>
                                                                <p className="text-neutral-400 text-sm mt-0.5">
                                                                    You'll join as <span className="text-neutral-700 font-semibold">{inv.role}</span>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Details grid */}
                                                        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100 mb-5">
                                                            <div>
                                                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 font-semibold">From</p>
                                                                <p className="text-neutral-900 text-sm font-semibold truncate">{inv.invited_by}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 font-semibold">Project</p>
                                                                <p className="text-neutral-900 text-sm font-semibold">#{inv.project_id}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 font-semibold">Role</p>
                                                                <p className="text-neutral-900 text-sm font-semibold capitalize">{inv.role}</p>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                                            <button
                                                                onClick={() => acceptInvite(inv.project_id)}
                                                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-all active:scale-[0.98] shadow-sm text-center"
                                                            >
                                                                Accept Invitation
                                                            </button>
                                                            <button
                                                                onClick={() => declineInvite(inv.project_id)}
                                                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-neutral-500 text-sm font-medium hover:text-neutral-800 hover:bg-neutral-100 transition-all border border-neutral-200 text-center"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 px-6">
                                            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mb-4 shadow-sm">
                                                <i className="fa-regular fa-bell text-2xl text-neutral-300"></i>
                                            </div>
                                            <h2 className="text-neutral-900 font-semibold text-lg mb-1">All caught up</h2>
                                            <p className="text-neutral-400 text-sm text-center max-w-xs">No pending notifications. We'll let you know when something arrives.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sent tab */}
                            {windowOption === 'sent' && (
                                <div>
                                    {sentInv.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 px-6">
                                            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mb-4 shadow-sm">
                                                <i className="fa-regular fa-paper-plane text-2xl text-neutral-300"></i>
                                            </div>
                                            <h2 className="text-neutral-900 font-semibold text-lg mb-1">No sent invitations</h2>
                                            <p className="text-neutral-400 text-sm text-center max-w-xs">Invitations you send to collaborate on projects will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                                            {/* Table header */}
                                            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
                                                <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold">Invited User</span>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold hidden sm:block">Date</span>
                                                    <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold w-24 text-right">Status</span>
                                                </div>
                                            </div>
                                            {sentInv.map((inv, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items-center justify-between px-5 py-4 bg-white hover:bg-neutral-50 transition-colors ${index !== sentInv.length - 1 ? 'border-b border-neutral-100' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-neutral-600 text-xs font-bold flex-shrink-0">
                                                            {inv.user_email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-neutral-900 text-sm font-medium truncate">{inv.user_email}</p>
                                                            <p className="text-neutral-400 text-xs mt-0.5">
                                                                Project #{inv.project_id} · <span className="capitalize">{inv.role}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6 flex-shrink-0">
                                                        <span className="text-neutral-400 text-xs hidden sm:block">
                                                            {new Date(inv.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize w-24 justify-center ${inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : inv.status === 'declined' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inv.status === 'accepted' ? 'bg-emerald-500' : inv.status === 'declined' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                                            {inv.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export const Notifications = () => {
    return (
        <FetchInvite>
            <NotificationsContent />
        </FetchInvite>
    );
};

export default Notifications;
