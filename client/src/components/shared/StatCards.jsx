import React from 'react';
import { motion } from 'framer-motion';

const StatCards = ({ cards = [], columns = 4 }) => {
    const gridCols = columns === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : columns === 2
            ? 'grid-cols-2'
            : 'grid-cols-2 md:grid-cols-4';

    return (
        <div className={`grid ${gridCols} gap-4`}>
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {card.label}
                        </p>
                        {card.icon}
                    </div>
                    <span className={`text-3xl font-black ${card.color || 'text-[#1B3A6B]'} tabular-nums`}>
                        {card.value}
                    </span>
                    {card.caption && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {card.caption}
                        </p>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default StatCards;
