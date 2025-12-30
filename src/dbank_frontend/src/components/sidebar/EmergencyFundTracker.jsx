import React, { useState, useEffect } from 'react';
import { ShieldAlert, Settings } from 'lucide-react';

const EmergencyFundTracker = ({ currentBalance = 0 }) => {
    const [target, setTarget] = useState(() => {
        const saved = localStorage.getItem('dbank_emergency_target');
        return saved ? Number(saved) : 5000;
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        localStorage.setItem('dbank_emergency_target', target);
    }, [target]);

    const percentage = Math.min((currentBalance / target) * 100, 100);

    // Calculate months of coverage (assuming generic $2000 expenses/mo for now, could be configurable)
    const monthlyExpenses = 2000;
    const coverageMonths = (currentBalance / monthlyExpenses).toFixed(1);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-xs text-slate-400 mb-0.5">Coverage</div>
                    <div className="text-xl font-bold text-white flex items-baseline gap-1">
                        {coverageMonths} <span className="text-xs font-normal text-slate-500">months</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-slate-500 hover:text-white transition-colors p-1"
                >
                    <Settings size={12} />
                </button>
            </div>

            {isEditing && (
                <div className="bg-white/5 p-2 rounded-lg mb-2">
                    <label className="text-[10px] text-slate-400 block mb-1">Target Amount ($)</label>
                    <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                </div>
            )}

            {/* Progress Bar */}
            <div className="relative pt-1">
                <div className="flex mb-1 items-center justify-between">
                    <div className="text-[10px] font-semibold inline-block py-0.5 px-1.5 uppercase rounded text-emerald-400 bg-emerald-500/10">
                        {percentage.toFixed(0)}% Secure
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-emerald-400">
                            ${currentBalance.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">/ ${target}</span>
                    </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-white/10">
                    <div
                        style={{ width: `${percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                    ></div>
                </div>
            </div>

            {percentage < 100 && (
                <div className="flex items-start gap-2 text-[10px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <span>You need ${(target - currentBalance).toFixed(0)} more to reach your safety net goal.</span>
                </div>
            )}
        </div>
    );
};

export default EmergencyFundTracker;
