import React, { useState, useEffect } from 'react';
import { PieChart, Sliders } from 'lucide-react';

const SmartAllocation = ({ goals = [], onAllocate }) => {
    const [totalAmount, setTotalAmount] = useState('');
    const [method, setMethod] = useState('equal'); // 'equal' or 'custom'
    const [loading, setLoading] = useState(false);
    const [customAllocations, setCustomAllocations] = useState({}); // { goalId: percentage }

    // Create a simplified list of active savings goals
    const activeGoals = goals.filter(g => g.type !== 'EMI');

    const handleAllocate = async (e) => {
        e.preventDefault();
        if (!totalAmount || activeGoals.length === 0 || !onAllocate) return;

        setLoading(true);
        try {
            const total = parseFloat(totalAmount);

            for (const goal of activeGoals) {
                let amount = 0;
                if (method === 'equal') {
                    amount = total / activeGoals.length;
                } else {
                    const pct = customAllocations[goal.id] || 0;
                    amount = (total * pct) / 100;
                }

                if (amount > 0) {
                    await onAllocate(goal.id, amount);
                }
            }
            setTotalAmount('');
        } catch (err) {
            console.error("Allocation failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomChange = (id, val) => {
        setCustomAllocations(prev => ({
            ...prev,
            [id]: Number(val)
        }));
    };

    const totalPct = Object.values(customAllocations).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 text-sm">$</span>
                <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="Total Deposit Amount"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
            </div>

            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                <button
                    onClick={() => setMethod('equal')}
                    className={`flex-1 text-[14px] py-1 rounded transition-colors ${method === 'equal' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
                >
                    Split Equally
                </button>
                <button
                    onClick={() => setMethod('custom')}
                    className={`flex-1 text-[14px] py-1 rounded transition-colors ${method === 'custom' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
                >
                    Custom %
                </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeGoals.map(g => (
                    <div key={g.id} className="flex justify-between items-center text-xs text-slate-300 bg-white/5 p-1.5 rounded">
                        <span className="truncate max-w-[60%]">{g.name}</span>

                        {method === 'equal' ? (
                            <span className="text-blue-500">
                                ${(totalAmount ? (totalAmount / activeGoals.length).toFixed(1) : 0)}
                            </span>
                        ) : (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    className="w-12 bg-black/20 border border-white/10 rounded px-1 py-0.5 text-right"
                                    placeholder="0"
                                    onChange={(e) => handleCustomChange(g.id, e.target.value)}
                                />
                                <span className="text-[10px] text-slate-500">%</span>
                            </div>
                        )}
                    </div>
                ))}
                {activeGoals.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-2">No active savings goals</p>
                )}
            </div>

            {method === 'custom' && (
                <div className={`text-xs text-right ${totalPct === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Total: {totalPct}%
                </div>
            )}

            <button
                onClick={handleAllocate}
                disabled={!totalAmount || activeGoals.length === 0 || loading || (method === 'custom' && totalPct !== 100)}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading ? <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <PieChart size={14} className="text-emerald-400" />}
                Apply Split
            </button>
        </div>
    );
};

export default SmartAllocation;
