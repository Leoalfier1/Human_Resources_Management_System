import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { apiGet, SOCKET_URL } from '../../utils/api';

const pathTitles = {
  '/pm/dashboard': 'Performance Management',
  '/pm/planning': 'Planning & Commitment',
  '/pm/monitoring': 'Monitoring & Coaching',
  '/pm/review': 'Review & Evaluation',
  '/pm/rewarding': 'Rewarding & Dev Planning',
  '/pm/form-config': 'Form Configuration',
  '/pm/evaluate-staff': 'Evaluate Non-Teaching Staff',
};

const pathSubtitles = {
  '/pm/planning': 'Validate KRA weight integrity, review targets, and approve performance commitments.',
  '/pm/monitoring': 'Log progress dialogs, record evidence files, and monitor mid-cycle coaching attention flags.',
  '/pm/review': 'Score targets, compute weighted ratings, and finalize employee appraisals.',
  '/pm/rewarding': 'Nominate outstanding achievers for incentives and push under-performing indicators to L&D intake.',
};

const PMHeader = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // School Year selection states
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(localStorage.getItem('selected_period_id') || '');

  let currentPage = pathTitles[location.pathname];
  if (!currentPage) {
    if (location.pathname.startsWith('/pm/evaluate/')) {
      currentPage = 'Evaluate Employee';
    } else {
      currentPage = 'Performance Management';
    }
  }

  const getInitials = (fullName) => {
    if (!fullName) return "AD";
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiGet('/pm/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          const validNotifications = data.filter(n => n !== "No new submissions received.");
          setUnreadCount(validNotifications.length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    if (token) {
      fetchNotifications();
    }

    const socket = io(SOCKET_URL);
    socket.emit('join_admin_room');

    socket.on('notification_received', (data) => {
      setNotifications(prev => {
        const filtered = prev.filter(n => n !== "No new submissions received.");
        return [data.message, ...filtered];
      });
      setUnreadCount(c => c + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Fetch available school years
  useEffect(() => {
    if (!token) return;
    const fetchPeriods = async () => {
      try {
        const response = await apiGet('/pm/dashboard/periods');
        if (response.ok) {
          const data = await response.json();
          setPeriods(data);
          // Set initial default period if none exists in localStorage
          const active = data.find(p => p.is_active);
          const defaultId = active ? active.id : (data[0] ? data[0].id : '');
          if (!localStorage.getItem('selected_period_id') && defaultId) {
            localStorage.setItem('selected_period_id', defaultId);
            setSelectedPeriodId(String(defaultId));
            window.dispatchEvent(new Event('selected_period_changed'));
          }
        }
      } catch (err) {
        console.error('Failed to fetch rating periods in header:', err);
      }
    };
    fetchPeriods();
  }, [token]);

  // Listen for local changes to selected period ID
  useEffect(() => {
    const handlePeriodChange = () => {
      setSelectedPeriodId(localStorage.getItem('selected_period_id') || '');
    };
    window.addEventListener('selected_period_changed', handlePeriodChange);
    return () => window.removeEventListener('selected_period_changed', handlePeriodChange);
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      setUnreadCount(0);
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 select-none">
      {/* Title & Module Info */}
      <div>
        <h3 className="text-xl font-bold text-black leading-tight">{currentPage}</h3>
        {pathSubtitles[location.pathname] && (
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{pathSubtitles[location.pathname]}</p>
        )}
      </div>

      {/* Right Side Info & Notification */}
      <div className="flex items-center gap-4">
        

        {/* Bell Icon Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="p-2 text-slate-600 hover:text-black transition-colors relative focus:outline-none cursor-pointer rounded-lg hover:bg-slate-50"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#D6402F] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-black uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Real-Time</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <div key={index} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#D6402F] mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-black font-semibold leading-normal">{notif}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-xs text-slate-600 font-bold uppercase">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Initial Badge */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-100 group-hover:ring-[#1B3A6B]/20 transition-all">
            {getInitials(user?.fullName)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PMHeader;
