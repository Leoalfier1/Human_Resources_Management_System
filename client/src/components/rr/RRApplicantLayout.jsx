import React from 'react';
import { Outlet } from 'react-router-dom';
import RRPortalHeader from './RRPortalHeader';

const RRApplicantLayout = () => {
    return (
        <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans">
            <RRPortalHeader />

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="p-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] border-t border-slate-200 bg-white">
                DepEd Schools Division Office of Dapitan City · HRMIS R&R Module · For assistance call 065-908-1234
            </footer>
        </div>
    );
};

export default RRApplicantLayout;
