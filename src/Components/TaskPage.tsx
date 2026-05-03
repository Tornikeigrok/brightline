import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { getUrl } from "./Request";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import socket from "./Socket";
import { useUser } from "./ProfileContext";

interface rule {
  id: number;
  created_by: string;
  name: string;
  description: string;
  created_at: string;
  assignedTo: string;
}

type userEmail = {
  email: string;
  first: string;
  last: string;
};

interface taskRulesP {
  deadline: string;
  id: number;
  project_id: number;
  status: string;
  task_description: string;
  task_title: string;
  assigned_to: string;
}
interface members {
  member_first: string;
  member_last: string;
  member_email: string;
  inviter_first: string;
  inviter_last: string;
  inviter_email: string;
  role: string;
  isOnline: string;
  currPage: string;
}

interface leftMembers{
  email: string,

}

export const PracPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get project ID from URL

  const [expand, setExpand] = useState<number | null>(null);

  // ============================
  // USER AUTHENTICATION & PROFILE
  // ============================
  const [userEmail, setuserEmail] = useState("");
  const {user} = useUser();
  const [projectInfo, setprojectInfo] = useState<rule | null>(null);
  const [alltasks, setallTasks] = useState<taskRulesP[]>([]);

  // Fetch user profile on component mount
  useEffect(() => {
    const getDoc = async () => {
      try {
        const token = Cookies.get("token");
        const res = await fetch(getUrl("profile"), {
          method: "GET",
          headers: { Authorization: "Bearer " + token },
        });
        const data: userEmail = await res.json();
        setuserEmail(data.email);
      } catch (error) {
        return;
      }
    };
    getDoc();
  }, []);

  //Return all members on a given project
  const [userEmails, setuserEmails] = useState<members[]>([]);
  const [memberLoaded, setMembersLoaded] = useState(false);
  const isOwner = userEmails.some(user => user.inviter_email === userEmail);
  useEffect(() => {
    const getdata = async () => {
      try {
        const res = await fetch(
          getUrl(`returnMembers/project_id?project_id=${id}`),
        );
        const data = await res.json();
        setuserEmails(data.members);
        setMembersLoaded(true);
      } catch (error) {
        setMembersLoaded(true);
        return;
      }
    };
    getdata();
  }, [id]);


  const [memberLeft, setMemberLeft] = useState<leftMembers[]>([]);

  useEffect(() => {
    if(!userEmail || !id) return;
    if (!socket.connected) {
      socket.connect();
    }
    socket.on("connect", () => {
      if (userEmail) {
        socket.emit("register", userEmail);
        socket.emit("onlineLocation", "In project");
        socket.emit("join-project", id); //send to backend which project ID the user just opened
      }
    });
    if (socket.connected && userEmail) {
      socket.emit("register", userEmail);
      socket.emit("onlineLocation", "In project");
      socket.emit("join-project", id);
    }
     socket.on('member-left', data=>{
      setMemberLeft(prev => [...prev, {email: data.email}]);
    })

    socket.on("task-added", (data) => {
      // Only add if the task has a valid id
      if (!data || !data.id) return;
      setallTasks((prev) => {
        const exist = prev.some((task) => task.id === data.id);
        if (exist) return prev;
        return [...prev, data];
      });
    });

    return () => {
      socket.off("connect");
      socket.off("register");
      socket.off("onlineLocation");
      socket.off("join-project");
      socket.off('member-left');
      socket.off("task-added");
      socket.disconnect();
    };
  }, [userEmail, id]);

  // ============================
  // PROJECT DATA FETCHING
  // ============================
  // Fetch specific project info based on URL param
  useEffect(() => {
    const getInfo = async () => {
      if (!id) return;
      try {
        const res = await fetch(getUrl(`getProject/${id}`));
        if (!res.ok) {
          navigate("/SecondPage");
          return;
        }
        const data = await res.json();
        setprojectInfo(data.project);
      } catch (error) {
        navigate("/SecondPage");
        return;
      }
    };
    getInfo();
  }, [id]);

  //AI API endpoint
  const [expandAi, setExpandAi] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [aispin, setAispin] = useState(false);
  const [ailimit, setAiLimit] = useState(false);
  const summerizeTasks = async()=>{
    if(ailimit)return;
    try {
        setAispin(true);
        const res = await fetch(getUrl("summarizeTasks"), {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            email: userEmail,
            project_id: id
          })
        })
         const data = await res.json();
        if(res.ok){
          setAiContent(data.aiResponse);
          setAispin(false);
        }
        else if(res.status === 429){
          toast.error("Too many requests, 3 summarization/minute");
          setAispin(false);
          setAiLimit(true);
          return;
        }  
    } catch (error) {
      console.log(error);
      setAispin(false);
      return;
    }
  }

  //Check the member count on a given project
  const [count, setCount] = useState(0);
  useEffect(() => {
    const count = async () => {
      try {
        const res = await fetch(
          getUrl(`memberCount/project_id?project_id=${id}`),
        );
        const data = await res.json();
        setCount(data.memberCount);
      } catch (error) {
        return;
      }
    };
    count();
  }, [id]);

  // ============================
  // TASK MANAGEMENT - ADD TASK
  // ============================
  const [tasktitle, settaskTitle] = useState("");
  const [taskdesc, settaskDesc] = useState("");
  const [taskStatus, settaskStatus] = useState("todo");
  const [date, setDate] = useState<string | null>(null);

  // Add new task to the database
  const addTask = async () => {
    if (!id) {
      return;
    }
    try {
      const res = await fetch(getUrl("addTask"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_title: tasktitle,
          task_description: taskdesc,
          status: taskStatus,
          deadline: date,
          project_id: id,
          assigned_to: userEmail,
        }),
      });
      if (res.ok) {
        dispTasks();
        settaskTitle("");
        settaskDesc("");
        setDate(null);
        settaskStatus("todo");
      }
      else if(res.status === 429){
        toast.error('Too many requests, 10 tasks/min is allowed');
        return;
      }
    } catch (error) {
      return;
    }
  };

  // ============================
  // TASK MANAGEMENT - DISPLAY TASKS
  // ============================

  const dispTasks = async () => {
    if (!id) {
      return;
    }
    try {
      const res = await fetch(
        getUrl(`displayTasks/project_id?project_id=${id}`),
      );
      if (!res.ok) {
        setallTasks([]);
        return;
      }
      const data = await res.json();
      setallTasks(data?.tasks || []);
    } catch (error) {
      setallTasks([]);
      return;
    }
  };

  //On refresh display tasks and persist them
  useEffect(() => {
    const displayTasks = async () => {
      if (!id) {
        return;
      }
      try {
        const res = await fetch(
          getUrl(`displayTasks/project_id?project_id=${id}`),
        );
        if (!res.ok) {
          setallTasks([]);
          return;
        }
        const data = await res.json();
        setallTasks(data?.tasks || []);
      } catch (error) {
        setallTasks([]);
        return;
      }
    };
    displayTasks();
  }, [id]);

  // ============================
  // TASK MANAGEMENT - REMOVE TASK
  // ============================
  const removetask = async (taskId: number) => {
    if (taskId === null) {
      return;
    }
    try {
      const token = Cookies.get("token");
      const res = await fetch(getUrl("removeTask"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          id: taskId,
        }),
      });
      if (res.ok) {
        dispTasks();
      }
    } catch (error) {
      return;
    }
  };

  //change task title
  const [newTitle, setnewTitle] = useState("");
  const [clickedtasktitle, setclickedtasktitle] = useState<number | null>(null);
  const changeTaskTitle = async (tId: number) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(getUrl("changetaskTitle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tId,
          task_title: newTitle,
        }),
      });
      if (res.ok) {
        dispTasks();
      }
    } catch (error) {
      return;
    }
  };

  const markdone = async (markId: number, status: string) => {
    if (!markId) {
      return;
    }

    try {
      const token = Cookies.get('token');
      const res = await fetch(getUrl("markAsDone"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" ,
          'Authorization' : 'Bearer ' + token
        },
        body: JSON.stringify({
          id: markId,
          status: status,
        }),
      });
      if (res.ok && status === "done") {
        dispTasks();
        toast.success("Task Marked as Complete!");
      } else if (res.ok && status === "in-progress") {
        toast.success("Task Marked as in-progress");
        dispTasks();
      }
    } catch (error) {
      return;
    }
  };

  // Delete confirmation
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const confirmDelete = () => {
    if (deleteTaskId !== null) {
      removetask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const [profilehover, setProfileHover] = useState(false);

  function logout() {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    navigate("/");
  }

  //Chat section here
  const [dispChat, setDispChat] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [tmr, setTmr] = useState(false);
  const sendMsg = async()=>{
    try {
        const res = await fetch(getUrl(`sendMessage`), {
          method: 'POST',
          headers: {'Content-Type' : 'Application/json'},
          body:JSON.stringify({
            first: user?.first,
            last: user?.last,
            content: msgContent,
            project_id_chat: id,
            email: user?.email
          })
        })
        if(res.ok){
          messageDisplay();
        }
        else if(res.status === 429){
          manyMsg();
          return;
        }
    } catch (error) {
      return;
    }
  }
  function manyMsg(){
    setTmr(true);
    const timeout = setTimeout(()=>setTmr(false), 4000);
    return () => clearTimeout(timeout);
  }


  interface messageRule{
    first: string,
    last:string,
    time: string,
    content: string,
    email: string,
    id: number
  }
  const [chatMsg, setChatMsg] = useState<messageRule[]>([]);
  useEffect(()=>{
    const disMsg = async()=>{
      if(!id) return;
      try {
          const res = await fetch(getUrl(`checkMessages?id=${id}&limit=${20}&offset=${0}`));
          if(res.ok){
            const data = await res.json();
            setChatMsg(data.messages);
          }
      } catch (error) {
        return;
      }
    }
    disMsg();
  }, [id])
  function getTime(currTime: string){
    const date = new Date(currTime);
    const mins = String(date.getMinutes());
    const hrs = String(date.getHours());
    return `${hrs}:${mins}`;
  }
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(dispChat && chatRef.current){
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMsg, dispChat]);


   const messageDisplay = async(limit = 20, offset = 0)=>{
      if(!id) return;
      try {
          const res = await fetch(getUrl(`checkMessages?id=${id}&limit=${limit}&offset=${offset}`));
          if(res.ok){
            const data = await res.json();
            setChatMsg(data.messages);
          }
      } catch (error) {
        return;
      }
    }

    const loadMore = async()=>{
       if(!id) return;
      try {
          const res = await fetch(getUrl(`loadMoreMessages?id=${id}&limit=${20}&offset=${chatMsg.length}`));
          if(res.ok){
            const data = await res.json();
            setChatMsg((prev)=>{
             const existingId = new Set(prev.map((msg)=> msg.id));
             const newOnes = data.messages.filter((msg: messageRule) => !existingId.has(msg.id));
             return [...prev, ...newOnes]
            })
          }
      } catch (error) {
        return;
      }
    }


    //Leave project section
    const leaveProject = async()=>{
      try {
        const res = await fetch(getUrl('leaveProject'),{
          method: "POST",
          headers: {"Content-Type" : "application/json"},
          body: JSON.stringify({
            email: user?.email,
            project_id: id
          })
        })
        if(res.ok){
          console.log('member left successfully');
          navigate('/SecondPage', { state: { refreshShared: Date.now()}});
        }
      } catch (error) {
        return;
      }
    }



  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: "#171717",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
      }}></Toaster>

      {/* Delete Confirmation Modal */}
      {deleteTaskId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTaskId(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <i className="fa-solid fa-trash text-red-500 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">
                Delete Task?
              </h3>
              <p className="text-neutral-500 text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeleteTaskId(null)}
                  className="flex-1 px-4 py-3 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-neutral-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
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
          <div onClick={() => navigate("/Analytics")} className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-chart-simple text-neutral-400 text-sm"></i>
            </div>
            <span className="text-[10px] font-medium text-neutral-500">Analytics</span>
          </div>
        </div>
      </nav>

      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200">
        <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left Section - Logo & Back */}
          <div className="flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => navigate("/SecondPage")}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-all"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
            </button>
            <div className="hidden sm:block w-px h-8 bg-neutral-200"></div>
            <div className="flex items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => navigate("/SecondPage")}
              >
                <div className="relative w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-black tracking-tight">
                    T
                  </span>
                </div>
              </div>
              <div
                className="hidden sm:flex flex-col cursor-pointer"
                onClick={() => navigate("/SecondPage")}
              >
                <span className="text-[15px] font-bold text-neutral-900 tracking-tight">
                  BrightLine
                </span>
                <span className="text-[10px] text-neutral-400 font-medium -mt-0.5">
                  Workspace
                </span>
              </div>
            </div>

            {/* Center - Project Info */}
            {projectInfo && (
              <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-neutral-200">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                  {projectInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-neutral-900 text-sm font-semibold">
                    {projectInfo.name}
                  </h1>
                  <p className="text-neutral-400 text-[10px]">
                    {alltasks.length} tasks ·{" "}
                    {alltasks.filter((t) => t.status === "done").length} done
                  </p>
                </div>
              </div>
            )}

           <div className="relative group">
              <button 
                disabled={ailimit || aispin}
                onClick={()=> {summerizeTasks(); setExpandAi(true);}}
                className={`h-9 w-9 flex items-center justify-center rounded-lg text-white shadow-sm transition-all duration-200 ${
                  ailimit 
                    ? 'bg-neutral-300 cursor-not-allowed' 
                    : aispin
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 cursor-wait'
                    : 'bg-gradient-to-br from-yellow-400 to-amber-500 hover:shadow-md hover:scale-105'
                }`}
              >
                {aispin ? (
                  <i className="fa-solid fa-spinner animate-spin text-sm"></i>
                ) : ailimit ? (
                  <i className="fa-solid fa-clock text-sm"></i>
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                )}
              </button>
              {/* Custom Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                {ailimit ? 'Rate limited - wait 1 min' : aispin ? 'Analyzing...' : 'AI Summary'}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-neutral-900"></div>
              </div>
            </div>


            
             {memberLoaded && userEmail && !isOwner && (
              <div className="flex bg-red-500 hover:bg-red-400 px-2 py-0.5 md:px-4 md:py-2 rounded">
                     <button onClick={() => leaveProject()} className="text-xs text-white">Leave</button>
              </div>
            )}
  
          </div>

           

          {/* Right Section - Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {userEmails
                .filter((usr) => usr.member_email !== userEmail)
                .map((user, index) => (
                  <div
                    onMouseEnter={() => setExpand(index)}
                    onMouseLeave={() => setExpand(null)}
                    key={user.member_email}
                    className={`relative cursor-pointer w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 transition-all duration-150 hover:bg-neutral-200 hover:border-neutral-300 ${index !== 0 ? "-ml-1.5" : ""}`}
                    style={{
                      zIndex: expand === index ? 30 : userEmails.length - index,
                    }}
                  >
                    <span className="text-[10px] lg:text-[11px] font-medium text-neutral-600">
                      {user.member_first.charAt(0).toUpperCase()}
                      {user.member_last.charAt(0).toUpperCase()}
                    </span>

                    {/* Online indicator */}
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white"></div>
                    )}

                    {/* Tooltip - Clean & Minimal */}
                    <div
                      className={`absolute top-full mt-3 right-0 transition-all duration-150 pointer-events-none z-50 ${expand === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
                    >
                      <div className="bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
                        {/* User info */}
                        <div className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-medium text-neutral-600">
                                {user.member_first.charAt(0).toUpperCase()}
                                {user.member_last.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-neutral-900 truncate">
                                {user.member_first} {user.member_last}
                              </p>
                              <p className="text-[11px] text-neutral-500 truncate">
                                {user.member_email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status bar */}
                        <div className="px-3 py-2 border-t border-neutral-100 bg-neutral-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? "bg-emerald-500" : "bg-neutral-300"}`}
                              ></div>
                              <span
                                className={`text-[11px] ${user.isOnline ? "text-emerald-600" : "text-neutral-400"}`}
                              >
                                {user.isOnline ? "Online" : "Offline"}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wide">
                              {user.role}
                            </span>
                          </div>

                          {/* Current page - only if online */}
                          {user.isOnline && (
                            <div className="mt-2 pt-2 border-t border-neutral-200">
                              <span className="text-[10px] text-neutral-500">
                                {user.currPage === "In project"
                                  ? "Viewing this project"
                                  : user.currPage}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Member count badge */}
              {userEmails.length > 1 && (
                <span className="ml-2 text-[11px] text-neutral-400 font-medium hidden sm:inline">
                  +{userEmails.length - 1}
                </span>
              )}
            </div>

            {/* Progress indicator */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-neutral-500">
                  {alltasks.filter((t) => t.status === "done").length} done
                </span>
              </div>
              <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${alltasks.length > 0 ? (alltasks.filter((t) => t.status === "done").length / alltasks.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs font-bold text-neutral-900 tabular-nums">
                {alltasks.length > 0
                  ? Math.round(
                      (alltasks.filter((t) => t.status === "done").length /
                        alltasks.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>

            <div className="hidden lg:block w-px h-6 bg-neutral-200"></div>

            {/* User Profile */}
            <div
              onMouseEnter={() => setProfileHover(true)}
              onMouseLeave={() => setProfileHover(false)}
              className="relative flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-[11px] font-bold shadow-lg">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden lg:flex items-center gap-1.5">
                <p className="text-[12px] font-semibold text-neutral-900">
                  {userEmail ? userEmail.split("@")[0] : "User"}
                </p>
                <i
                  className={`fa-solid fa-chevron-down text-[8px] text-neutral-400 transition-transform duration-200 ${profilehover ? "rotate-180" : ""}`}
                ></i>
              </div>

              {/* Invisible bridge */}
              <div className="absolute top-full left-0 right-0 h-2"></div>

              {/* Dropdown Menu */}
              <div
                className={`${profilehover ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"} transition-all duration-200 absolute top-full right-0 pt-2 z-50`}
              >
                <div className="w-[220px] bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-[12px] font-bold">
                        {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 truncate">
                          {userEmail ? userEmail.split("@")[0] : "User"}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
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

                  {/* Logout */}
                  <div className="p-1.5 border-t border-neutral-100">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-left"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket text-[12px] w-4"></i>
                      <span className="text-[13px]">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation Bar - Desktop Only */}

      {/* Main Content Area */}
      <main className="min-h-screen pt-16 pb-20 lg:pb-0">
        {projectInfo && (
          <div className="min-h-[calc(100vh-64px)] flex flex-col">
            {/* Mobile Project Header */}
            <div className="lg:hidden flex-shrink-0 px-4 py-4 bg-neutral-50 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white text-sm font-bold">
                  {projectInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-neutral-900 text-base font-bold">
                    {projectInfo.name}
                  </h1>
                  <p className="text-neutral-500 text-xs">
                    {alltasks.length} tasks ·{" "}
                    {alltasks.filter((t) => t.status === "done").length}{" "}
                    completed
                  </p>
                </div>
              </div>
              {/* Mobile Progress */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${alltasks.length > 0 ? (alltasks.filter((t) => t.status === "done").length / alltasks.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-neutral-900 tabular-nums">
                  {alltasks.length > 0
                    ? Math.round(
                        (alltasks.filter((t) => t.status === "done").length /
                          alltasks.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 p-4 lg:p-6 lg:overflow-x-auto bg-neutral-50/50">
              {/* Mobile View - Stacked Sections */}
              <div className="lg:hidden space-y-6">
                {/* Mobile: To Do Section */}
                <div className="max-h-[290px] overflow-auto bg-white rounded-lg border border-neutral-200 shadow-sm">
                  <div className="p-4 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
                      <span className="text-neutral-900 text-sm font-semibold">
                        To Do
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 text-xs font-medium">
                        {alltasks.filter((t) => t.status === "todo").length}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    {alltasks
                      .filter((t) => t.status === "todo" && t.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-all"
                        >
                          {clickedtasktitle === task.id ? (
                            <input
                              type="text"
                              autoFocus
                              onBlur={() => {
                                setclickedtasktitle(null);
                                changeTaskTitle(task.id);
                              }}
                              value={newTitle}
                              onChange={(e) => {
                                setnewTitle(e.target.value);
                              }}
                              className="w-full text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 outline-none text-sm mb-2"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setclickedtasktitle(null);
                                  changeTaskTitle(task.id);
                                }
                              }}
                            />
                          ) : (
                            <h3 className="text-neutral-900 text-sm font-medium mb-2">
                              {task.task_title}
                            </h3>
                          )}
                          {task.task_description && (
                            <p className="text-neutral-500 text-xs mb-3 line-clamp-2">
                              {task.task_description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {task.deadline ? (
                              <span
                                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
                                  new Date(task.deadline) < new Date()
                                    ? "bg-red-100 text-red-600"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}
                              >
                                <i className="fa-regular fa-clock text-[10px]"></i>
                                {new Date(task.deadline).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-500">
                                No deadline
                              </span>
                            )}

                            {task.assigned_to === userEmail && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setclickedtasktitle(task.id);
                                    setnewTitle(task.task_title);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>

                                <button
                                  onClick={() => {
                                    markdone(task.id, "done");
                                  }}
                                  className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-regular fa-circle-check"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          {task.assigned_to && (
                            <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-neutral-600">
                                  {task.assigned_to.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-600">
                                {task.assigned_to === userEmail
                                  ? "You"
                                  : task.assigned_to}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    {alltasks.filter((t) => t.status === "todo").length ===
                      0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-3">
                          <i className="fa-solid fa-inbox text-neutral-500"></i>
                        </div>
                        <p className="text-neutral-600 text-xs font-medium">No tasks yet</p>
                        <p className="text-neutral-500 text-[10px] mt-1">
                          Add your first task below
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile: In Progress Section */}
                <div className="max-h-[290px] overflow-auto bg-amber-50/50 rounded-lg border border-amber-200/50 shadow-sm">
                  <div className="p-4 border-b border-amber-200/50 flex items-center justify-between sticky top-0 bg-amber-50/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-neutral-900 text-sm font-semibold">
                        In Progress
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-600 text-xs font-medium">
                        {
                          alltasks.filter((t) => t.status === "in-progress")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    {alltasks
                      .filter((t) => t.status === "in-progress" && t.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-white border border-amber-200 rounded-lg p-4 hover:border-amber-300 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            {clickedtasktitle === task.id ? (
                              <input
                                type="text"
                                autoFocus
                                onBlur={() => {
                                  setclickedtasktitle(null);
                                  changeTaskTitle(task.id);
                                }}
                                value={newTitle}
                                onChange={(e) => {
                                  setnewTitle(e.target.value);
                                }}
                                className="flex-1 text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 outline-none text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setclickedtasktitle(null);
                                    changeTaskTitle(task.id);
                                  }
                                }}
                              />
                            ) : (
                              <h3 className="text-neutral-900 text-sm font-medium">
                                {task.task_title}
                              </h3>
                            )}
                            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5 animate-pulse"></div>
                          </div>
                          {task.task_description && (
                            <p className="text-neutral-500 text-xs mb-3 line-clamp-2">
                              {task.task_description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            {task.deadline ? (
                              <span
                                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
                                  new Date(task.deadline) < new Date()
                                    ? "bg-red-100 text-red-600"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}
                              >
                                <i className="fa-regular fa-clock text-[10px]"></i>
                                {new Date(task.deadline).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">
                                No deadline
                              </span>
                            )}
                            {task.assigned_to === userEmail && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setclickedtasktitle(task.id);
                                    setnewTitle(task.task_title);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    markdone(task.id, "done");
                                  }}
                                  className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-regular fa-circle-check"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          {task.assigned_to && (
                            <div className="mt-3 pt-3 border-t border-amber-100 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-neutral-600">
                                  {task.assigned_to.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-600">
                                {task.assigned_to === userEmail
                                  ? "You"
                                  : task.assigned_to}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    {alltasks.filter((t) => t.status === "in-progress")
                      .length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                          <i className="fa-solid fa-hourglass-half text-amber-600 text-sm"></i>
                        </div>
                        <p className="text-neutral-600 text-xs font-medium">
                          No active tasks
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile: Done Section */}
                <div className="max-h-[290px] overflow-auto bg-emerald-50/50 rounded-lg border border-emerald-200/50 shadow-sm">
                  <div className="p-4 border-b border-emerald-200/50 flex items-center justify-between sticky top-0 bg-emerald-50/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-neutral-900 text-sm font-semibold">
                        Done
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-600 text-xs font-medium">
                        {alltasks.filter((t) => t.status === "done").length}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    {alltasks
                      .filter((t) => t.status === "done" && t.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="bg-white/80 border border-emerald-200 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <i className="fa-solid fa-check text-white text-[8px]"></i>
                            </div>
                            {clickedtasktitle === task.id ? (
                              <input
                                type="text"
                                autoFocus
                                onBlur={() => {
                                  setclickedtasktitle(null);
                                  changeTaskTitle(task.id);
                                }}
                                value={newTitle}
                                onChange={(e) => {
                                  setnewTitle(e.target.value);
                                }}
                                className="flex-1 text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 outline-none text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setclickedtasktitle(null);
                                    changeTaskTitle(task.id);
                                  }
                                }}
                              />
                            ) : (
                              <h3 className="text-neutral-400 text-sm font-medium line-through">
                                {task.task_title}
                              </h3>
                            )}
                          </div>
                          <div className="flex items-center justify-between ml-8">
                            <span className="text-xs text-emerald-500 font-medium">
                              Completed
                            </span>
                            {task.assigned_to === userEmail && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setclickedtasktitle(task.id);
                                    setnewTitle(task.task_title);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    markdone(task.id, "todo");
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-rotate-left text-[10px]"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          {task.assigned_to && (
                            <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2 ml-8">
                              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-neutral-600">
                                  {task.assigned_to.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-500">
                                {task.assigned_to === userEmail
                                  ? "You"
                                  : task.assigned_to}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    {alltasks.filter((t) => t.status === "done").length ===
                      0 && (
                      <p className="text-neutral-600 text-xs text-center py-6">
                        No tasks yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile: AI Summary Section */}
                <div className={`${expandAi ? "block" : "hidden"} bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden`}>
                  {/* Header with gradient accent */}
                  <div className="relative p-4 border-b border-neutral-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                          <i className="fa-solid fa-wand-magic-sparkles text-white text-sm"></i>
                        </div>
                        <div>
                          <span className="text-neutral-900 text-sm font-bold">AI Summary</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-neutral-500 text-[10px]">Powered by Gemini</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setExpandAi(false)}
                        className="w-8 h-8 rounded-lg hover:bg-white/80 text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 min-h-[200px] relative bg-gradient-to-b from-neutral-50/50 to-white">
                    {aispin ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-xl border-2 border-amber-200 border-t-amber-500 animate-spin"></div>
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce">
                            <i className="fa-solid fa-sparkles text-white text-[8px]"></i>
                          </div>
                        </div>
                        <p className="text-neutral-700 text-sm font-medium mt-4">Analyzing your tasks...</p>
                        <p className="text-neutral-500 text-xs mt-1">This may take a few seconds</p>
                      </div>
                    ) : aiContent ? (
                      <div className="space-y-4">
                        {/* Summary Card */}
                        <div className="relative bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"></div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <i className="fa-solid fa-lightbulb text-amber-500 text-xs"></i>
                              <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wider">Insights</span>
                            </div>
                            <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">{aiContent}</p>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => summerizeTasks()}
                            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 hover:from-amber-100 hover:to-yellow-100 text-xs font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
                            Regenerate
                          </button>
                          <button 
                            onClick={() => {navigator.clipboard.writeText(aiContent); toast.success('Copied to clipboard');}}
                            className="px-4 py-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-600 hover:bg-neutral-200 text-xs font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fa-regular fa-copy text-[10px]"></i>
                            Copy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                            <i className="fa-solid fa-wand-magic-sparkles text-amber-600 text-2xl"></i>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center">
                            <i className="fa-solid fa-question text-amber-500 text-[10px]"></i>
                          </div>
                        </div>
                        <p className="text-neutral-800 text-sm font-semibold mt-4">Ready to analyze</p>
                        <p className="text-neutral-500 text-xs mt-1 max-w-[200px]">Get AI-powered insights about your tasks and progress</p>
                        <button 
                          onClick={() => summerizeTasks()}
                          className="mt-4 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200/50 flex items-center gap-2"
                        >
                          <i className="fa-solid fa-sparkles text-[10px]"></i>
                          Generate Summary
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop View - Kanban Columns */}
              <div className="hidden lg:flex gap-6 min-w-max w-fit ml-auto mr-auto">
                {/* Desktop: To Do Column */}
                <div className="w-80 flex flex-col bg-white min-h-[600px] max-h-[600px] rounded-lg border border-neutral-200 shadow-sm">
                  <div className="p-5 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
                        <span className="text-neutral-900 text-sm font-semibold">
                          To Do
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-500 text-xs font-medium">
                          {alltasks.filter((t) => t.status === "todo").length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {alltasks
                      .filter((t) => t.status === "todo" && t.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="group relative bg-neutral-50 border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className="relative">
                            {clickedtasktitle === task.id ? (
                              <input
                                type="text"
                                autoFocus
                                onBlur={() => {
                                  setclickedtasktitle(null);
                                  changeTaskTitle(task.id);
                                }}
                                value={newTitle}
                                onChange={(e) => {
                                  setnewTitle(e.target.value);
                                }}
                                className="w-full text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 outline-none text-sm mb-2 focus:border-neutral-400"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setclickedtasktitle(null);
                                    changeTaskTitle(task.id);
                                  }
                                }}
                              />
                            ) : (
                              <h3 className="text-neutral-900 text-sm font-medium mb-2 leading-relaxed">
                                {task.task_title}
                              </h3>
                            )}
                            {task.task_description && (
                              <p className="text-neutral-500 text-xs mb-3 line-clamp-2 leading-relaxed">
                                {task.task_description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {task.deadline ? (
                                <span
                                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
                                    new Date(task.deadline) < new Date()
                                      ? "bg-red-100 text-red-600"
                                      : "bg-neutral-100 text-neutral-500"
                                  }`}
                                >
                                  <i className="fa-regular fa-clock text-[10px]"></i>
                                  {new Date(task.deadline).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">
                                  No deadline
                                </span>
                              )}

                              <div
                                className={`${task.assigned_to === userEmail ? "block" : "hidden"} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                              >
                                <button
                                  onClick={() => {
                                    setclickedtasktitle(task.id);
                                    setnewTitle(task.task_title);
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="w-7 h-7 rounded-md hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    markdone(task.id, "in-progress");
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-amber-100 text-neutral-400 hover:text-amber-600 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    markdone(task.id, "done");
                                  }}
                                  className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-check text-[10px]"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                          {count >= 1 && task.assigned_to && (
                            <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center gap-2">
                              <span className="text-neutral-500 text-xs">
                                assigned to:{" "}
                              </span>
                              {task.assigned_to === userEmail ? (
                                <span className="text-neutral-700 text-xs font-medium">
                                  You
                                </span>
                              ) : (
                                <div className="flex items-center flex-shrink-0 gap-1">
                                  <span className="text-[9px] font-bold text-neutral-600 w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center">
                                    {task.assigned_to.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="text-neutral-700 text-xs">
                                    {task.assigned_to}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                    {alltasks.filter((t) => t.status === "todo").length ===
                      0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-3">
                          <i className="fa-solid fa-inbox text-neutral-500"></i>
                        </div>
                        <p className="text-neutral-600 text-xs font-medium">No tasks yet</p>
                        <p className="text-neutral-500 text-[10px] mt-1">
                          Click below to add one
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        settaskStatus("todo");
                        document.getElementById("task-title-input")?.focus();
                      }}
                      className="w-full p-4 rounded-lg border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-all text-xs font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      Add task
                    </button>
                  </div>
                </div>

                {/* Desktop: In Progress Column */}
                <div className="w-80 flex flex-col bg-amber-50/50 min-h-[600px] max-h-[600px] rounded-lg border border-amber-200/50 shadow-sm">
                  <div className="p-5 border-b border-amber-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-neutral-900 text-sm font-semibold">
                          In Progress
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-600 text-xs font-medium">
                          {
                            alltasks.filter((t) => t.status === "in-progress")
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {alltasks
                      .filter((t) => t.status === "in-progress" && t.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="group relative bg-white border border-amber-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className="relative">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              {clickedtasktitle === task.id ? (
                                <input
                                  type="text"
                                  autoFocus
                                  onBlur={() => {
                                    setclickedtasktitle(null);
                                    changeTaskTitle(task.id);
                                  }}
                                  value={newTitle}
                                  onChange={(e) => {
                                    setnewTitle(e.target.value);
                                  }}
                                  className="flex-1 text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 outline-none text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      setclickedtasktitle(null);
                                      changeTaskTitle(task.id);
                                    }
                                  }}
                                />
                              ) : (
                                <h3 className="text-neutral-900 text-sm font-medium leading-relaxed">
                                  {task.task_title}
                                </h3>
                              )}
                              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5 animate-pulse"></div>
                            </div>
                            {task.task_description && (
                              <p className="text-neutral-500 text-xs mb-3 line-clamp-2 leading-relaxed">
                                {task.task_description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {task.deadline ? (
                                <span
                                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
                                    new Date(task.deadline) < new Date()
                                      ? "bg-red-100 text-red-600"
                                      : "bg-neutral-100 text-neutral-500"
                                  }`}
                                >
                                  <i className="fa-regular fa-clock text-[10px]"></i>
                                  {new Date(task.deadline).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">
                                  No deadline
                                </span>
                              )}

                              <div
                                className={`${task.assigned_to === userEmail ? "flex" : "hidden"} items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                              >
                                <button
                                  onClick={() => {
                                    setclickedtasktitle(task.id);
                                    setnewTitle(task.task_title);
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="w-7 h-7 rounded-md hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    markdone(task.id, "done");
                                  }}
                                  className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all"
                                >
                                  <i className="fa-solid fa-check text-[10px]"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                          {task.assigned_to && (
                            <div className="mt-3 pt-3 border-t border-amber-100 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-neutral-600">
                                  {task.assigned_to.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-600">
                                {task.assigned_to === userEmail
                                  ? "You"
                                  : task.assigned_to}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                    {alltasks.filter((t) => t.status === "in-progress")
                      .length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                          <i className="fa-solid fa-hourglass-half text-amber-600"></i>
                        </div>
                        <p className="text-neutral-600 text-xs font-medium">
                          No active tasks
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        settaskStatus("in-progress");
                        document.getElementById("task-title-input")?.focus();
                      }}
                      className="w-full p-4 rounded-lg border border-dashed border-amber-300 text-amber-600 hover:text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-all text-xs font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      Add task
                    </button>
                  </div>
                </div>

                {/* Desktop: Done Column */}
                <div className="w-80 flex flex-col bg-emerald-50/50 min-h-[600px] max-h-[600px] rounded-lg border border-emerald-200/50 shadow-sm">
                  <div className="p-5 border-b border-emerald-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-neutral-900 text-sm font-semibold">
                          Done
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-600 text-xs font-medium">
                          {alltasks.filter((t) => t.status === "done").length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {alltasks
                      .filter((t) => t.status === "done" && t.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="group relative bg-white/80 border border-emerald-200 rounded-lg p-4 hover:border-emerald-300 transition-all cursor-pointer"
                        >
                          <div className="relative">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="fa-solid fa-check text-white text-[8px]"></i>
                              </div>
                              {clickedtasktitle === task.id ? (
                                <input
                                  type="text"
                                  autoFocus
                                  onBlur={() => {
                                    setclickedtasktitle(null);
                                    changeTaskTitle(task.id);
                                  }}
                                  value={newTitle}
                                  onChange={(e) => {
                                    setnewTitle(e.target.value);
                                  }}
                                  className="flex-1 text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 outline-none text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      setclickedtasktitle(null);
                                      changeTaskTitle(task.id);
                                    }
                                  }}
                                />
                              ) : (
                                <h3 className="text-neutral-400 text-sm font-medium leading-relaxed line-through">
                                  {task.task_title}
                                </h3>
                              )}
                            </div>
                            {task.task_description && (
                              <p className="text-neutral-400 text-xs mb-3 line-clamp-2 leading-relaxed ml-8">
                                {task.task_description}
                              </p>
                            )}
                            <div className="flex items-center justify-between ml-8">
                              <span className="text-xs text-emerald-500 font-medium">
                                Completed
                              </span>
                              <div
                                className={`${task.assigned_to === userEmail ? "flex" : "hidden"} items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                              >
                                <button
                                  onClick={() => {
                                    setclickedtasktitle(task.id);
                                    setnewTitle(task.task_title);
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="w-7 h-7 rounded-md hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    markdone(task.id, "todo");
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                                >
                                  <i className="fa-solid fa-rotate-left text-[10px]"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                          {task.assigned_to && (
                            <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2 ml-8">
                              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-neutral-600">
                                  {task.assigned_to.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-500">
                                {task.assigned_to === userEmail
                                  ? "You"
                                  : task.assigned_to}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                    {alltasks.filter((t) => t.status === "done").length ===
                      0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                          <i className="fa-solid fa-trophy text-emerald-600"></i>
                        </div>
                        <p className="text-neutral-600 text-xs font-medium">
                          No completed tasks
                        </p>
                        <p className="text-neutral-500 text-[10px] mt-1">
                          Complete tasks to see them here
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        settaskStatus("done");
                        document.getElementById("task-title-input")?.focus();
                      }}
                      className="w-full p-4 rounded-lg border border-dashed border-emerald-300 text-emerald-600 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-xs font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      Add task
                    </button>
                  </div>
                </div>



                {/* AI Summary Panel - Desktop */}
                <div className={`${expandAi ? "flex" : "hidden"} w-80 flex-col bg-white min-h-[600px] max-h-[600px] rounded-xl border border-neutral-200 shadow-sm overflow-hidden`}>
                  {/* Header with gradient */}
                  <div className="relative p-5 border-b border-neutral-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                          <i className="fa-solid fa-wand-magic-sparkles text-white text-sm"></i>
                        </div>
                        <div>
                          <span className="text-neutral-900 text-sm font-bold">AI Summary</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-neutral-500 text-[10px]">Powered by Gemini</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setExpandAi(false)}
                        className=" w-8 h-8 rounded-lg hover:bg-white/80 text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 relative bg-gradient-to-b from-neutral-50/50 to-white">
                    {aispin ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-xl border-2 border-amber-200 border-t-amber-500 animate-spin"></div>
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce">
                            <i className="fa-solid fa-sparkles text-white text-[8px]"></i>
                          </div>
                        </div>
                        <p className="text-neutral-700 text-sm font-medium mt-4">Analyzing your tasks...</p>
                        <p className="text-neutral-500 text-xs mt-1">This may take a few seconds</p>
                      </div>
                    ) : aiContent ? (
                      <div className="space-y-4">
                        {/* Stats row */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                            <p className="text-emerald-600 text-lg font-bold">{alltasks.filter(t => t.status === 'done').length}</p>
                            <p className="text-emerald-600/70 text-[10px] font-medium">Completed</p>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-amber-50 border border-amber-100">
                            <p className="text-amber-600 text-lg font-bold">{alltasks.filter(t => t.status === 'in-progress').length}</p>
                            <p className="text-amber-600/70 text-[10px] font-medium">In Progress</p>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                            <p className="text-neutral-700 text-lg font-bold">{alltasks.filter(t => t.status === 'todo').length}</p>
                            <p className="text-neutral-500 text-[10px] font-medium">To Do</p>
                          </div>
                        </div>

                        {/* Summary Card */}
                        <div className="relative bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"></div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <i className="fa-solid fa-lightbulb text-amber-500 text-xs"></i>
                              <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wider">Insights</span>
                            </div>
                            <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">{aiContent}</p>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => summerizeTasks()}
                            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 hover:from-amber-100 hover:to-yellow-100 text-xs font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
                            Regenerate
                          </button>
                          <button 
                            onClick={() => {navigator.clipboard.writeText(aiContent); toast.success('Copied to clipboard');}}
                            className="px-4 py-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-600 hover:bg-neutral-200 text-xs font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fa-regular fa-copy text-[10px]"></i>
                            Copy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                            <i className="fa-solid fa-wand-magic-sparkles text-amber-600 text-3xl"></i>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-sparkles text-amber-500 text-xs"></i>
                          </div>
                        </div>
                        <p className="text-neutral-800 text-base font-semibold mt-5">Ready to analyze</p>
                        <p className="text-neutral-500 text-xs mt-1.5 max-w-[200px] leading-relaxed">Get AI-powered insights about your tasks and project progress</p>
                        <button 
                          onClick={() => summerizeTasks()}
                          className="mt-5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200/50 flex items-center gap-2"
                        >
                          <i className="fa-solid fa-sparkles text-xs"></i>
                          Generate Summary
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
            </div>
            

            {/* Floating Add Task Panel */}
            <div className="flex-shrink-0 px-4 lg:px-6 py-4 bg-white border-t border-neutral-200 flex items-end lg:items-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask();
                }}
                className="max-w-4xl mx-auto flex-1"
              >
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                  {/* Input section */}
                  <div className="flex-1 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 focus-within:border-neutral-400 focus-within:bg-white transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-plus text-neutral-500 text-xs"></i>
                      </div>
                      <input
                        id="task-title-input"
                        required
                        value={tasktitle}
                        onChange={(e) => settaskTitle(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-500 outline-none min-w-0"
                        type="text"
                        placeholder="Add a new task..."
                      />
                    </div>
                    <div className="hidden lg:block w-px h-5 bg-neutral-200"></div>
                    <input
                      value={taskdesc}
                      onChange={(e) => settaskDesc(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-neutral-600 placeholder-neutral-500 outline-none min-w-0 lg:block hidden"
                      type="text"
                      placeholder="Description (optional)"
                    />
                  </div>

                  {/* Mobile: Description separate */}
                  <input
                    value={taskdesc}
                    onChange={(e) => settaskDesc(e.target.value)}
                    className="lg:hidden w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm text-neutral-600 placeholder-neutral-500 outline-none"
                    type="text"
                    placeholder="Description (optional)"
                  />

                  {/* Controls row */}
                  <div className="flex items-center gap-2">
                    <select
                      value={taskStatus}
                      onChange={(e) => settaskStatus(e.target.value)}
                      className="flex-1 lg:flex-none px-4 py-3 text-xs rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 outline-none transition-colors hover:border-neutral-300 cursor-pointer font-medium"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors">
                      <i className="fa-regular fa-calendar text-neutral-500 text-xs"></i>
                      <input
                        value={date || ""}
                        onChange={(e) => setDate(e.target.value)}
                        type="date"
                        className="bg-transparent text-xs text-neutral-700 outline-none cursor-pointer w-[90px]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-all active:scale-[0.98]"
                    >
                      Add
                    </button>

                   
                  </div>
                </div>
              </form>

              {userEmails.length > 1 && (
                <div className="relative ml-3">
                  <button
                    onClick={() => setDispChat(true)}
                    className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 hover:border-neutral-300 transition-all flex items-center justify-center"
                  >
                    <i className="fa-regular fa-message text-sm"></i>
                  </button>

                  <div
                    className={`${dispChat ? "block" : "hidden"} absolute right-0 bottom-14 w-[calc(100vw-2rem)] sm:w-80 lg:w-[360px] rounded-xl bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden`}
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 bg-neutral-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center">
                          <i className="fa-regular fa-comments text-neutral-700 text-xs"></i>
                        </div>
                        <div>
                          <span className="text-neutral-900 text-sm font-semibold block">Team Chat</span>
                          <span className="text-neutral-500 text-[10px]">{userEmails.length} members</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setDispChat(false)} 
                        className="w-8 h-8 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-all flex items-center justify-center"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="relative flex flex-col h-[320px] sm:h-[360px]">

                      <div className={`${tmr ? 'block' : 'hidden'} absolute left-1/2 -translate-x-1/2 flex flex-col mt-2 bg-red-100 border border-red-200 rounded-lg p-2 z-10`}>
                        <span className="text-red-600 text-xs text-center">Too many messages, please wait a moment</span>
                      </div>

                      <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth bg-neutral-50/50">
                        {chatMsg.length >= 1 ? (
                          <div className="space-y-4">
                            {/* Load More Button */}
                            <button  
                              onClick={(e) => {e.preventDefault(); loadMore();}} 
                              className={`${chatMsg.length >= 20 ? 'block' : 'hidden'} flex items-center justify-center gap-2 text-[11px] text-neutral-600 hover:text-neutral-800 py-2 px-4 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 mx-auto transition-all font-medium`}
                            >
                              <i className="fa-solid fa-arrow-up text-[9px]"></i>
                              Load earlier messages
                            </button>

                            {/* Messages */}
                            {[...chatMsg].reverse().map((msg, index) => {
                              const isMe = msg.email === user?.email;
                              return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar - only for others */}
                                    {!isMe && (
                                      <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[10px] font-semibold text-neutral-600">
                                          {msg.first?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Message Content */}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                      {/* Name - only for others */}
                                      {!isMe && (
                                        <span className="text-[10px] text-neutral-500 mb-1 ml-1 font-medium">
                                          {msg.first}
                                        </span>
                                      )}
                                      
                                      {/* Bubble */}
                                      <div 
                                        className={`px-3 py-2 text-[13px] leading-relaxed ${
                                          isMe 
                                            ? 'bg-neutral-900 text-white rounded-2xl rounded-br-md' 
                                            : 'bg-white text-neutral-700 border border-neutral-200 rounded-2xl rounded-bl-md'
                                        }`}
                                      >
                                        {msg.content}
                                      </div>
                                      
                                      {/* Time */}
                                      <span className={`text-[10px] text-neutral-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                        {getTime(msg.time)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                              <i className="fa-regular fa-comment-dots text-neutral-500 text-xl"></i>
                            </div>
                            <p className="text-neutral-700 text-sm font-medium">No messages yet</p>
                            <p className="text-neutral-500 text-xs mt-1">Start a conversation with your team</p>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <form 
                        onSubmit={(e) => {e.preventDefault(); sendMsg(); setMsgContent("");}} 
                        className="flex items-center gap-2 p-3 border-t border-neutral-200 bg-white"
                      >
                        <input 
                          onChange={(e) => setMsgContent(e.target.value)}
                          type="text" 
                          value={msgContent}
                          placeholder="Type a message..." 
                          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-500 outline-none focus:border-neutral-300 focus:bg-white transition-all"
                        />
                        <button 
                          type="submit"
                          disabled={!msgContent.trim()}
                          className="w-10 h-10 rounded-lg bg-neutral-900 text-white hover:bg-black disabled:opacity-40 disabled:hover:bg-neutral-900 transition-all flex items-center justify-center flex-shrink-0"
                        >
                          <i className="fa-solid fa-arrow-up text-sm"></i>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default PracPage;
