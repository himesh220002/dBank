import React, { useMemo } from 'react';
import { Check, X, Clock, ListTodo } from 'lucide-react';

const ActionQueue = ({ goals = [] }) => {
    // Derive actions from real goals
    const actions = useMemo(() => {
        const list = [];
        const now = new Date();

        // Check for goals with dues in next 7 days
        goals.forEach(g => {
            if (g.type === 'EMI' && g.nextDueDate) {
                const dueDate = new Date(Number(g.nextDueDate) / 1000000);
                const diffTime = dueDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 7) {
                    list.push({
                        id: `emi-${g.id}`,
                        type: 'EMI',
                        desc: `Pay EMI for ${g.name}`,
                        date: diffDays === 0 ? 'Today' : `In ${diffDays} days`,
                        amount: `⨎${g.monthlyCommitment}`
                    });
                }
            }

            // Check for active savings goals with 0 balance (nudge)
            if (g.type === 'Savings' && Number(g.currentAmount) === 0 && Number(g.targetAmount) > 0) {
                list.push({
                    id: `fund-${g.id}`,
                    type: 'Fund',
                    desc: `Start funding ${g.name}`,
                    date: 'ASAP',
                    amount: `Target: ⨎${g.targetAmount}`
                });
            }
        });

        return list.slice(0, 3); // Top 3 actions
    }, [goals]);

    return (
        <div className="space-y-2">
            {actions.map(action => (
                <div key={action.id} className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between group hover:border-amber-500/30 transition-colors">
                    <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-0.5">
                            <Clock size={10} className="text-amber-400" />
                            <span className="font-medium">{action.date}</span>
                        </div>
                        <div className="text-xs text-white truncate" title={action.desc}>
                            {action.desc}
                        </div>
                        <div className="text-[10px] text-slate-500">{action.amount}</div>
                    </div>

                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded transition-colors">
                            <Check size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ))}

            {actions.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10 px-2 leading-relaxed">
                    <ListTodo size={16} className="mx-auto mb-2 text-slate-600" />
                    Relax! No immediate actions required. Your goals are on track.
                </div>
            )}
        </div>
    );
};

export default ActionQueue;
