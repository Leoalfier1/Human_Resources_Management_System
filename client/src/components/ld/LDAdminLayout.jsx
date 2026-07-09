import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Bell, GraduationCap, UserCheck, LayoutDashboard, ClipboardList, Target, BarChart3, PlayCircle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

const LDAdminLayout = () => {
    const { isAuthenticated, isAdmin, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, dismissToast } = useAdminNotifications();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    const ROLE_LABELS = {
        admin: 'HR Administrator',
        hr_staff: 'HR Staff',
        hrmpsb: 'HRMPSB Secretariat',
        appointing_authority: 'Appointing Authority',
    };

    const navItems = [
        { path: '/ld/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/ld/tna', label: 'Step 1\nTNA', icon: ClipboardList },
        { path: '/ld/objectives', label: 'Step 2\nObjectives', icon: Target },
        { path: '/ld/plans', label: 'Step 3\nPlans', icon: FileText },
        { path: '/ld/programs', label: 'Step 4\nPrograms', icon: PlayCircle },
        { path: '/ld/evaluation', label: 'Step 5\nEvaluation', icon: BarChart3 },
    ];

    const notificationIcons = {
        rsp: <UserCheck size={16} />,
        ld: <GraduationCap size={16} />,
        ld_applicant: <GraduationCap size={16} />,
        pm: <FileText size={16} />,
    };
    const notificationColors = {
        rsp: 'bg-blue-600',
        ld: 'bg-emerald-600',
        ld_applicant: 'bg-amber-600',
        pm: 'bg-purple-600',
    };

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="flex bg-[#F1F3F6] min-h-screen">
            <motion.div
                animate={{ width: isCollapsed ? 80 : 260 }}
                className="bg-emerald-900 text-white flex flex-col shrink-0 sticky top-0 left-0 h-screen z-[100] overflow-hidden"
            >
                <div className="p-5 flex items-center gap-3 border-b border-white/10">
                    <div className="bg-emerald-500 p-2 rounded-xl shrink-0">
                        <GraduationCap size={22} />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-black uppercase tracking-tight leading-tight">Learning &</p>
                            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Development</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map(item => {
                        const active = isActive(item.path);
                        const lines = item.label.split('\n');
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left
                                    ${active ? 'bg-white/20 text-white shadow-lg' : 'text-emerald-200 hover:bg-white/10 hover:text-white'}`}
                            >
                                <item.icon size={20} className="shrink-0" />
                                {!isCollapsed && (
                                    <div className="overflow-hidden">
                                        <span className="text-xs font-black uppercase leading-tight block">{lines[0]}</span>
                                        {lines[1] && <span className="text-[9px] text-emerald-300 uppercase tracking-wider">{lines[1]}</span>}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full text-xs text-emerald-300 hover:text-white transition-colors font-bold uppercase tracking-wider"
                    >
                        {isCollapsed ? '>>' : 'Collapse'}
                    </button>
                    {!isCollapsed && (
                        <div className="mt-3">
                            <p className="text-xs font-bold text-white">{user?.fullName}</p>
                            <p className="text-[9px] text-emerald-300 uppercase tracking-widest">{ROLE_LABELS[user?.role] || 'Staff'}</p>
                            <button onClick={() => navigate('/pillars')} className="mt-2 text-[10px] text-emerald-300 hover:text-white underline underline-offset-2">
                                Back to Pillars
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-emerald-900 leading-tight">
                            {navItems.find(n => location.pathname.startsWith(n.path))?.label.split('\n')[0] || 'L&D Module'}
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            L&D Module · PRIME-HRM · SDO Dapitan City
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-emerald-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {user?.fullName?.charAt(0) || 'HR'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm">
                        <AnimatePresence>
                            {toasts.map(toast => (
                                <motion.div
                                    key={toast.id}
                                    initial={{ opacity: 0, x: 300, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 300, scale: 0.9 }}
                                    className={`${notificationColors[toast.type] || 'bg-gray-700'} text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 cursor-pointer`}
                                    onClick={() => dismissToast(toast.id)}
                                >
                                    <span className="mt-0.5 shrink-0">{notificationIcons[toast.type] || <Bell size={16} />}</span>
                                    <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
                                    <X size={14} className="shrink-0 mt-0.5 opacity-70 hover:opacity-100" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LDAdminLayout;
