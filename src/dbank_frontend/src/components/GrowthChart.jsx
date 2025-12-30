// /src/dbank_frontend/src/components/GrowthChart.jsx
// Financial Projection Visualization
// Renders an AreaChart plotting current balance against long-term growth estimates.

import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export function GrowthChart({ projections = [] }) {
    // Safety check for empty or invalid data
    if (!Array.isArray(projections) || projections.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold font-display">Compound Growth</h3>
                        <p className="text-sm text-slate-500 mt-1">Projected wealth accumulation over 10 years</p>
                    </div>
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                    <p className="text-slate-500 text-sm">Loading projection data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold font-display">Compound Growth</h3>
                    <p className="text-sm text-slate-500 mt-1">Projected wealth accumulation over 10 years</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-amber-500" /> Principal
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Interest
                    </div>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projections}>
                        <defs>
                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `⨎${(val / 1000).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                            formatter={(value, name) => [
                                `⨎${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                                name === 'balance' ? 'Total Wealth' : 'Principal'
                            ]}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInterest)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                        <Area type="monotone" dataKey="principal" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrincipal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
