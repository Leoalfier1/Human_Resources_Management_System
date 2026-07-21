import React from 'react';
import { Check } from 'lucide-react';

const DEFAULT_STEPS = [
    { key: 'draft',     label: 'Draft',     number: 1 },
    { key: 'submitted', label: 'Submitted', number: 2 },
    { key: 'attested',  label: 'Attested',  number: 3 },
];

const StatusStepper = ({ steps = DEFAULT_STEPS, currentStep = 0, completedSteps = [], activeColor = '#D6402F', variant = 'default' }) => {
    const numSteps = steps.length;
    const isCompact = variant === 'compact';

    return (
        <div className="flex items-center gap-0">
            {steps.map((step, idx) => {
                const isCompleted = completedSteps.includes(idx) || idx < currentStep;
                const isCurrent = idx === currentStep && !isCompleted;

                return (
                    <React.Fragment key={step.key || idx}>
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`${isCompact ? 'w-5 h-5 text-[8px]' : 'w-7 h-7 text-[10px]'} rounded-full flex items-center justify-center font-black transition-all`}
                                style={{
                                    backgroundColor: isCompleted
                                        ? '#10B981'
                                        : isCurrent
                                            ? activeColor
                                            : 'transparent',
                                    color: isCompleted || isCurrent ? '#fff' : '#94a3b8',
                                    borderWidth: isCompleted || isCurrent ? 0 : 2,
                                    borderColor: '#cbd5e1',
                                }}
                            >
                                {isCompleted ? <Check size={isCompact ? 10 : 14} strokeWidth={3} /> : (step.number || idx + 1)}
                            </div>
                            {!isCompact && (
                                <span
                                    className="text-[10px] font-black uppercase tracking-wider"
                                    style={{
                                        color: isCompleted
                                            ? '#059669'
                                            : isCurrent
                                                ? activeColor
                                                : '#94a3b8',
                                    }}
                                >
                                    {step.label}
                                </span>
                            )}
                        </div>
                        {idx < numSteps - 1 && (
                            <div
                                className={`${isCompact ? 'w-6' : 'w-12'} h-0.5 mx-1 rounded-full`}
                                style={{
                                    background: isCompleted
                                        ? '#10B981'
                                        : isCurrent
                                            ? `linear-gradient(to right, ${activeColor}, #cbd5e1)`
                                            : '#e2e8f0',
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default StatusStepper;
