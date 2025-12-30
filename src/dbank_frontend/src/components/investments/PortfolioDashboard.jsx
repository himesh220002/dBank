import React, { useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { InvestmentService } from '../../services/InvestmentService';
import PinEntryModal from '../PinEntryModal';

const PortfolioDashboard = ({ holdings, deltaBalance, allAssets, onSellAsset, loading }) => {
    const [selectedHolding, setSelectedHolding] = useState(null);
    const [sellAmount, setSellAmount] = useState('');
    const [showPin, setShowPin] = useState(false);

    // Calculate current values for each holding
    const enrichedHoldings = holdings.map(holding => {
        let asset = allAssets.find(a => a.symbol === holding.symbol);

        // Fallback for legacy "MF" symbol - use average of all mutual funds
        if (!asset && holding.symbol === 'MF') {
            const mutualFunds = allAssets.filter(a => a.type === 'fund');
            if (mutualFunds.length > 0) {
                const avgPrice = mutualFunds.reduce((sum, f) => sum + f.price, 0) / mutualFunds.length;
                const avgChange = mutualFunds.reduce((sum, f) => sum + f.change, 0) / mutualFunds.length;
                asset = {
                    id: 'mf-legacy',
                    name: 'Mutual Fund (Legacy)',
                    symbol: 'MF',
                    price: avgPrice,
                    change: avgChange,
                    type: 'fund'
                };
            }
        }

        const currentPrice = asset?.price || 0;
        const currentValue = holding.amount * currentPrice;
        const deltaValue = InvestmentService.calculateDeltaCost(holding.amount, currentPrice);
        const profitLoss = deltaValue - holding.totalInvested;
        const profitLossPercent = holding.totalInvested > 0 ? (profitLoss / holding.totalInvested) * 100 : 0;

        return {
            ...holding,
            currentPrice,
            currentValue,
            deltaValue,
            profitLoss,
            profitLossPercent
        };
    });

    const totalPortfolioValue = deltaBalance + enrichedHoldings.reduce((sum, h) => sum + h.deltaValue, 0);
    const totalInvested = enrichedHoldings.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalProfitLoss = totalPortfolioValue - deltaBalance - totalInvested;

    const handleSellInitiate = (e) => {
        e.preventDefault();
        if (!selectedHolding || !sellAmount || Number(sellAmount) <= 0 || Number(sellAmount) > selectedHolding.amount) return;
        setShowPin(true);
    };

    const handlePinSuccess = async () => {
        if (!selectedHolding || !sellAmount) return;

        const assetType = selectedHolding.assetType;
        await onSellAsset(assetType, selectedHolding.symbol, Number(sellAmount), selectedHolding.currentPrice);

        setSelectedHolding(null);
        setSellAmount('');
        setShowPin(false);
    };

    return (
        <div className="space-y-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <PieChart size={18} className="text-indigo-400" />
                        <span className="text-sm text-slate-400">Total Portfolio</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{totalPortfolioValue.toLocaleString()} Δ</div>
                    <div className="text-xs text-slate-500 mt-1">≈ ⨎{InvestmentService.deltaToDbank(totalPortfolioValue).toFixed(2)}</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Coins size={18} className="text-amber-400" />
                        <span className="text-sm text-slate-400">Liquid Tokens</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{deltaBalance.toLocaleString()} Δ</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {totalPortfolioValue > 0 ? ((deltaBalance / totalPortfolioValue) * 100).toFixed(1) : 0}% of portfolio
                    </div>
                </div>

                <div className={`bg-gradient-to-br rounded-xl p-6 border ${totalProfitLoss >= 0
                    ? 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20'
                    : 'from-rose-500/10 to-red-500/10 border-rose-500/20'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {totalProfitLoss >= 0 ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-rose-400" />}
                        <span className="text-sm text-slate-400">Total P/L</span>
                    </div>
                    <div className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString()} Δ
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100).toFixed(2) : 0}%
                    </div>
                </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Your Holdings</h3>
                </div>

                {enrichedHoldings.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No assets held yet. Visit the Marketplace to start investing!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Asset</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Quantity</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Avg Price</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Current Price</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Value (Δ)</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">P/L</th>
                                    <th className="text-right p-4 text-sm font-medium text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichedHoldings.map((holding, idx) => (
                                    <tr key={idx} className="border-t border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{holding.symbol}</div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(holding.purchaseDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-white font-mono">{holding.amount.toFixed(6)}</td>
                                        <td className="p-4 text-right text-slate-400 font-mono">
                                            ₹{(InvestmentService.deltaToDbank(holding.totalInvested) / holding.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-right text-white font-mono">₹{holding.currentPrice.toLocaleString()}</td>
                                        <td className="p-4 text-right text-amber-400 font-mono">{holding.deltaValue.toLocaleString()}</td>
                                        <td className={`p-4 text-right font-mono ${holding.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLoss.toFixed(0)} Δ
                                            <div className="text-xs">({holding.profitLossPercent.toFixed(2)}%)</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedHolding(holding);
                                                    setSellAmount(holding.amount.toString());
                                                }}
                                                className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition-colors"
                                            >
                                                Sell
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sell Modal */}
            {selectedHolding && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Sell {selectedHolding.symbol}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Quantity to Sell</label>
                                <input
                                    type="number"
                                    value={sellAmount}
                                    onChange={(e) => setSellAmount(e.target.value)}
                                    max={selectedHolding.amount}
                                    step="0.000001"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500/50"
                                />
                                <div className="text-xs text-slate-500 mt-1">
                                    Available: {selectedHolding.amount.toFixed(6)}
                                </div>
                            </div>

                            {sellAmount && Number(sellAmount) > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <div className="text-sm text-slate-400 mb-1">You will receive</div>
                                    <div className="text-2xl font-bold text-amber-400">
                                        {InvestmentService.calculateDeltaCost(Number(sellAmount), selectedHolding.currentPrice).toLocaleString()} Δ
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedHolding(null);
                                        setSellAmount('');
                                    }}
                                    className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-lg font-medium hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSellInitiate}
                                    disabled={loading || !sellAmount || Number(sellAmount) <= 0 || Number(sellAmount) > selectedHolding.amount}
                                    className="flex-1 py-3 bg-rose-500/20 text-rose-400 rounded-lg font-medium hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Selling...' : 'Confirm Sell'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PinEntryModal
                isOpen={showPin}
                onClose={() => setShowPin(false)}
                onSuccess={handlePinSuccess}
                amount={selectedHolding ? Math.floor(InvestmentService.deltaToDbank(InvestmentService.calculateDeltaCost(Number(sellAmount), selectedHolding.currentPrice))) : 0}
            />
        </div>
    );
};

export default PortfolioDashboard;
