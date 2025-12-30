import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PortfolioSimulator = () => {
    const [amount, setAmount] = useState(10000);
    const [allocations, setAllocations] = useState({ gold: 50, crypto: 30, funds: 20 });
    const [projectionData, setProjectionData] = useState([]);

    useEffect(() => {
        // Calculate projection
        // Simple Compound: 
        // Gold ~ 8%
        // Crypto ~ 15% (High Volatility)
        // Funds ~ 12%

        const years = 10;
        const data = [];
        let current = Number(amount) || 0;

        for (let i = 0; i <= years; i++) {
            let yearVal = 0;
            if (i === 0) yearVal = amount;
            else {
                const prev = data[i - 1].value;
                // Weighted Growth
                const wGold = (allocations.gold / 100) * 1.08;
                const wCrypto = (allocations.crypto / 100) * 1.15;
                const wFunds = (allocations.funds / 100) * 1.12;
                const growthFactor = wGold + wCrypto + wFunds; // e.g. 1.10
                yearVal = prev * (1 + (growthFactor - 1)); // Simplified
            }

            // Conservative Curve (5%)
            const consVal = amount * Math.pow(1.05, i);

            data.push({
                year: `Year ${i}`,
                value: Math.round(yearVal),
                conservative: Math.round(consVal)
            });
        }
        setProjectionData(data);
    }, [amount, allocations]);

    const handleSlider = (key, val) => {
        setAllocations(prev => ({ ...prev, [key]: Number(val) }));
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Sliders className="text-indigo-500" /> Portfolio Simulator
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Investment Amount (₹)</label>
                        <input
                            type="number"
                            value={amount || ''}
                            onChange={(e) => setAmount(Number(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-indigo-500 outline-none"
                        />
                    </div>

                    {/* Sliders */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-amber-400 font-bold">Gold / Minerals</span>
                                <span className="text-white">{allocations.gold}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={allocations.gold}
                                onChange={(e) => handleSlider('gold', e.target.value)}
                                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-indigo-400 font-bold">Crypto</span>
                                <span className="text-white">{allocations.crypto}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={allocations.crypto}
                                onChange={(e) => handleSlider('crypto', e.target.value)}
                                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-emerald-400 font-bold">Mutual Funds</span>
                                <span className="text-white">{allocations.funds}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={allocations.funds}
                                onChange={(e) => handleSlider('funds', e.target.value)}
                                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        {/* Warning if total != 100 */}
                        {(allocations.gold + allocations.crypto + allocations.funds) !== 100 && (
                            <div className="text-xs text-rose-400 flex items-center gap-1">
                                <AlertTriangle size={12} /> Total allocation must be 100% (Current: {allocations.gold + allocations.crypto + allocations.funds}%)
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="h-80 w-full bg-slate-950 rounded-2xl p-4 border border-slate-800">
                        <ResponsiveContainer>
                            <LineChart data={projectionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    formatter={(v) => `₹${v.toLocaleString()}`}
                                />
                                <Legend />
                                <Line name="Your Portfolio" type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} />
                                <Line name="Conservative (FD)" type="monotone" dataKey="conservative" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="text-slate-400 text-sm">Projected Value in 10 Years: </span>
                        <span className="text-2xl font-black text-white ml-2">
                            ₹{projectionData[projectionData.length - 1]?.value.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSimulator;
