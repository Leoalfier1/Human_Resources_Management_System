import React from 'react';
import { Bell, CheckCheck, Mail, MailOpen } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const typeIcons = {
  leave: '📅',
  travel: '✈️',
  document: '📄',
  general: '📌',
};

const PersonnelNotifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Notifications</h1>
          <p className="text-xs font-bold text-slate-400">Stay updated on your requests</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 text-[10px] font-black text-[#1B3A6B] uppercase border border-[#1B3A6B] px-4 py-2 rounded-xl hover:bg-[#1B3A6B] hover:text-white transition-all">
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Bell size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${!n.is_read ? 'border-l-4 border-l-[#1B3A6B]' : ''}`}
            >
              <div className="text-2xl">{typeIcons[n.type] || '📌'}</div>
              <div className="flex-1">
                <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-bold text-slate-800'}`}>{n.message}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <div className="shrink-0">
                {n.is_read ? <MailOpen size={18} className="text-slate-300" /> : <Mail size={18} className="text-[#1B3A6B]" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonnelNotifications;
