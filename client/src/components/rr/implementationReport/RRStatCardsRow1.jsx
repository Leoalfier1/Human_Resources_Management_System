import React from 'react';
import { Users, Award, GraduationCap, PieChart } from 'lucide-react';
import StatCards from '../../shared/StatCards';

const RRStatCardsRow1 = ({ stats }) => {
    const cards = [
        {
            label: 'TOTAL NOMINEES',
            value: stats.totalNominees || 0,
            caption: 'Across all categories',
            color: 'text-[#1B3A6B]',
            icon: <Users size={18} className="text-[#1B3A6B]/30" />
        },
        {
            label: 'TOTAL AWARDEES',
            value: stats.totalAwardees || 0,
            caption: 'Recognized this cycle',
            color: 'text-[#1B3A6B]',
            icon: <Award size={18} className="text-[#1B3A6B]/30" />
        },
        {
            label: 'TEACHING AWARDS',
            value: stats.teachingAwardees || 0,
            color: 'text-[#D6402F]',
            icon: <GraduationCap size={18} className="text-[#D6402F]/30" />
        },
        {
            label: 'PARTICIPATION RATE',
            value: `${stats.participationRate || 0}%`,
            caption: 'vs eligible personnel',
            color: 'text-[#1B3A6B]',
            icon: <PieChart size={18} className="text-[#1B3A6B]/30" />
        }
    ];

    return <StatCards cards={cards} columns={4} />;
};

export default RRStatCardsRow1;
