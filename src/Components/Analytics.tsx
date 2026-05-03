import { useEffect, useState, useMemo } from "react";
import { getUrl } from "./Request";
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";
import { AppHeader } from "./Shared";
import { useUser } from "./ProfileContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple, faLayerGroup, faCheck, faSpinner,
  faCircle, faCalendarDays, faChartPie, faChevronDown,
  faUser, faGear, faArrowRightFromBracket
} from "@fortawesome/free-solid-svg-icons";

interface projectRule{
    name: string,
    id: number,
    description:string,
    created_at: string
 }
interface Task {
  id: number;
  task_title: string;
  deadline: string | null;
  status: string;
  project_id: number;
}

export const Analytics = () => {
    const {user, loading} = useUser();
    const navigate = useNavigate();

    const [profileOpen, setProfileOpen] = useState(false);

    function logout(){
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        navigate('/');
    }

    const [allProjects, setAllProjects] = useState<projectRule[]>([]);

    useEffect(()=>{
        if(!user?.email) return;
        const getProjs = async()=>{
            try {
                const res = await fetch(getUrl(`displayDocs/email?email=${user?.email}`))
                const data = await res.json();
                setAllProjects(data.projects);
            } catch (error) {
                return;
            }
        }
        getProjs();
    }, [user?.email])

    const [allTasks, setAllTasks] = useState<Task[]>([]);
    useEffect(()=>{
        const getTasks = async()=>{
            try {
                const response = await Promise.allSettled(
                    allProjects.map((el)=>(
                        fetch(getUrl(`displayTasks/project_id?project_id=${el.id}`))
                    ))
                )
                const parseEach = await Promise.all(
                    response.map((el)=>(
                        el.status === 'fulfilled' && el.value.ok ? el.value.json() : null
                    ))
                )
                let taskArr: Task[] = [];
                parseEach.forEach((task)=>{
                   if(task?.tasks){
                     taskArr = [...taskArr, ...task.tasks];
                   }
                })
                setAllTasks(taskArr);
            } catch (error) {
                return;
            }
        }
        getTasks();
    }, [allProjects])

    const getMonday = (given: Date)=>{
        const givenDate = new Date(given);
        const dayOfWeek = givenDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        givenDate.setDate(givenDate.getDate() + diff);
        givenDate.setHours(0,0,0,0);
        return givenDate;
    }

    const dayLabels = Array.from({length: 7}).map((_, day)=>{
        const today = getMonday(new Date());
        today.setDate(today.getDate() + day);
        return today.toLocaleDateString('en-US',{weekday: 'short'});
    })

    const todaysTasks = useMemo(()=>{
        const today = getMonday(new Date());
        return Array.from({ length: 7 }).map((_, i)=>{
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            return allTasks.filter((task)=>{
                if(!task.deadline) return false;
                const taskD = new Date(task.deadline);
                taskD.setHours(0,0,0,0);
                return taskD.toDateString() === date.toDateString();
            })
        })
    }, [allTasks])

    const todoStatus = allTasks.filter(task => task.status === 'todo');
    const inprogressStatus = allTasks.filter(task => task.status === 'in-progress');
    const doneStatus = allTasks.filter(task => task.status === 'done');
    const todoperc = (todoStatus.length / allTasks.length) * 100;
    const progressperc = (inprogressStatus.length / allTasks.length) * 100;
    const doneperc = (doneStatus.length / allTasks.length) * 100;

const maxTasks = Math.max(...todaysTasks.map(task => task.length), 1);

    return (
        <div className="bg-[#f8f8f9] min-h-screen">

            {/* Light top header — matches SecondPage */}
            <header className="fixed top-0 left-0 right-0 lg:left-60 h-14 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm">
                <div className="h-full px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FontAwesomeIcon icon={faChartSimple} className="text-neutral-400 text-sm" />
                        <span className="text-[13px] font-semibold text-neutral-800">Analytics</span>
                        {allTasks.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[11px] font-medium">
                                {allTasks.length} tasks
                            </span>
                        )}
                    </div>

                    {/* Profile */}
                    <div
                        className="relative"
                        onMouseEnter={() => setProfileOpen(true)}
                        onMouseLeave={() => setProfileOpen(false)}
                    >
                        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-[10px] font-bold">
                                {user?.first?.charAt(0)}{user?.last?.charAt(0)}
                            </div>
                            <span className="hidden lg:block text-[12px] font-medium text-neutral-700">{user?.first}</span>
                            <FontAwesomeIcon icon={faChevronDown} className={`text-[9px] text-neutral-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <div className="absolute top-full right-0 h-2 w-full" />
                        <div className={`absolute top-[calc(100%+8px)] right-0 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl shadow-black/8 overflow-hidden transition-all duration-150 ${profileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
                            <div className="px-3 py-2.5 border-b border-neutral-100">
                                <p className="text-[12px] font-semibold text-neutral-900">{user?.first} {user?.last}</p>
                                <p className="text-[11px] text-neutral-400 truncate">{user?.email}</p>
                            </div>
                            <div className="p-1">
                                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 text-[12px] transition-colors text-left">
                                    <FontAwesomeIcon icon={faUser} className="w-3.5 text-neutral-400" />
                                    Profile
                                </button>
                                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 text-[12px] transition-colors text-left">
                                    <FontAwesomeIcon icon={faGear} className="w-3.5 text-neutral-400" />
                                    Settings
                                </button>
                            </div>
                            <div className="p-1 border-t border-neutral-100">
                                <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 text-[12px] transition-colors text-left">
                                    <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-3.5" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <AppHeader projLength={allTasks.length} />

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
                    <div onClick={() => navigate("/Notifications")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                            <i className="fa-solid fa-bell text-neutral-400 text-sm"></i>
                        </div>
                        <span className="text-[10px] font-medium text-neutral-500">Alerts</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                            <i className="fa-solid fa-chart-simple text-white text-sm"></i>
                        </div>
                        <span className="text-[10px] font-medium text-neutral-900">Analytics</span>
                    </div>
                </div>
            </nav>

            <main className="pt-14 lg:pl-60 pb-24 min-h-screen">
                <div className="px-6 lg:px-10 py-10 max-w-6xl">

                    {/* Hero row */}
                    <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mb-1">Workspace Overview</p>
                            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-none">
                                {allTasks.length > 0 ? `${Math.round(doneperc || 0)}% complete` : 'No data yet'}
                            </h1>
                            <p className="text-sm text-neutral-400 mt-2">
                                {allTasks.length > 0
                                    ? `${doneStatus.length} of ${allTasks.length} tasks done across ${allProjects.length} project${allProjects.length !== 1 ? 's' : ''}`
                                    : 'Add projects and tasks to see analytics'}
                            </p>
                        </div>
                        {allTasks.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl self-start sm:self-auto">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-semibold text-emerald-700">{inprogressStatus.length} in progress</span>
                            </div>
                        )}
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {/* Total — anchor card, dark */}
                        <div className="bg-neutral-900 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faLayerGroup} className="text-white text-xs" />
                                </div>
                                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Total</span>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-white tracking-tight">{allTasks.length}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">tasks total</p>
                            </div>
                        </div>

                        {/* Done */}
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-xs" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Done</span>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-neutral-900 tracking-tight">{doneStatus.length}</p>
                                <div className="mt-2.5 h-1 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${doneperc || 0}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Active */}
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faSpinner} className="text-amber-600 text-xs" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Active</span>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-neutral-900 tracking-tight">{inprogressStatus.length}</p>
                                <div className="mt-2.5 h-1 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${progressperc || 0}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* To Do */}
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col justify-between min-h-[120px]">
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCircle} className="text-neutral-400 text-xs" />
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">To Do</span>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-neutral-900 tracking-tight">{todoStatus.length}</p>
                                <div className="mt-2.5 h-1 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-neutral-400 rounded-full transition-all duration-700" style={{ width: `${todoperc || 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Weekly bar chart — wider */}
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-200 p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-sm font-semibold text-neutral-900">This Week</h2>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">Tasks due per day</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCalendarDays} className="text-neutral-500 text-xs" />
                                </div>
                            </div>

                            <div className="flex items-end justify-between h-[180px] gap-1.5">
                                {todaysTasks.map((task, index) => {
                                    const isToday = index === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                                    const barH = task.length > 0
                                        ? Math.max((task.length / maxTasks) * 148, 16)
                                        : 8;
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                            {task.length > 0 && (
                                                <span className={`text-[10px] font-semibold tabular-nums ${isToday ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                                    {task.length}
                                                </span>
                                            )}
                                            {task.length === 0 && <span className="text-[10px]">&nbsp;</span>}
                                            <div
                                                className={`w-full max-w-[36px] rounded-lg transition-all duration-300 ${
                                                    isToday
                                                        ? 'bg-neutral-900 group-hover:bg-neutral-700'
                                                        : task.length > 0
                                                            ? 'bg-neutral-200 group-hover:bg-neutral-300'
                                                            : 'bg-neutral-100'
                                                }`}
                                                style={{ height: `${barH}px` }}
                                            />
                                            <span className={`text-[10px] font-medium ${isToday ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                                {dayLabels[index]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Donut + breakdown — narrower */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-neutral-900">Status Split</h2>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">Task distribution</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faChartPie} className="text-neutral-500 text-xs" />
                                </div>
                            </div>

                            {/* Donut */}
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f3f4f6" strokeWidth="11" />
                                    {allTasks.length > 0 && (
                                        <>
                                            <circle cx="50" cy="50" r="38" fill="transparent"
                                                stroke="#d1d5db" strokeWidth="11" strokeLinecap="round"
                                                strokeDasharray={`${todoperc * 2.39} 239`}
                                                strokeDashoffset="0"
                                                className="transition-all duration-700"
                                            />
                                            <circle cx="50" cy="50" r="38" fill="transparent"
                                                stroke="#f59e0b" strokeWidth="11" strokeLinecap="round"
                                                strokeDasharray={`${progressperc * 2.39} 239`}
                                                strokeDashoffset={`${-todoperc * 2.39}`}
                                                className="transition-all duration-700"
                                            />
                                            <circle cx="50" cy="50" r="38" fill="transparent"
                                                stroke="#10b981" strokeWidth="11" strokeLinecap="round"
                                                strokeDasharray={`${doneperc * 2.39} 239`}
                                                strokeDashoffset={`${-(todoperc + progressperc) * 2.39}`}
                                                className="transition-all duration-700"
                                            />
                                        </>
                                    )}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-neutral-900 text-2xl font-bold tabular-nums">{allTasks.length}</span>
                                    <span className="text-neutral-400 text-[10px]">tasks</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-3">
                                {[
                                    { label: 'To Do', count: todoStatus.length, perc: todoperc, color: 'bg-neutral-300' },
                                    { label: 'In Progress', count: inprogressStatus.length, perc: progressperc, color: 'bg-amber-500' },
                                    { label: 'Done', count: doneStatus.length, perc: doneperc, color: 'bg-emerald-500' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                <span className="text-xs text-neutral-600">{item.label}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-neutral-900 tabular-nums">{item.count}</span>
                                        </div>
                                        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.perc || 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

export default Analytics;
