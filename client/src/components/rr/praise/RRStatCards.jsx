import React from 'react';
import { Users, UserCheck, ListChecks } from 'lucide-react';
import StatCards from '../../shared/StatCards';

const RRStatCards = ({ stats }) => {
    const cards = [
        {
            label: 'COMMITTEE MEMBERS',
            value: stats.committeeMemberCount,
            caption: 'Registered',
            icon: <Users size={18} className="text-[#1B3A6B]/30" />,
            color: 'text-[#1B3A6B]'
        },
        {
            label: 'PRESENT TODAY',
            value: stats.presentTodayCount,
            caption: `${stats.presentTodayCount} of ${stats.committeeMemberCount}`,
            icon: <UserCheck size={18} className="text-[#1B3A6B]/30" />,
            color: 'text-[#1B3A6B]'
        },
        {
            label: 'AGENDA ITEMS',
            value: stats.openAgendaCount,
            caption: 'To discuss',
            icon: <ListChecks size={18} className="text-[#D6402F]/30" />,
            color: 'text-[#D6402F]'
        }
    ];

    return <StatCards cards={cards} columns={3} />;
};

export default RRStatCards;
