import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const PortalBackButton = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/pillars')}
            className="group flex flex-col items-center gap-1"
            title="Back to Pillars"
        >
            <div className="bg-slate-50 text-slate-400 p-3 rounded-full group-hover:bg-red-50 group-hover:text-[#D6402F] transition-all border border-slate-100">
                <LogOut size={20} />
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase">Back</span>
        </button>
    );
};

export default PortalBackButton;
