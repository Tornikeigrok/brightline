import React, { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { getUrl } from "./Request";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "./Shared";


interface Task {
  id: number;
  project_id: number;
  task_title: string;
  task_description: string;
  status: string;
  deadline: string;
  assigned_to: string;
}

interface Project {
  id: number;
  name: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('month');

  // Fetch user profile
  useEffect(() => {
    const getProfile = async () => {
      try {
        const token = Cookies.get('token');
        const res = await fetch(getUrl('profile'), {
          method: "GET",
          headers: { 'Authorization': "Bearer " + token },
        });
        const data = await res.json();
        setUserEmail(data.email);
      } catch (error) {
        return;
      }
    };
    getProfile();
  }, []);


  //AI stuff section ------------
  const [aiResponse, setAiResponse] = useState("");
  const [aibox, setAiBox] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const calAi = async()=>{

    if(!userEmail) return;

      try {
         setSpinner(true);
         const res = await fetch(getUrl('summarizeCal'), {
          method: "POST",
          headers: {'Content-Type' : 'application/json'},
          body: JSON.stringify({
            email: userEmail
          })
         })
         const data = await res.json();
         if(res.ok){
            setAiResponse(data.aiSuggestion);
            setSpinner(false);
         }
      } catch (error) {
        setSpinner(false);
        return;
      }
  }

  // Fetch all projects and their tasks
  useEffect(() => {
    const fetchData = async () => {
      if (!userEmail) return; // Wait for userEmail to be fetched first
      
      setIsLoading(true);
      try {
        const token = Cookies.get('token');
        if (!token) {
          navigate('/');
          return;
        }
        
        // Fetch user's own projects
        const ownProjectsRes = await fetch(getUrl(`displayDocs/email?email=${userEmail}`));
        let allProjects: Project[] = [];
        
        if (ownProjectsRes.ok) {
          const ownProjectsData = await ownProjectsRes.json();
          allProjects = ownProjectsData.projects || [];
        }
        
        // Also fetch joined projects
        const joinedProjectsRes = await fetch(getUrl(`viewJoinedProjects/email?email=${userEmail}`));
        if (joinedProjectsRes.ok) {
          const joinedProjectsData = await joinedProjectsRes.json();
          if (joinedProjectsData.projects) {
            allProjects = [...allProjects, ...joinedProjectsData.projects];
          }
        }
        
        // Remove duplicates by id
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex((p) => p.id === project.id)
        );
        
        setProjects(uniqueProjects);

        // Fetch tasks from all projects
        const allTasks: Task[] = [];
        for (const project of uniqueProjects) {
          try {
            const taskRes = await fetch(getUrl(`displayTasks/project_id?project_id=${project.id}`));
            if (taskRes.ok) {
              const taskData = await taskRes.json();
              if (taskData.tasks) {
                allTasks.push(...taskData.tasks.map((t: Task) => ({ ...t, project_id: project.id })));
              }
            }
          } catch {
            continue;
          }
        }
        setTasks(allTasks);
      } catch (error) {
        console.error('Calendar data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate, userEmail]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getTasksForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => task.deadline && task.deadline.startsWith(dateStr));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isPast = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get week dates for week view
  const getWeekDates = (): Date[] => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTasksForFullDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return tasks.filter(task => task.deadline && task.deadline.startsWith(dateStr));
  };

  // Stats
  const upcomingTasks = tasks.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline >= today && t.status !== 'done';
  });

  const overdueTasks = tasks.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today && t.status !== 'done';
  });

  const thisWeekTasks = tasks.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return deadline >= today && deadline <= weekEnd;
  });

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500';
      case 'in-progress': return 'bg-amber-500';
      default: return 'bg-neutral-500';
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: React.ReactNode[] = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-1 lg:p-2"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDate(day);
      const isSelected = selectedDate &&
        day === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`
            aspect-square p-1 lg:p-2 rounded-xl cursor-pointer transition-all duration-200 relative group
            ${isToday(day) ? 'bg-black ring-1 ring-black' : ''}
            ${isSelected && !isToday(day) ? 'bg-neutral-900 ring-2 ring-neutral-800' : ''}
            ${!isSelected && !isToday(day) ? 'hover:bg-neutral-100' : ''}
            ${isPast(day) && !isToday(day) ? 'opacity-40' : ''}
          `}
        >
          <span className={`
            text-xs lg:text-sm font-medium
            ${isToday(day) ? 'text-white' : 'text-neutral-700'}
            ${isSelected && !isToday(day) ? 'text-white' : ''}
          `}>
            {day}
          </span>
          
          {/* Task indicators */}
          {dayTasks.length > 0 && (
            <div className="absolute bottom-1 lg:bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
              {dayTasks.slice(0, 3).map((task, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${getStatusColor(task.status)}`}
                />
              ))}
              {dayTasks.length > 3 && (
                <span className="text-[8px] text-neutral-500 ml-0.5">+{dayTasks.length - 3}</span>
              )}
            </div>
          )}

          {/* Hover preview for desktop */}
          {dayTasks.length > 0 && (
            <div className="hidden lg:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              <div className="bg-white border border-neutral-200 rounded-lg p-2 shadow-lg min-w-[150px]">
                <p className="text-[10px] text-neutral-400 mb-1">{dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}</p>
                {dayTasks.slice(0, 2).map((task, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                    <span className="text-[10px] text-neutral-700 truncate">{task.task_title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-[#f5f6f8] min-h-screen">
      {/* Left Sidebar - Desktop Only */}
      <AppHeader projLength={projects.length} />

      {/* Header - Offset for sidebar on desktop */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 h-14 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-xs font-black">T</span>
              </div>
              <span className="text-[14px] font-bold text-neutral-900 tracking-tight">Taskflow</span>
            </div>

            {/* Page Title - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                <i className="fa-regular fa-calendar text-neutral-600 text-sm"></i>
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-neutral-900">Calendar</h1>
                <p className="text-[10px] text-neutral-500">{tasks.filter(t => t.deadline).length} tasks scheduled</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white text-[11px] font-bold shadow-md">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-lg">
        <div className="h-full flex items-center justify-around px-2">
          <div onClick={() => navigate('/SecondPage')} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-house text-neutral-400 text-sm"></i>
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Dashboard</span>
          </div>
          <div onClick={() => navigate('/Tasks')} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-list-check text-neutral-400 text-sm"></i>
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Tasks</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <i className="fa-regular fa-calendar text-white text-sm"></i>
            </div>
            <span className="text-[10px] font-medium text-neutral-900">Calendar</span>
          </div>
          <div onClick={() => navigate('/Notifications')} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-bell text-neutral-400 text-sm"></i>
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Alerts</span>
          </div>
          <div onClick={() => navigate('/Analytics')} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-chart-simple text-neutral-400 text-sm"></i>
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Analytics</span>
          </div>
        </div>
      </nav>

      {/* Main Content - Offset for sidebar on desktop */}
      <main className="relative pt-14 pb-20 lg:pb-8 lg:pl-60 min-h-screen">


       

        <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
          
          {/* Stats - Compact Inline */}
          <div className="flex items-center gap-6 mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
              <span className="text-neutral-500 text-xs">Upcoming</span>
              <span className="text-neutral-900 text-sm font-semibold">{upcomingTasks.length}</span>
            </div>
            <div className="w-px h-4 bg-neutral-200"></div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
              <span className="text-neutral-500 text-xs">This Week</span>
              <span className="text-neutral-900 text-sm font-semibold">{thisWeekTasks.length}</span>
            </div>
            <div className="w-px h-4 bg-neutral-200"></div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-neutral-500 text-xs">Done</span>
              <span className="text-neutral-900 text-sm font-semibold">{tasks.filter(t => t.status === 'done').length}</span>
            </div>
            {overdueTasks.length > 0 && (
              <>
                <div className="w-px h-4 bg-neutral-200"></div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-neutral-500 text-xs">Overdue</span>
                  <span className="text-red-500 text-sm font-semibold">{overdueTasks.length}</span>
                </div>
              </>
            )}
            <div className="ml-auto flex-shrink-0">
              <button
                onClick={() => { setAiBox(true); calAi(); }}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 text-violet-700 text-xs font-medium hover:from-violet-100 hover:to-indigo-100 hover:border-violet-300 transition-all duration-200 group"
              >
                <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
                </svg>
                AI Suggestions
              </button>
            </div>
          </div>

          {/* AI Suggestions Panel */}
          {aibox && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end pointer-events-none">
              {/* Backdrop - mobile only */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto sm:hidden"
                onClick={() => setAiBox(false)}
              />
              {/* Panel */}
              <div className="relative pointer-events-auto w-full sm:w-[420px] sm:max-w-[420px] sm:mr-4 sm:mb-4 lg:mr-8 rounded-t-2xl sm:rounded-2xl bg-white border border-neutral-200 shadow-2xl shadow-black/10 flex flex-col max-h-[85vh] sm:max-h-[600px] overflow-hidden">
                {/* Gradient top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">AI Suggestions</p>
                      <p className="text-[10px] text-neutral-400">Smart productivity plan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiBox(false)}
                    className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                  {spinner ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-violet-100" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-neutral-800 font-medium">Analyzing your tasks</p>
                        <p className="text-xs text-neutral-400 mt-1">Generating personalized suggestions…</p>
                      </div>
                    </div>
                  ) : aiResponse ? (
                    <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
                        </svg>
                      </div>
                      <p className="text-sm text-neutral-500">No suggestions yet</p>
                      <p className="text-xs text-neutral-400">Click the button again to generate</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!spinner && aiResponse && (
                  <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
                    <p className="text-[10px] text-neutral-400">Powered by AI</p>
                    <button
                      onClick={calAi}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 text-xs hover:bg-violet-100 transition-all"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          <div className=" flex flex-col lg:flex-row gap-6">
            {/* Calendar Section */}
            <div className="flex-1">
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Calendar Header */}
                <div className="bg-neutral-50 p-4 lg:p-6 border-b border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 tracking-tight">
                        {monthNames[currentDate.getMonth()]} <span className="text-neutral-400">{currentDate.getFullYear()}</span>
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1">
                        {tasks.filter(t => t.deadline).length} tasks scheduled
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToToday}
                        className="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 transition-all text-xs font-medium shadow-sm"
                      >
                        Today
                      </button>
                      <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
                        <button
                          onClick={() => setView('month')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
                        >
                          Month
                        </button>
                        <button
                          onClick={() => setView('week')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
                        >
                          Week
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={prevMonth}
                      className="w-9 h-9 rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-all flex items-center justify-center shadow-sm"
                    >
                      <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <div className="flex items-center gap-2">
                      {dayNames.map(day => (
                        <div key={day} className="w-10 lg:w-14 text-center text-[10px] lg:text-xs text-neutral-400 font-medium">
                          {day}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={nextMonth}
                      className="w-9 h-9 rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-all flex items-center justify-center shadow-sm"
                    >
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                {isLoading ? (
                  <div className="p-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin"></div>
                  </div>
                ) : view === 'month' ? (
                  <div className="p-4 lg:p-6">
                    <div className="grid grid-cols-7 gap-1 lg:gap-2">
                      {renderCalendarDays()}
                    </div>
                  </div>
                ) : (
                  <div className=" p-4 lg:p-6">
                    <div className="space-y-2">
                      {getWeekDates().map((date, i) => {
                        const dayTasks = getTasksForFullDate(date);
                        const isCurrentDay = date.toDateString() === new Date().toDateString();
                        return (
                          <div
                            key={i}
                            className={`flex gap-4 p-3 rounded-xl transition-all ${isCurrentDay ? 'bg-neutral-50 border border-neutral-200' : 'hover:bg-neutral-50'}`}
                          >
                            <div className={`w-12 text-center ${isCurrentDay ? 'text-neutral-900' : 'text-neutral-400'}`}>
                              <p className="text-[10px] font-medium">{dayNames[date.getDay()]}</p>
                              <p className="text-lg font-bold">{date.getDate()}</p>
                            </div>
                            <div className="flex-1 space-y-2">
                              {dayTasks.length > 0 ? dayTasks.map((task, j) => (
                                <div
                                  key={j}
                                  onClick={() => navigate(`/TaskPage/${task.project_id}`)}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-white border border-neutral-100 hover:border-neutral-200 cursor-pointer transition-all"
                                >
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                                  <span className="text-xs text-neutral-800 flex-1 truncate">{task.task_title}</span>
                                  <span className="text-[10px] text-neutral-400">{getProjectName(task.project_id)}</span>
                                </div>
                              )) : (
                                <p className="text-xs text-neutral-600 py-2">No tasks</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Selected Date & Upcoming */}
            <div className="w-full lg:w-80 space-y-4">
              {/* Selected Date Tasks */}
              {selectedDate && (
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {getTasksForFullDate(selectedDate).length} tasks
                    </p>
                  </div>
                  <div className="p-3 max-h-[200px] overflow-y-auto">
                    {getTasksForFullDate(selectedDate).length > 0 ? (
                      <div className="space-y-2">
                        {getTasksForFullDate(selectedDate).map((task, i) => (
                          <div
                            key={i}
                            onClick={() => navigate(`/TaskPage/${task.project_id}`)}
                            className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-all border border-neutral-100"
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${getStatusColor(task.status)}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-neutral-800 font-medium truncate">{task.task_title}</p>
                                <p className="text-[10px] text-neutral-500 mt-0.5">{getProjectName(task.project_id)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mb-2">
                          <i className="fa-regular fa-calendar text-neutral-400 text-sm"></i>
                        </div>
                        <p className="text-xs text-neutral-400">No tasks for this day</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming Tasks */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Upcoming</h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Next 7 days</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <i className="fa-solid fa-arrow-trend-up text-blue-400 text-xs"></i>
                  </div>
                </div>
                <div className="p-3 max-h-[300px] overflow-y-auto">
                  {upcomingTasks.slice(0, 5).length > 0 ? (
                    <div className="space-y-2">
                      {upcomingTasks.slice(0, 5).map((task, i) => (
                        <div
                          key={i}
                          onClick={() => navigate(`/TaskPage/${task.project_id}`)}
                          className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-all group border border-neutral-100"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${task.status === 'in-progress' ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-neutral-200'}`}>
                              <span className="text-[10px] font-bold text-neutral-500">
                                {new Date(task.deadline).getDate()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-neutral-800 font-medium truncate">{task.task_title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`}></div>
                                <span className="text-[10px] text-neutral-500">{getProjectName(task.project_id)}</span>
                              </div>
                            </div>
                            <i className="fa-solid fa-arrow-right text-[10px] text-neutral-300 group-hover:text-neutral-600 transition-colors"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2">
                        <i className="fa-solid fa-check text-emerald-500 text-sm"></i>
                      </div>
                      <p className="text-xs text-neutral-500">All caught up!</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">No upcoming tasks</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Overdue Alert */}
              {overdueTasks.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <i className="fa-solid fa-bell text-red-500 text-xs"></i>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">{overdueTasks.length} Overdue</p>
                      <p className="text-[10px] text-red-400">Needs attention</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {overdueTasks.slice(0, 3).map((task, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/TaskPage/${task.project_id}`)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-red-50 border border-red-100 cursor-pointer transition-all"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-[11px] text-neutral-700 truncate flex-1">{task.task_title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;