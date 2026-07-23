import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, User, Folder, CalendarCheck, FileSignature, Bell } from 'lucide-react';

const navItems = [
  { label: 'MY PDS', path: '/personnel/pds', icon: FileText },
  { label: 'MY PROFILE', path: '/personnel/profile', icon: User },
  { label: '201 FILES', path: '/personnel/201-files', icon: Folder },
  { label: 'LEAVE', path: '/personnel/leave', icon: CalendarCheck },
  { label: 'CERTIFICATES', path: '/personnel/certificates', icon: FileSignature },
  { label: 'NOTIFICATIONS', path: '/personnel/notifications', icon: Bell },
];

const PersonnelNavbar = ({ notificationCount }) => {
  return (
    <>
      {/* DESKTOP TOP NAV (>= md) */}
      <div className="hidden md:flex items-center gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/personnel/pds' || item.path === '/personnel/profile'}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-20 lg:w-24 h-20 lg:h-24 rounded-2xl transition-all relative
              ${isActive
                ? 'bg-red-50 text-[#D6402F] shadow-inner font-bold'
                : 'text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-50'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[8px] lg:text-[9px] font-black mt-2 lg:mt-3 tracking-tighter text-center leading-tight">
                  {item.label}
                </span>
                {item.label === 'NOTIFICATIONS' && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D6402F] text-white text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (< md) */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 justify-around items-center py-2 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/personnel/pds' || item.path === '/personnel/profile'}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative min-w-[50px]
              ${isActive ? 'text-[#D6402F]' : 'text-slate-400 hover:text-[#1B3A6B]'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[7px] font-black mt-1 tracking-tighter text-center leading-tight truncate max-w-[55px]">
                  {item.label}
                </span>
                {item.label === 'NOTIFICATIONS' && notificationCount > 0 && (
                  <span className="absolute -top-1 right-1 bg-[#D6402F] text-white text-[7px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </>
  );
};

export default PersonnelNavbar;
