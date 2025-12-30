import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity } from 'lucide-react';

export function HealthScoreGauge({ score, insights = [] }) {
    const data = [
        { value: score },
        { value: 100 - score }
    ];

    const getColor = (s) => {
        if (s >= 80) return '#10b981'; // Emerald
        if (s >= 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const color = getColor(score);

    return (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="text-indigo-400" size={20} />
                        Financial Health
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Live Score</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    {score >= 80 ? 'EXCELLENT' : score >= 50 ? 'GOOD' : 'NEEDS WORK'}
                </div>
            </div>

            <div className="flex flex-col items-center gap-6">
                <div className="relative w-40 h-40 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                startAngle={180}
                                endAngle={0}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell key="score" fill={color} />
                                <Cell key="remaining" fill="#1e293b" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                        <span className="text-4xl font-black text-white" style={{ textShadow: `0 0 20px ${color}40` }}>{Math.round(score)}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">/ 100</span>
                    </div>
                </div>

                <div className="w-full space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Key Insights</div>
                    {insights.length > 0 ? (
                        insights.map((insight, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color === '#ef4444' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                                {insight}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400 italic">
                            Keep managing your goals to see insights here!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
