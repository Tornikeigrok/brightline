import Cookies from 'js-cookie';
import { useEffect, useState, useRef } from 'react';
import { getUrl } from './Request';
import { Toaster } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from './Shared';
import { useUser } from './ProfileContext';

interface Proj {
   created_at: string,
   created_by: string,
   id: number,
   email: string,
   description: string,
   name: string
}
interface Task {
   id: number,
   task_title: string,
   deadline: string | null,
   status: string,
   project_id: number,
   projectName: string
}

export const Tasks = () => {
   const {user, loading} = useUser();
   const navigate = useNavigate();
  
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
   }, []);

   function logout() {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      navigate('/');
   }

   useEffect(() => {
      const handleCut = (e: KeyboardEvent) => {
         if (e.shiftKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault(); e.stopPropagation();
         }
      }
      document.addEventListener('keydown', handleCut, true);
      return () => document.removeEventListener('keydown', handleCut, true);
   }, [])

   const rref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      const cuts = (e: KeyboardEvent) => {
         if (e.shiftKey && e.key === '?') {
            e.preventDefault(); e.stopPropagation();
            rref.current?.focus();
         }
      }
      document.addEventListener('keydown', cuts);
      return () => document.removeEventListener('keydown', cuts);
   }, [])

   const [allProjects, setallProjects] = useState<Proj[]>([]);

   useEffect(() => {
      const displaydoc = async () => {
         if (!user?.email) return;
         try {
            const res = await fetch(getUrl(`displayDocs/email?email=${user?.email}`))
            const data = await res.json();
            setallProjects(data.projects);
         } catch { return; }
      }
      displaydoc();
   }, [user?.email])

   const [Tasks, setTasks] = useState<Task[]>([])
   useEffect(() => {
      const displayalltasks = async () => {
         try {
            let combinedTasks: Task[] = [];
            const response = await Promise.allSettled(
               allProjects.map(project => fetch(getUrl(`displayTasks/project_id?project_id=${project.id}`)))
            )
            const dataArray = await Promise.all(
               response.map(task => task.status === 'fulfilled' && task.value.ok ? task.value.json() : null)
            )
            dataArray.forEach((data, index) => {
               if (data?.tasks) {
                  const tasksWithProject = data.tasks.map((task: Task) => ({
                     ...task, projectName: allProjects[index].name
                  }));
                  combinedTasks = [...combinedTasks, ...tasksWithProject];
               }
            })
            setTasks(combinedTasks);
         } catch { return; }
      }
      displayalltasks();
   }, [allProjects])

   const [pickStatus, setpickStatus] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
   const [searchQuery, setSearchQuery] = useState("");
   const [profilehover, setProfileHover] = useState(false);

   const todoCount = Tasks.filter(t => t.status === 'todo').length;
   const activeCount = Tasks.filter(t => t.status === 'in-progress').length;
   const doneCount = Tasks.filter(t => t.status === 'done').length;

   const displayedTasks = pickStatus === 'all' ? Tasks : Tasks.filter(t => t.status === pickStatus);
   const query = searchQuery === '' ? displayedTasks : displayedTasks.filter(el => el.task_title.toLowerCase().includes(searchQuery.toLowerCase()));

   const groupTasksByDate = (tasks: Task[]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const groups: { [key: string]: Task[] } = {
         'Overdue': [], 'Today': [], 'Tomorrow': [],
         'This Week': [], 'Later': [], 'No Date': []
      };

      tasks.forEach(task => {
         if (!task.deadline) { groups['No Date'].push(task); return; }
         const deadline = new Date(task.deadline);
         deadline.setHours(0, 0, 0, 0);
         if (deadline < today && task.status !== 'done') groups['Overdue'].push(task);
         else if (deadline.getTime() === today.getTime()) groups['Today'].push(task);
         else if (deadline.getTime() === tomorrow.getTime()) groups['Tomorrow'].push(task);
         else if (deadline < nextWeek) groups['This Week'].push(task);
         else groups['Later'].push(task);
      });
      return groups;
   };

   const groupedTasks = groupTasksByDate(query);
   const completionPercentage = Tasks.length > 0 ? Math.round((doneCount / Tasks.length) * 100) : 0;

   return (
      <div className="min-h-screen bg-white text-neutral-900">
         <Toaster
            position='bottom-center'
            toastOptions={{
               style: {
                  background: '#171717',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '14px',
               }
            }}
         />

         <div className="flex min-h-screen relative">
            {/* Left Sidebar - Desktop Only */}
            <AppHeader projLength={Tasks && Tasks.length > 0 ? Tasks.length : 0}/>

            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 lg:left-60 h-14 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm">
               <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                  {/* Left Section */}
                  <div className="flex items-center gap-3 lg:gap-4">
                     {/* Mobile Logo */}
                     <div className="flex lg:hidden items-center gap-2.5">
                        <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                           <span className="text-white text-xs font-black">T</span>
                        </div>
                        <span className="text-[14px] font-bold text-neutral-900 tracking-tight">Taskflow</span>
                     </div>

                     {/* Search */}
                     <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 w-72 hover:border-neutral-300 transition-all focus-within:border-neutral-400 focus-within:bg-white focus-within:shadow-sm">
                        <i className="fa-solid fa-search text-neutral-400 text-xs"></i>
                        <input
                           ref={rref}
                           type="text"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="Search tasks..."
                           className="bg-transparent border-none outline-none text-[13px] text-neutral-900 placeholder-neutral-400 w-full"
                        />
                        <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-400 text-[9px] font-mono">⇧?</kbd>
                     </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex items-center gap-2 lg:gap-3">
                     {/* Stats Badge - Desktop */}
                     {Tasks.length > 0 && (
                        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200">
                           <span className="text-[11px] text-neutral-600 font-medium">
                              {Tasks.length - doneCount} remaining
                           </span>
                        </div>
                     )}

                     {/* Separator */}
                     <div className="hidden lg:block w-px h-6 bg-neutral-200"></div>

                     {/* User Profile */}
                     <div 
                        onMouseEnter={() => setProfileHover(true)} 
                        onMouseLeave={() => setProfileHover(false)}  
                        className="relative hidden lg:flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
                     >
                        <div className="relative">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-[11px] font-bold">
                              {user?.first?.charAt(0)}{user?.last?.charAt(0)}
                           </div>
                           <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <p className="text-[12px] font-semibold text-neutral-900">{user?.first}</p>
                           <i className={`fa-solid fa-chevron-down text-[8px] text-neutral-400 transition-transform duration-200 ${profilehover ? 'rotate-180' : ''}`}></i>
                        </div>

                        {/* Dropdown Menu */}
                        <div className={`${profilehover ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'} transition-all duration-200 absolute top-full right-0 mt-1 w-[220px] bg-white border border-neutral-200 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50`}>
                           <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-[12px] font-bold">
                                    {user?.first?.charAt(0)}{user?.last?.charAt(0)}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-neutral-900 truncate">{user?.first} {user?.last}</p>
                                    <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="p-1.5">
                              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all text-left">
                                 <i className="fa-regular fa-user text-[12px] w-4"></i>
                                 <span className="text-[13px]">Profile</span>
                              </button>
                              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all text-left">
                                 <i className="fa-solid fa-gear text-[12px] w-4"></i>
                                 <span className="text-[13px]">Settings</span>
                              </button>
                           </div>
                           <div className="p-1.5 border-t border-neutral-100">
                              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-left">
                                 <i className="fa-solid fa-arrow-right-from-bracket text-[12px] w-4"></i>
                                 <span className="text-[13px]">Sign Out</span>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-lg">
               <div className="h-full flex items-center justify-around px-2">
                  <div onClick={() => navigate("/SecondPage")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-house text-neutral-400 text-sm"></i>
                     </div>
                     <span className="text-[10px] font-medium text-neutral-500">Dashboard</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <i className="fa-solid fa-list-check text-white text-sm"></i>
                     </div>
                     <span className="text-[10px] font-medium text-neutral-900">Tasks</span>
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
                  <div onClick={() => navigate("/Analytics")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-chart-simple text-neutral-400 text-sm"></i>
                     </div>
                     <span className="text-[10px] font-medium text-neutral-500">Analytics</span>
                  </div>
               </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen pt-14 pb-24 lg:pb-0 lg:pl-60">
               <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 py-8">
                  <div className="max-w-3xl mx-auto">

                     {/* Page Header */}
                     <div className={`mb-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-start justify-between gap-4">
                           <div>
                              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">My Tasks</h1>
                              <p className="text-neutral-500 text-sm mt-1">
                                 {Tasks.length === 0 ? 'No tasks yet' : `${Tasks.length - doneCount} remaining · ${doneCount} completed`}
                              </p>
                           </div>
                           
                           {/* Progress Circle */}
                           {Tasks.length > 0 && (
                              <div className="flex items-center gap-4">
                                 <div className="hidden sm:block text-right">
                                    <span className="text-3xl font-bold text-neutral-900 tabular-nums">{completionPercentage}</span>
                                    <span className="text-neutral-400 text-lg">%</span>
                                    <p className="text-[11px] text-neutral-500 -mt-1">complete</p>
                                 </div>
                                 <div className="w-14 h-14 relative">
                                    <svg className="w-full h-full -rotate-90">
                                       <circle cx="28" cy="28" r="24" fill="none" stroke="#f5f5f5" strokeWidth="3" />
                                       <circle cx="28" cy="28" r="24" fill="none" 
                                          stroke={completionPercentage === 100 ? '#10b981' : '#171717'} 
                                          strokeWidth="3"
                                          strokeDasharray={150.8}
                                          strokeDashoffset={150.8 - (completionPercentage / 100) * 150.8}
                                          strokeLinecap="round"
                                          className="transition-all duration-700"
                                       />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center sm:hidden">
                                       <span className="text-xs font-bold text-neutral-900">{completionPercentage}%</span>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Status Summary */}
                        {Tasks.length > 0 && (
                           <div className="flex items-center gap-6 mt-6">
                              <div className="flex items-center gap-2">
                                 <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>
                                 <span className="text-sm text-neutral-600">{todoCount} to do</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                 <span className="text-sm text-neutral-600">{activeCount} in progress</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                 <span className="text-sm text-neutral-600">{doneCount} done</span>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Mobile Search */}
                     <div className="lg:hidden mb-6">
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
                           <i className="fa-solid fa-search text-neutral-400 text-xs"></i>
                           <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search tasks..."
                              className="bg-transparent border-none outline-none text-[13px] text-neutral-900 placeholder-neutral-400 w-full"
                           />
                        </div>
                     </div>

                     {/* Filter Tabs */}
                     <div className={`flex items-center gap-2 mb-8 overflow-x-auto pb-2 transition-all duration-500 delay-75 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {([
                           { key: 'all' as const, label: 'All', count: Tasks.length },
                           { key: 'todo' as const, label: 'To Do', count: todoCount },
                           { key: 'in-progress' as const, label: 'In Progress', count: activeCount },
                           { key: 'done' as const, label: 'Done', count: doneCount },
                        ]).map(tab => (
                           <button
                              key={tab.key}
                              onClick={() => setpickStatus(tab.key)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                                 ${pickStatus === tab.key
                                    ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
                                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
                           >
                              {tab.label}
                              {tab.count > 0 && (
                                 <span className={`ml-2 tabular-nums ${pickStatus === tab.key ? 'text-white/60' : 'text-neutral-400'}`}>
                                    {tab.count}
                                 </span>
                              )}
                           </button>
                        ))}
                     </div>

                     {/* Task List */}
                     {query.length > 0 ? (
                        <div className={`space-y-8 transition-all duration-500 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                           {Object.entries(groupedTasks).map(([groupName, tasks]) => {
                              if (tasks.length === 0) return null;

                              const groupStyles: { [key: string]: { text: string, dot: string } } = {
                                 'Overdue': { text: 'text-red-600', dot: 'bg-red-500' },
                                 'Today': { text: 'text-amber-600', dot: 'bg-amber-500' },
                                 'Tomorrow': { text: 'text-blue-600', dot: 'bg-blue-500' },
                                 'This Week': { text: 'text-neutral-700', dot: 'bg-neutral-400' },
                                 'Later': { text: 'text-neutral-500', dot: 'bg-neutral-300' },
                                 'No Date': { text: 'text-neutral-400', dot: 'bg-neutral-200' },
                              };

                              return (
                                 <div key={groupName}>
                                    <div className="flex items-center gap-3 mb-3">
                                       <div className={`w-2 h-2 rounded-full ${groupStyles[groupName].dot}`}></div>
                                       <span className={`text-xs font-semibold uppercase tracking-wider ${groupStyles[groupName].text}`}>{groupName}</span>
                                       <span className="text-xs text-neutral-400 tabular-nums">{tasks.length}</span>
                                       <div className="flex-1 h-px bg-neutral-100"></div>
                                    </div>

                                    <div className="space-y-2">
                                       {tasks.map((task, idx) => {
                                          const deadlineDate = task.deadline ? new Date(task.deadline) : null;
                                          const today = new Date();
                                          today.setHours(0, 0, 0, 0);
                                          const isOverdue = deadlineDate && deadlineDate < today && task.status !== 'done';

                                          return (
                                             <div
                                                key={task.id}
                                                onClick={() => navigate(`/TaskPage/${task.project_id}`)}
                                                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all border
                                                   ${task.status === 'done'
                                                      ? 'bg-neutral-50 border-neutral-100 opacity-60 hover:opacity-80'
                                                      : isOverdue
                                                         ? 'bg-red-50 border-red-100 hover:border-red-200 hover:shadow-sm'
                                                         : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                                                   }`}
                                                style={{ animation: mounted ? `taskSlideIn 0.3s ease-out ${idx * 30}ms both` : 'none' }}
                                             >
                                                {/* Status Indicator */}
                                                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all
                                                   ${task.status === 'done'
                                                      ? 'bg-emerald-500'
                                                      : task.status === 'in-progress'
                                                         ? 'border-2 border-amber-500'
                                                         : 'border-2 border-neutral-300 group-hover:border-neutral-400'
                                                   }`}>
                                                   {task.status === 'done' && <i className="fa-solid fa-check text-[8px] text-white"></i>}
                                                   {task.status === 'in-progress' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                   <span className={`text-sm block truncate ${task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900 font-medium'}`}>
                                                      {task.task_title}
                                                   </span>
                                                </div>

                                                {/* Meta */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                   <span className="hidden sm:block text-xs text-neutral-400 truncate max-w-[120px] px-2 py-1 rounded-md bg-neutral-100">{task.projectName}</span>
                                                   {task.deadline && (
                                                      <span className={`text-xs tabular-nums px-2 py-1 rounded-md ${isOverdue ? 'bg-red-100 text-red-600' : 'text-neutral-500'}`}>
                                                         {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                      </span>
                                                   )}
                                                </div>

                                                <i className="fa-solid fa-chevron-right text-[10px] text-neutral-300 group-hover:text-neutral-500 transition-colors"></i>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     ) : (
                        <div className={`flex flex-col items-center justify-center py-20 text-center transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                           <div className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-5">
                              <i className={`fa-solid ${searchQuery ? 'fa-search' : 'fa-inbox'} text-2xl text-neutral-400`}></i>
                           </div>
                           <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                              {searchQuery ? 'No results found' : 'No tasks yet'}
                           </h3>
                           <p className="text-neutral-500 text-sm max-w-[280px]">
                              {searchQuery ? `Nothing matches "${searchQuery}"` : 'Create a project and add tasks to get started'}
                           </p>
                           {!searchQuery && (
                              <Link to="/SecondPage" className="mt-6 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20">
                                 Create Project
                              </Link>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </main>
         </div>

         <style>{`
            @keyframes taskSlideIn {
               from { opacity: 0; transform: translateY(8px); }
               to { opacity: 1; transform: translateY(0); }
            }
         `}</style>
      </div>
   )
}

export default Tasks;
