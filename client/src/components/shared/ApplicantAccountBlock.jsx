import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ApplicantAccountBlock = () => {
    const { user } = useAuth();

    return (
        <div className="text-right border-r pr-6 border-slate-100 hidden md:block">
            <h3 className="text-sm font-black text-[#1B3A6B] leading-none uppercase">
                {user?.fullName || "LEO ALFIER TEST"}
            </h3>
            <p className="text-[10px] font-black text-[#D6402F] mt-1 tracking-tighter uppercase">
                Applicant Account
            </p>
        </div>
    );
};

export default ApplicantAccountBlock;
