import { Link } from "react-router-dom"
import { useState } from "react"


interface HeaderRules {
    first: string,
    last: string,
    userEmail: string,
    onLogout: () => void,

}

export function SharedHeader({first, last, userEmail, onLogout}: HeaderRules){
    const [profilehover, setProfileHover] = useState(false);
    
    return(
           <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200">
            
          <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left Section - Logo & Search */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-white/20 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative w-9 h-9 bg-gradient-to-br from-white via-white to-neutral-200 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-black text-sm font-black tracking-tight">T</span>
                  </div>
                </div>
                <Link to="/SecondPage" className="flex flex-col">
                  <span className="text-[15px] font-bold text-neutral-900 tracking-tight">BrightLine</span>
                  <span className="hidden sm:block text-[10px] text-neutral-500 font-medium -mt-0.5">Workspace</span>
                </Link>
              </div>
              
            </div>
            

            {/* Right Section - Actions & Profile */}
            <div className="flex items-center gap-3">
              {/* User Profile */}
              <div 
                onMouseEnter={() => setProfileHover(true)} 
                onMouseLeave={() => setProfileHover(false)}  
                className="relative flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-neutral-200 flex items-center justify-center text-black text-[11px] font-bold shadow-lg">
                    {first.charAt(0)}{last.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden lg:flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-neutral-900">{first}</p>
                  <i className={`fa-solid fa-chevron-down text-[8px] text-neutral-500 transition-transform duration-200 ${profilehover ? 'rotate-180' : ''}`}></i>
                </div>

                {/* Invisible bridge */}
                <div className="absolute top-full left-0 right-0 h-2"></div>

                {/* Dropdown Menu */}
                <div className={`${profilehover ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'} transition-all duration-200 absolute top-full right-0 pt-2 z-50`}>
                  <div className="w-[220px] bg-[#0c0c0e] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="p-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-neutral-200 flex items-center justify-center text-black text-[12px] font-bold">
                          {first.charAt(0)}{last.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{first} {last}</p>
                          <p className="text-[11px] text-neutral-500 truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-1.5">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all text-left">
                        <i className="fa-regular fa-user text-[12px] w-4"></i>
                        <span className="text-[13px]">Profile</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all text-left">
                        <i className="fa-solid fa-gear text-[12px] w-4"></i>
                        <span className="text-[13px]">Settings</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-1.5 border-t border-white/[0.06]">
                      <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-left">
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
    )
}