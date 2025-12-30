import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { InvestmentService } from '../../services/InvestmentService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AssetDetailModal = ({ asset, onClose, onBuyClick }) => {
    const [timeRange, setTimeRange] = useState('1M');
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Generate price history based on asset type and current price
        async function loadHistory() {
            const history = await InvestmentService.getHistory(
                asset.id,
                timeRange,
                asset.price,
                asset.type,
                asset.history
            );
            setChartData(history);
        }
        loadHistory();
    }, [asset, timeRange]);

    const ranges = ['1D', '1W', '1M', '1Y', '5Y'];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="text-sm text-slate-500">{asset.symbol}</div>
                        <h3 className="text-3xl font-bold text-white">{asset.name}</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="text-2xl font-bold text-amber-400">
                                ₹{asset.price.toLocaleString()}
                            </div>
                            {asset.unit && (
                                <div className="text-sm text-slate-500">per {asset.unit}</div>
                            )}
                            <div className={`flex items-center gap-1 text-sm font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {asset.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {Math.abs(asset.change).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2 mb-4">
                    {ranges.map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                {/* Price Chart */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <XAxis
                                    dataKey="label"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                    padding={{ left: 15, right: 15 }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                    domain={['dataMin - dataMin * 0.05', 'dataMax + dataMax * 0.05']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #1e293b',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Price']}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="val"
                                    stroke={asset.change >= 0 ? '#10b981' : '#f43f5e'}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fbbf24' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Asset Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xs text-slate-500 mb-1">Type</div>
                        <div className="text-sm font-bold text-white capitalize">{asset.type}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xs text-slate-500 mb-1">24h Change</div>
                        <div className={`text-sm font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xs text-slate-500 mb-1">Current Price</div>
                        <div className="text-sm font-bold text-white">₹{asset.price.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xs text-slate-500 mb-1">Delta Cost</div>
                        <div className="text-sm font-bold text-amber-400">
                            {InvestmentService.dbankToDelta(asset.price).toLocaleString()} Δ
                        </div>
                    </div>
                </div>

                {/* Buy Button */}
                <button
                    onClick={() => {
                        onBuyClick();
                        onClose();
                    }}
                    className="w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                >
                    <BarChart3 size={18} />
                    Buy {asset.symbol}
                </button>
            </div>
        </div>
    );
};

export default AssetDetailModal;
