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
    <div className="flex items-center gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/personnel/pds' || item.path === '/personnel/profile'}
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-24 h-24 rounded-2xl transition-all relative
            ${isActive
              ? 'bg-red-50 text-[#D6402F] shadow-inner'
              : 'text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-50'}
          `}
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-black mt-3 tracking-tighter text-center leading-tight">
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
  );
};

export default PersonnelNavbar;
