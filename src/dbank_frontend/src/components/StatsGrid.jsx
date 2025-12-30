import React from 'react';

export function StatsGrid({ apr, balance }) {
    const tier = balance < 10000 ? 'Basic' : balance < 100000 ? 'Gold' : 'Platinum';

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
                <div className="text-slate-500 text-xs mb-1 uppercase">Current APR</div>
                <div className="text-2xl font-bold text-sky-400">{(apr * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
                <div className="text-slate-500 text-xs mb-1 uppercase">Tier</div>
                <div className="text-2xl font-bold text-indigo-400">{tier}</div>
            </div>
        </div>
    );
}
