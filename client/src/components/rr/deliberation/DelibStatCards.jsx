import React from 'react';
import StatCards from '../../shared/StatCards';

const DelibStatCards = ({ stats }) => {
    const cards = [
        {
            label: 'TOTAL NOMINEES',
            value: stats.total_nominees,
            caption: 'At deliberation',
            color: 'text-[#1B3A6B]'
        },
        {
            label: 'APPROVED',
            value: stats.approved_count,
            caption: 'Consensus reached',
            color: 'text-[#1B3A6B]'
        },
        {
            label: 'ON HOLD',
            value: stats.on_hold_count,
            caption: 'Needs review',
            color: 'text-[#D6402F]'
        },
        {
            label: 'AVG SCORE',
            value: stats.avg_score?.toFixed(1) || '0.0',
            caption: 'out of 100',
            color: 'text-[#D6402F]'
        }
    ];

    return <StatCards cards={cards} columns={4} />;
};

export default DelibStatCards;
