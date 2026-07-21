import React from 'react';
import { Users, UserCheck, Award } from 'lucide-react';
import StatCards from '../../shared/StatCards';

const CeremonyStatCards = ({ stats }) => {
    const cards = [
        {
            label: 'AWARDEES',
            value: stats.totalAwardees,
            icon: <Users size={18} className="text-[#1B3A6B]/40" />,
            color: 'text-[#1B3A6B]'
        },
        {
            label: 'ATTENDANCE CONFIRMED',
            value: stats.attendanceConfirmed,
            icon: <UserCheck size={18} className="text-[#1B3A6B]/40" />,
            color: 'text-[#1B3A6B]'
        },
        {
            label: 'CERTS DISTRIBUTED',
            value: stats.certsDistributed,
            icon: <Award size={18} className="text-[#D6402F]/40" />,
            color: 'text-[#D6402F]'
        }
    ];

    return <StatCards cards={cards} columns={3} />;
};

export default CeremonyStatCards;
