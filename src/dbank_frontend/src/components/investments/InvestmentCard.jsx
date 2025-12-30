import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const InvestmentCard = ({ asset, onClick, sparklineData }) => {
    const isPositive = asset.change >= 0;
    const color = isPositive ? '#10b981' : '#f43f5e'; // Emerald or Rose

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-5 transition-all hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10 relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${asset.type === 'crypto' ? 'bg-indigo-500/10 text-indigo-400' :
                            asset.type === 'mineral' ? 'bg-amber-500/10 text-amber-400' :
                                asset.type === 'fund' ? 'bg-emerald-500/10 text-emerald-400' :
                                    'bg-slate-700/30 text-slate-300'
                        }`}>
                        {asset.symbol.substring(0, 2)}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{asset.name}</h3>
                        <div className="text-[10px] text-slate-500 font-mono">{asset.symbol}</div>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(asset.change).toFixed(2)}%
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <div className="text-2xl font-black text-white">
                        {asset.symbol === 'USD' || asset.symbol === 'EUR' ? '₹' : (asset.type === 'crypto' || asset.type === 'trade' ? '₹' : '')}
                        {asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    {asset.unit && <div className="text-[10px] text-slate-500 mt-1">per {asset.unit}</div>}
                </div>

                {/* Mini Sparkline */}
                <div className="h-10 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <defs>
                                <linearGradient id={`grad-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis domain={['dataMin', 'dataMax']} hide />
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke={color}
                                strokeWidth={2}
                                fill={`url(#grad-${asset.id})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Activity size={16} className="text-slate-600" />
            </div>
        </div>
    );
};

export default InvestmentCard;
