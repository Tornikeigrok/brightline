import Cookies from "js-cookie";
import { useEffect, useState, useRef, InputHTMLAttributes } from "react";
import { getUrl } from "./Request";
import { useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AppHeader } from "./Shared";
import { useUser } from "./ProfileContext";
import { useNotificationInfo, FetchInvite } from "./NotiContext";
import socket from "./Socket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faFolderPlus, faUserPlus, faCircleInfo, faHouse, faPlus, faListCheck, faChartSimple, faBell, faArrowRightFromBracket, faSearch, faChevronDown, faGear, faCookieBite, faLightbulb, faPen, faTrash, faArrowRight, faCheck, faExclamation, faCode, faPalette, faBullhorn, faCalendar, faUser } from "@fortawesome/free-solid-svg-icons";
//Types for safety. Outside component so they are not created on every render

interface Task {
  id: number;
  task_title: string;
  deadline: string | null;
  status: string;
  project_id: number;
}
interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  created_by: string,
  email: string

}


type invitationStat =
  | "Invitation successfully sent"
  | "Seems like you have already sent invite to this person"
  | "idle"
  | "Person you are inviting does not exist"
  | "projectd ID not found"
  | "You cannot send yourself an invite";

function InvitePuts({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all text-sm ${className}`}
      {...rest}
    ></input>
  );
}

export const SecondPage = () => {
  const location = useLocation();
  const { invite, acceptedInvites } = useNotificationInfo();
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [docName, setdocName] = useState("");
  const [docDesc, setdocDesc] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);

  const [dueSoon, setDueSoon] = useState(0);
  const [percentage, setPercentage] = useState<{ [key: number]: number }>({});
  const [deadlines, setDeadlines] = useState<Task[]>([]);
  const [renameP, setrenameP] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const inputref = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profilehover, setProfileHover] = useState(false);
  const [sentInvite, setInviteSent] = useState<invitationStat>("idle");
  const [showNotification, setShowNotification] = useState(false);
  const [sharedDocs, setSharedDocs] = useState<Project[]>([]);
  const [currentTip] = useState(() => {
    const tips = [
      "Break large tasks into smaller, manageable pieces.",
      "Set deadlines to stay accountable.",
      "Review your progress weekly.",
      "Celebrate small wins along the way.",
      "Focus on one task at a time.",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  });
  const [Invite, setInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );


  //socket section -------------
  useEffect(()=>{
    if(!socket.connected){
      socket.connect();
    }

    socket.on('connect', ()=>{
      if(user?.email){
        socket.emit('register', user.email);
        socket.emit('onlineLocation', 'Dashboard page');
      }

    })
    if(socket.connected && user?.email){
      socket.emit('register', user.email);
    }
  

    return(()=>{
      socket.off('connect');
      socket.off('register');
      socket.off('onlineLocation');
      socket.off('member-left');
      socket.disconnect();
    })
  }, [user?.email])
 

  //get member count
  const [count, setCount] = useState< { [key: number]: number}>({});
  useEffect(()=>{
    const getData = async()=>{
      try {
        const response = await Promise.allSettled(
          projects.map((task)=>(
            fetch(getUrl(`memberCount/project_id?project_id=${task.id}`))
          ))
        )
        const data = await Promise.all(
          response.map((task)=>(
            task.status === 'fulfilled' && task.value.ok ? task.value.json() : null
          ))
        )
        let cc: { [key: number]:number} = {};

        data.forEach((task, index)=>{
          let currId = projects[index].id;
          cc[currId] = task.memberCount;
        })
        setCount(cc);
      } catch (error) {
        return;
      }
    }
    getData();
  }, [projects]);


  useEffect(() => {
    const displayOnReload = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(
          getUrl(`displayDocs/email?email=${user.email}`),
        );
        const data = await res.json();
        setProjects(data.projects);
      } catch (error) {
        return;
      }
    };
    displayOnReload();
  }, [user?.email]);

  useEffect(() => {
    const dueSoons = async () => {
      if (!projects || projects.length === 0) {
        setDueSoon(0);
        return;
      }
      try {
        const percentages: { [key: number]: number } = {};
        const response = await Promise.allSettled(
          projects.map((project) =>
            fetch(getUrl(`displayTasks/project_id?project_id=${project.id}`)),
          ),
        );
        const dataArray = await Promise.all(
          response.map((res) =>
            res.status === "fulfilled" && res.value.ok
              ? res.value.json()
              : null,
          ),
        );
        let allTasks: Task[] = [];

        dataArray.forEach((data, index) => {
          const projectId = projects[index].id;
          if (data?.tasks) {
            allTasks = [...allTasks, ...data.tasks];
            const onlyDone = data.tasks.filter(
              (el: Task) => el.status === "done",
            );
            percentages[projectId] = Math.round(
              (onlyDone.length / data.tasks.length) * 100,
            );
          } else {
            percentages[projectId] = 0;
          }
        });
        setDeadlines(allTasks);
        setPercentage(percentages);

        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const threeDaysFromNow = new Date(
          today.getTime() + 3 * 24 * 60 * 60 * 1000,
        );
        threeDaysFromNow.setHours(23, 59, 59, 999);
        const dueSoonTasks = allTasks.filter((task) => {
          if (!task.deadline || task.status === "done") return false;
          const deadlineDate = new Date(task.deadline);
          const deadlineDay = new Date(
            deadlineDate.getFullYear(),
            deadlineDate.getMonth(),
            deadlineDate.getDate(),
          );
          const isInRange =
            deadlineDay >= today && deadlineDay <= threeDaysFromNow;
          return isInRange;
        });
        setDueSoon(dueSoonTasks.length);
      } catch (error) {
        setDueSoon(0);
        return;
      }
    };
    dueSoons();
  }, [projects]);

  useEffect(() => {
    const handleCut = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        e.stopPropagation();
        setShowModal(true);
      }
      if (e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleCut, true);
    return () => {
      document.removeEventListener("keydown", handleCut, true);
    };
  }, []);

  //Display joined documents
  useEffect(()=>{
    const getData = async()=>{
     
      try {
        const res = await fetch(getUrl(`viewJoinedProjects/email?email=${user?.email}`));
        if(res.ok){
          const data = await res.json();
          setSharedDocs(data.projects);
        }
      } catch (error) {
        return;
      }
    }
   getData();
  }, [user?.email, location.state?.refreshShared]);
  

  useEffect(() => {
    const cuts = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        e.stopPropagation();
        inputref.current?.focus();
      }
    };
    document.addEventListener("keydown", cuts);
    return () => {
      document.removeEventListener("keydown", cuts);
    };
  }, []);

  useEffect(() => {
    if (Invite) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [Invite]);

  // Loading check AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const createProj = async () => {
   
    try {
      const res = await fetch(getUrl("createProject"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docName,
          description: docDesc,
          created_by: user?.first ?? "",
          email: user?.email ?? "",
        }),
      });
      if (res.ok) {
        toast.success("Project created successfully");
        displayDocs();
        setShowModal(false);
        setdocName("");
        setdocDesc("");
      }
      else if(res.status === 429){
        toast.error('Too many requests, only 5 projects/min allowed');
        return;
      }
      else if(res.status == 403){
        toast.error('Cannot create more projects. Delete one to create a new one');
        return;
      }

    } catch (error) {
      toast.error("Something went wrong");
      return;
    }
  };

  const displayDocs = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(getUrl(`displayDocs/email?email=${user.email}`));
      const data = await res.json();

      setProjects(data.projects);
    } catch (error) {
      return;
    }
  };

  const deleteProject = async (userId: number) => {
    try {
      await fetch(getUrl("deleteProject"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
        }),
      });
      setProjects(projects.filter((p) => p.id !== userId));
      toast.success("Project deleted");
    } catch (error) {
      return;
    }
  };

  const rename = async () => {
    if (renameP.length === 0) {
      toast.error("cannot have empty title");
      return;
    }
    try {
      const res = await fetch(getUrl("renameTitle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name: renameP,
        }),
      });
      if (res.ok) {
        displayDocs();
      }
    } catch (error) {
      return;
    }
  };

  function logout() {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    navigate("/");
  }

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const userProjects =
    searchQuery === ""
      ? projects
      : projects.filter((el) =>
          el.name.toUpperCase().startsWith(searchQuery.toUpperCase()),
        );

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  //Invite member part --------

  const inviteMember = async () => {
    if(inviteEmail === user?.email){
      setInviteSent('You cannot send yourself an invite');
      setInvite(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    try {
      const res = await fetch(getUrl(`inviteMember`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          project_id: selectedProjectId,
          invited_by: user?.email,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setInviteSent("Invitation successfully sent");
        setInvite(false);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else if (!data.success && data.message === "User not found in DB") {
        //User not found in DB
        setInviteSent("Person you are inviting does not exist");
        setInvite(false);
        setShowNotification(true); 
        setTimeout(() => setShowNotification(false), 3000); 
      } else if (
        !data.success &&
        data.message === "Project id not associated with any project"
      ) {
        setInviteSent("projectd ID not found");
        setInvite(false);
        setShowNotification(true); 
        setTimeout(() => setShowNotification(false), 3000); 
      } else {
        setInviteSent("Seems like you have already sent invite to this person");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      return;
    }
  };

  return (
    <div className="flex flex-1 overflow-auto flex-col min-h-screen bg-white text-neutral-900">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#171717",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
        }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faFolderPlus} className="text-neutral-600 text-sm" />
                </div>
                <span className="text-neutral-900 font-semibold">New Project</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Form onSubmit triggered");
                createProj();
              }}
              className="p-6"
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-neutral-500 mb-2">
                    Project name
                  </label>
                  <input
                    required
                    value={docName}
                    onChange={(e) => setdocName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200 outline-none transition-all text-sm"
                    type="text"
                    placeholder="e.g. Website Redesign"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-500 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={docDesc}
                    onChange={(e) => setdocDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200 outline-none transition-all resize-none h-24 text-sm"
                    placeholder="What is this project about?"
                  />
                </div>

                {/* Quick Templates */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-3">
                    Quick start
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: faCode, label: "Development" },
                      { icon: faPalette, label: "Design" },
                      { icon: faBullhorn, label: "Marketing" },
                    ].map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => {
                          setdocName(template.label + " Project");
                          setdocDesc(
                            `A new ${template.label.toLowerCase()} project`,
                          );
                        }}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition-all"
                      >
                        <FontAwesomeIcon icon={template.icon} className="text-neutral-500 text-sm" />
                        <span className="text-[11px] text-neutral-600">
                          {template.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {Invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setInvite(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserPlus} className="text-neutral-600 text-sm" />
                </div>
                <span className="text-neutral-900 font-semibold">
                  Invite to Project
                </span>
              </div>
              <button
                onClick={() => setInvite(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                inviteMember();
              }}
              className="p-6"
            >
              <div className="space-y-5">
                {/* Select Project */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-2">
                    Please enter the project ID you want invitee to join
                  </label>
                  <input
                    type="text"
                    placeholder="ID"
                    required
                    value={selectedProjectId ?? ""}
                    onChange={(e) =>{
                      const val = e.target.value;
                      if(val === ""){
                        setSelectedProjectId(null);
                        return;
                      }
                      const num = parseInt(val, 10);
                      if(!isNaN(num)){
                        setSelectedProjectId(num);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200 outline-none transition-all text-sm"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm text-neutral-500 mb-2">
                    Friend's email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    placeholder="friend@example.com"
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200 outline-none transition-all text-sm"
                  />
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 text-xs mt-0.5" />
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    They'll receive an invitation to join this project. They
                    must have an account to accept.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setInvite(false)}
                  className="px-4 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200 shadow-lg">
        <div className="h-full flex items-center justify-around px-2">
          <div className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faHouse} className="text-white text-sm" />
            </div>
            <span className="text-[10px] font-medium text-neutral-900">Dashboard</span>
          </div>
          <div onClick={() => navigate("/Tasks")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faListCheck} className="text-neutral-400 text-sm" />
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Tasks</span>
          </div>
          <div onClick={() => navigate("/Calendar")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendar} className="text-neutral-400 text-sm" />
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Calendar</span>
          </div>
          <div onClick={() => navigate("/Notifications")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBell} className="text-neutral-400 text-sm" />
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Alerts</span>
          </div>
          <div onClick={() => navigate("/Analytics")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faChartSimple} className="text-neutral-400 text-sm" />
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Analytics</span>
          </div>
        </div>
      </nav>

      {/* Top Header - Offset for sidebar on desktop */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 h-14 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left Section - Search */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-xs font-black">T</span>
              </div>
              <span className="text-[14px] font-bold text-neutral-900 tracking-tight">Taskflow</span>
            </div>

            {/* Search (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 w-72 hover:border-neutral-300 transition-all focus-within:border-neutral-400 focus-within:bg-white focus-within:shadow-sm">
              <FontAwesomeIcon icon={faSearch} className="text-neutral-400 text-xs" />
              <input
                ref={inputref}
                type="text"
                placeholder="Search projects..."
                className="bg-transparent border-none outline-none text-[13px] text-neutral-900 placeholder-neutral-400 w-full"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-400 text-[9px] font-mono">
                ⇧?
              </kbd>
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Due Soon Indicator - Desktop */}
            {dueSoon > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[11px] text-amber-700 font-medium">
                  {dueSoon} due soon
                </span>
              </div>
            )}

            {/* New Project Button (Desktop) */}
            <button
              onClick={() => setShowModal(true)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-[13px] font-semibold transition-all active:scale-[0.98] shadow-lg shadow-black/10"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
              <span>New Project</span>
            </button>

            {/* Separator - Desktop */}
            <div className="hidden lg:block w-px h-6 bg-neutral-200"></div>

            {/* Notification Bell */}
            <button
              onClick={() => navigate("/Notifications")}
              className="relative w-9 h-9 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-all"
            >
              <FontAwesomeIcon icon={faBell} className="text-sm" />
              {(invite && invite.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
              )}
            </button>

            {/* User Profile - Desktop */}
            <div
              onMouseEnter={() => setProfileHover(true)}
              onMouseLeave={() => setProfileHover(false)}
              className="relative hidden lg:flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-[11px] font-bold">
                  {user?.first?.charAt(0) ?? ""}
                  {user?.last?.charAt(0) ?? ""}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-semibold text-neutral-900">
                  {user?.first ?? ""}
                </p>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-[8px] text-neutral-400 transition-transform duration-200 ${profilehover ? "rotate-180" : ""}`}
                />
              </div>

              {/* Dropdown Menu */}
              <div
                className={`${profilehover ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"} transition-all duration-200 absolute top-full right-0 mt-1 w-[220px] bg-white border border-neutral-200 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50`}
              >
                {/* User Info Header */}
                <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-[12px] font-bold">
                      {user?.first?.charAt(0) ?? ""}
                      {user?.last?.charAt(0) ?? ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-900 truncate">
                        {user?.first ?? ""} {user?.last ?? ""}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {user?.email ?? ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all text-left">
                    <FontAwesomeIcon icon={faUser} className="text-[12px] w-4" />
                    <span className="text-[13px]">Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all text-left">
                    <FontAwesomeIcon icon={faGear} className="text-[12px] w-4" />
                    <span className="text-[13px]">Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all text-left">
                    <FontAwesomeIcon icon={faCookieBite} className="text-[12px] w-4" />
                    <span className="text-[13px]">Cookie Info</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="p-1.5 border-t border-neutral-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-left"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-[12px] w-4" />
                    <span className="text-[13px]">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar - Desktop Only */}
      <AppHeader 
        projLength={projects.length} 
        dueSoon={dueSoon} 
        user={user}
        onNewProject={() => setShowModal(true)}
        onInvite={() => setInvite(true)}
        inviteCount={invite?.length || 0}
      />

      {/* Main Content - Offset for sidebar on desktop */}
      <main className="flex-1 flex flex-col min-h-screen pt-14 pb-24 lg:pb-0 lg:pl-60">
        {/* Page Content */}
        <div className="flex-1 overflow-hidden px-6 lg:px-10 py-8 bg-white">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-1">
              {getGreeting()}, {user?.first ?? ""}
            </h1>
            <p className="text-base text-neutral-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Quick Actions + Upcoming Tasks Row */}
          {projects.length > 0 && (
            <div className=" grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
              {/* Upcoming Deadlines */}
              <div className=" lg:col-span-2 p-5 bg-neutral-50 min-h-[200px] max-h-[200px] overflow-auto rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-900">Upcoming</h3>
                  <Link to="/Tasks" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
                </div>
                {deadlines.filter(t => t.status !== 'done' && t.deadline).slice(0, 3).length > 0 ? (
                  <div className="space-y-2">
                    {deadlines
                      .filter(t => t.status !== 'done' && t.deadline)
                      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                      .slice(0, 3)
                      .map((task) => {
                        const daysLeft = Math.ceil((new Date(task.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const projectName = projects.find(p => p.id === task.project_id)?.name || '';
                        const isUrgent = daysLeft <= 2;
                        return (
                          <div 
                            key={task.id} 
                            className="flex items-center gap-3 p-3 bg-white rounded cursor-pointer hover:bg-neutral-100 transition-colors"
                            onClick={() => navigate(`/TaskPage/${task.project_id}`)}
                          >
                            <div className={`w-1 h-10 rounded-full ${isUrgent ? 'bg-amber-500' : 'bg-neutral-300'}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900 truncate">{task.task_title}</p>
                              <p className="text-xs text-neutral-400">{projectName}</p>
                            </div>
                            <span className={`text-xs font-medium ${isUrgent ? 'text-amber-600' : 'text-neutral-500'}`}>
                              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-sm py-4">No upcoming deadlines. You're all caught up!</p>
                )}
              </div>

              {/* Quick Tip / Motivation */}
              <div className="p-5 bg-neutral-900 text-white rounded-md flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faLightbulb} className="text-amber-400 text-sm" />
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Tip</span>
                </div>
                <p className="text-sm leading-relaxed flex-1">{currentTip}</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full py-2.5 bg-white text-neutral-900 font-medium text-sm rounded hover:bg-neutral-100 transition-colors"
                  >
                    + New Project
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Projects Section */}
          {projects && projects.length > 0 ? (
            <>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">Your Projects</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setInvite(true)}
                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                  >
                    Invite
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-black rounded transition-colors"
                  >
                    New Project
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="space-y-2">
                {userProjects && userProjects.length > 0 ? (
                  userProjects.map((el) => {
                    const progress = percentage[el.id] || 0;
                    const projectTasks = deadlines.filter(
                      (t) => t.project_id === el.id,
                    );
                    const totalTasks = projectTasks.length;
                    const completedTasks = projectTasks.filter(
                      (t) => t.status === "done",
                    ).length;

                    return (
                      <div
                        key={el.id}
                        className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 bg-neutral-50 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors"
                        onClick={() => navigate(`/TaskPage/${el.id}`)}
                      >
                        {/* Icon + Content */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0 ${
                            progress === 100 
                              ? "bg-emerald-500 text-white" 
                              : "bg-neutral-900 text-white"
                          }`}>
                            {progress === 100 ? "✓" : el.name.charAt(0)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              {editId === el.id ? (
                                <input
                                  type="text"
                                  className="text-base sm:text-lg font-semibold text-neutral-900 bg-white border border-neutral-300 rounded px-3 py-1 outline-none focus:border-neutral-500"
                                  autoFocus
                                  value={renameP}
                                  onClick={(e) => e.stopPropagation()}
                                  onBlur={() => { setEditId(null); rename(); }}
                                  onChange={(e) => setrenameP(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { setEditId(null); rename(); }}}
                                />
                              ) : (
                                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">{el.name}</h3>
                              )}
                              {(count[el.id] || 0) > 0 && (
                                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  {count[el.id] + 1} members
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-500 text-sm truncate">{el.description}</p>
                            <p>{el.id}</p>
                          </div>
                        </div>

                        {/* Stats + Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-shrink-0 pl-14 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{progress}%</p>
                            <p className="text-[11px] sm:text-xs text-neutral-400">{completedTasks}/{totalTasks} tasks</p>
                          </div>

                          {/* Progress Ring - Hidden on very small screens */}
                          <div className="hidden sm:block relative w-12 h-12 lg:w-14 lg:h-14">
                            <svg className="w-12 h-12 lg:w-14 lg:h-14 -rotate-90">
                              <circle cx="50%" cy="50%" r="20" fill="none" stroke="#e5e5e5" strokeWidth="4" className="lg:hidden" />
                              <circle cx="50%" cy="50%" r="24" fill="none" stroke="#e5e5e5" strokeWidth="4" className="hidden lg:block" />
                              <circle 
                                cx="50%" cy="50%" r="20" fill="none" 
                                stroke={progress === 100 ? "#10b981" : "#171717"} 
                                strokeWidth="4"
                                strokeLinecap="square"
                                strokeDasharray={`${progress * 1.26} 126`}
                                className="lg:hidden"
                              />
                              <circle 
                                cx="50%" cy="50%" r="24" fill="none" 
                                stroke={progress === 100 ? "#10b981" : "#171717"} 
                                strokeWidth="4"
                                strokeLinecap="square"
                                strokeDasharray={`${progress * 1.51} 151`}
                                className="hidden lg:block"
                              />
                            </svg>
                          </div>

                          {/* Mobile Progress Bar */}
                          <div className="sm:hidden w-16 h-2 bg-neutral-200 rounded-sm overflow-hidden">
                            <div 
                              className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-neutral-900'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditId(el.id); setrenameP(el.name); }}
                              className="p-2 hover:bg-white rounded text-neutral-400 hover:text-neutral-700 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPen} className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteProject(el.id); }}
                              className="p-2 hover:bg-red-50 rounded text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-neutral-500 text-base">
                      No projects match "<span className="font-medium text-neutral-900">{searchQuery}</span>"
                    </p>
                    <button onClick={() => setSearchQuery("")} className="mt-2 text-sm text-blue-600 hover:underline">
                      Clear search
                    </button>
                  </div>
                )}
              </div>

              {/* Shared Projects */}
              {sharedDocs && sharedDocs.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-6">Shared with you</h2>
                  <div className="space-y-2">
                    {sharedDocs.map((prj, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 sm:p-5 bg-neutral-50 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors"
                        onClick={() => navigate(`/TaskPage/${prj.id}`)}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0">
                          {prj.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">{prj.name}</h3>
                          <p className="text-neutral-500 text-sm">Shared by {prj.created_by || "Unknown"}</p>
                        </div>
                        <FontAwesomeIcon icon={faArrowRight} className="text-neutral-300" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Week Overview */}
              <section className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">This Week</h2>
                  <Link to="/Calendar" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Open Calendar →
                  </Link>
                </div>

                <div className="flex gap-1 sm:gap-2">
                  {[...Array(7)].map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isToday = i === 0;
                    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = date.getDate();

                    const currTasks = deadlines.filter((el) => {
                      if (!el.deadline || el.status === "done") return false;
                      const curr = new Date(el.deadline);
                      return curr.toDateString() === date.toDateString();
                    }).length;

                    return (
                      <div
                        key={i}
                        className={`flex-1 py-3 sm:py-4 rounded-md text-center transition-colors ${
                          isToday 
                            ? "bg-neutral-900 text-white" 
                            : "bg-neutral-50 hover:bg-neutral-100"
                        }`}
                      >
                        <p className={`text-[10px] sm:text-xs font-medium mb-1 ${isToday ? "text-neutral-400" : "text-neutral-400"}`}>
                          {dayName}
                        </p>
                        <p className={`text-lg sm:text-xl font-bold ${isToday ? "text-white" : "text-neutral-900"}`}>
                          {dayNum}
                        </p>
                        {currTasks > 0 && (
                          <p className={`text-[10px] sm:text-xs font-medium mt-1 ${isToday ? "text-emerald-400" : "text-amber-500"}`}>
                            {currTasks} task{currTasks > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            /* Empty State - Minimal & Inviting */
            <div className="flex flex-col items-center justify-center py-24 px-6">
              <div className="relative mb-8">
                {/* Pulsing ring */}
                <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-black/10 animate-ping" style={{animationDuration: '2s'}}></div>
                <div className="relative w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-xl shadow-black/20">
                  <FontAwesomeIcon icon={faPlus} className="text-2xl text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-neutral-900 mb-3 tracking-tight">
                Create your first project
              </h2>
              <p className="text-neutral-500 text-center max-w-sm mb-8">
                Projects help you organize tasks, set deadlines, and track your
                progress.
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="group relative px-8 py-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-semibold transition-all active:scale-[0.98] overflow-hidden shadow-xl shadow-black/20"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <p className="mt-6 text-neutral-500 text-xs">
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono mx-1">
                  ⇧
                </kbd>
                +
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono mx-1">
                  N
                </kbd>{" "}
                anytime
              </p>
            </div>
          )}
        
        </div>


        {/* Footer */}
        <footer className=" border-t border-neutral-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-18 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="text-neutral-900 text-sm font-semibold mb-4">
                  Shortcuts
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-neutral-500 text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono">
                      ⇧N
                    </kbd>
                    <span>New project</span>
                  </li>
                  <li className="flex items-center gap-2 text-neutral-500 text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono">
                      ⇧?
                    </kbd>
                    <span>Search</span>
                  </li>
                  <li className="flex items-center gap-2 text-neutral-500 text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono">
                      ⇧C
                    </kbd>
                    <span>Toggle sidebar</span>
                  </li>
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-neutral-900 text-sm font-semibold mb-4">
                  Navigate
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/Tasks"
                      className="text-neutral-500 hover:text-neutral-900 text-xs transition-colors"
                    >
                      All Tasks
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/Calendar"
                      className="text-neutral-500 hover:text-neutral-900 text-xs transition-colors"
                    >
                      Calendar View
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/Analytics"
                      className="text-neutral-500 hover:text-neutral-900 text-xs transition-colors"
                    >
                      Analytics
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-neutral-900 text-sm font-semibold mb-4">
                  Resources
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-neutral-500 hover:text-neutral-900 text-xs transition-colors"
                    >
                                           Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-neutral-500 hover:text-neutral-900 text-xs transition-colors"
                    >
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-neutral-500 hover:text-neutral-900 text-xs transition-colors"
                    >
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-neutral-900 text-sm font-semibold mb-4">
                  Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-neutral-500 text-xs">
                      All systems operational
                    </span>
                  </div>
                  <p className="text-neutral-400 text-xs">
                    {projects.length} projects · {deadlines.length} tasks
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">T</span>
                </div>
                <span className="text-neutral-500 text-xs">
                  Taskflow · Built for productivity
                </span>
              </div>
              <p className="text-neutral-400 text-xs">
                © {new Date().getFullYear()} · Made with focus
              </p>
            </div>
          </div>
        </footer>
        {/* Sliding Notification Toast */}
        <div
          className={`fixed right-4 top-24 z-50 transform transition-all duration-400 ease-out ${
            showNotification
              ? "translate-x-0 opacity-100"
              : "translate-x-[120%] opacity-0"
          }`}
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border min-w-[280px] max-w-[360px] ${
              sentInvite === "Invitation successfully sent"
                ? "bg-[#0a1a0f] border-emerald-500/20"
                : "bg-[#1a0a0a] border-red-500/20"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                sentInvite === "Invitation successfully sent"
                  ? "bg-emerald-500/20"
                  : "bg-red-500/20"
              }`}
            >
              <FontAwesomeIcon
                icon={sentInvite === "Invitation successfully sent" ? faCheck : faExclamation}
                className={`${sentInvite === "Invitation successfully sent" ? "text-emerald-400" : "text-red-400"} text-sm`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  sentInvite === "Invitation successfully sent"
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {sentInvite === "Invitation successfully sent"
                  ? "Success!"
                  : "Oops!"}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {sentInvite === "Invitation successfully sent" &&
                  "Invitation sent successfully"}
                {sentInvite === "projectd ID not found" &&
                  "Non-existent project ID, try another one"}
                {sentInvite === "Person you are inviting does not exist" &&
                  "User does not exist"}
                {sentInvite ===
                  "Seems like you have already sent invite to this person" &&
                  "Already invited this person"}
                {sentInvite === 'You cannot send yourself an invite' &&
                'You cannot send yourself an invite'
                }
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-white transition-colors flex-shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-0.5 rounded-full overflow-hidden bg-white/5">
            <div
              className={`h-full rounded-full ${
                sentInvite === "Invitation successfully sent"
                  ? "bg-emerald-500"
                  : "bg-red-500"
              } ${showNotification ? "animate-shrink" : ""}`}
              style={{
                animation: showNotification
                  ? "shrink 3s linear forwards"
                  : "none",
              }}
            ></div>
          </div>
        </div>

        <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
      </main>
    </div>
  );
};

export default SecondPage;
