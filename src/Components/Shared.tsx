import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faHouse, faListCheck, faCalendar, faChartSimple, faBell, faUserPlus, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface AppHeaderProps {
  projLength: number | null
  dueSoon?: number
  completedToday?: number
  user?: { first?: string; last?: string; email?: string } | null
  onNewProject?: () => void
  onInvite?: () => void
  inviteCount?: number
}


export const AppHeader = ({ projLength, dueSoon = 0, user, onNewProject, onInvite, inviteCount = 0 }: AppHeaderProps) => {
  const location = useLocation();

  const tabs: { path: string; label: string; icon: IconDefinition }[] = [
    { path: '/SecondPage', label: 'Dashboard', icon: faHouse },
    { path: '/Tasks', label: 'Tasks', icon: faListCheck },
    { path: '/Calendar', label: 'Calendar', icon: faCalendar },
    { path: '/Analytics', label: 'Analytics', icon: faChartSimple },
  ];

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 z-40 bg-gradient-to-b from-[#fafafa] to-[#f5f5f5] border-r border-neutral-200/80 flex-col shadow-xl shadow-black/[0.03]">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-neutral-200/80">
        <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
          <span className="text-white text-sm font-black">T</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-neutral-900 tracking-tight">BrightLine</span>
          <span className="text-[10px] text-neutral-500 -mt-0.5">Workspace</span>
        </div>
      </div>

      {/* Quick Action Button */}
      {onNewProject && (
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={onNewProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-[13px] font-semibold transition-all active:scale-[0.98] shadow-lg shadow-black/20"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
            <span>New Project</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium px-3 mb-2 mt-2">Menu</p>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link key={tab.path} to={tab.path}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-black text-white shadow-md shadow-black/10'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-neutral-100'}`}>
                  <FontAwesomeIcon icon={tab.icon} className={`text-[11px] ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                </div>
                <span>{tab.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                )}
              </div>
            </Link>
          );
        })}

        {/* Notifications Link */}
        <Link to="/Notifications">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
            location.pathname === '/Notifications'
              ? 'bg-black text-white shadow-md shadow-black/10'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center relative ${location.pathname === '/Notifications' ? 'bg-white/20' : 'bg-neutral-100'}`}>
              <FontAwesomeIcon icon={faBell} className={`text-[11px] ${location.pathname === '/Notifications' ? 'text-white' : 'text-neutral-500'}`} />
              {inviteCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                  {inviteCount}
                </span>
              )}
            </div>
            <span>Notifications</span>
            {inviteCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold shadow-sm">
                {inviteCount} new
              </span>
            )}
          </div>
        </Link>

        {/* Invite Friend Button */}
        {onInvite && (
          <>
            <div className="h-px bg-neutral-200 my-3 mx-2"></div>
            <button
              onClick={onInvite}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faUserPlus} className="text-[11px] text-neutral-500" />
              </div>
              <span>Invite Friend</span>
            </button>
          </>
        )}
      </nav>

      {/* Stats Section */}
      {projLength !== null && projLength > 0 && (
        <div className="px-3 py-4 border-t border-neutral-200/80">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium px-2 mb-3">Quick Stats</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-neutral-200 rounded-xl p-3 text-center hover:shadow-md transition-all cursor-default">
              <p className="text-neutral-900 text-xl font-bold tabular-nums">{projLength}</p>
              <p className="text-neutral-500 text-[10px]">Projects</p>
            </div>
            <div className={`rounded-xl p-3 text-center transition-all cursor-default ${dueSoon > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xl font-bold tabular-nums ${dueSoon > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>{dueSoon}</p>
              <p className="text-neutral-500 text-[10px]">Due Soon</p>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Section */}
      {user && (
        <div className="px-3 py-4 border-t border-neutral-200/80">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-neutral-200/60 transition-colors cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-black/20">
                {user.first?.charAt(0) ?? ""}{user.last?.charAt(0) ?? ""}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#fafafa]"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-neutral-900 text-[13px] font-medium truncate">{user.first} {user.last}</p>
              <p className="text-neutral-500 text-[10px] truncate">{user.email}</p>
            </div>
            <FontAwesomeIcon icon={faEllipsisVertical} className="text-neutral-400 text-[10px]" />
          </div>
        </div>
      )}

      {/* Keyboard shortcuts - Collapsed */}
      <div className="px-3 py-3 border-t border-neutral-200/80 bg-neutral-100/50">
        <div className="flex items-center justify-between px-2 text-[10px]">
          <span className="text-neutral-400">Quick: </span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-500 font-mono shadow-sm">⇧N</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-500 font-mono shadow-sm">⇧?</kbd>
          </div>
        </div>
      </div>
    </aside>
  )
}
