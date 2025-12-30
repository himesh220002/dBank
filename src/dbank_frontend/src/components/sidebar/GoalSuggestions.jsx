import React from 'react';
import { PlusCircle, Target } from 'lucide-react';

const GoalSuggestions = ({ onCreatePreset }) => {
    const suggestions = [
        {
            id: 'safety-net',
            name: 'Safety Net',
            amount: 5000,
            icon: '🛡️',
            desc: 'Build a $5k emergency fund',
            type: 'Savings'
        },
        {
            id: 'vacation',
            name: 'Dream Trip',
            amount: 3000,
            icon: '✈️',
            desc: 'Save for your next adventure',
            type: 'Savings'
        },
        {
            id: 'gadget',
            name: 'New Tech',
            amount: 1500,
            icon: '💻',
            desc: 'Upgrade your workspace',
            type: 'Savings'
        }
    ];

    return (
        <div className="space-y-2">
            {suggestions.map(s => (
                <div key={s.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors group relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                            <div className="text-xl bg-white/5 w-8 h-8 rounded flex items-center justify-center">
                                {s.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white mb-0.5">{s.name}</div>
                                <div className="text-[10px] text-slate-400">{s.desc}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => onCreatePreset(s)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 duration-200"
                            title="Create this goal"
                        >
                            <PlusCircle size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GoalSuggestions;
