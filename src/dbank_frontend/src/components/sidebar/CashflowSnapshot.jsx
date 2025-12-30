import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Send } from 'lucide-react';

const CashflowSnapshot = ({ transactions = [], balance = 0, goals = [], emis = [] }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Safety checks
        const safeBalance = (balance === null || balance === undefined) ? 0 : Number(balance);
        const safeTxs = Array.isArray(transactions) ? transactions : [];
        const safeGoals = Array.isArray(goals) ? goals : [];
        const safeEmis = Array.isArray(emis) ? emis : [];

        let inflow = 0;
        let outflow = 0;
        let totalEMIPaidOut = 0;
        let totalDeltaPurchased = 0;
        let totalDeltaSold = 0;

        safeTxs.forEach(tx => {
            // Safety check: ensure tx.op exists and is a string
            if (!tx || !tx.op || typeof tx.op !== 'string') return;

            const txDate = new Date(tx.time);
            const op = tx.op.toLowerCase();
            const amt = Number(tx.amount);

            // Track lifetime EMI payments sent outside (both bucket and wallet payments)
            if (op === 'emi_payment_bucket' || op === 'emi_payment_wallet') {
                totalEMIPaidOut += amt;
            }

            // Track Delta bridge flows (investments)
            if (op === 'buy_delta') {
                totalDeltaPurchased += amt;
            }
            if (op === 'sell_delta') {
                totalDeltaSold += amt;
            }

            // This month's cashflow
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                // INFLOW to Main
                if (op.includes('deposit') || op.includes('goal_withdraw') || op.includes('emi_withdraw') || op.includes('income') || op === 'sell_delta') {
                    inflow += amt;
                }
                // OUTFLOW from Main (includes goal funding, EMI funding, Delta bridge, and EMI payments from wallet)
                else if (op.includes('withdraw') || op.includes('goal_fund') || op.includes('emi_fund') || op === 'emi_payment_wallet' || op.includes('spend') || op === 'buy_delta') {
                    // Exclude goal withdrawals from outflow (they're already counted as inflow)
                    if (!op.includes('goal_withdraw') && !op.includes('emi_withdraw')) {
                        outflow += amt;
                    }
                }
            }
        });

        // Calculate total system balance
        const goalsTotal = safeGoals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
        const emiBucketTotal = safeEmis.reduce((sum, e) => sum + Number(e.currentAmount || 0), 0);
        const totalSystem = safeBalance + goalsTotal + emiBucketTotal;

        // Starting balance = Current Total - This Month's Net
        const netThisMonth = inflow - outflow;
        const startingBalance = totalSystem - netThisMonth;

        return {
            inflow,
            outflow,
            net: netThisMonth,
            totalSystem,
            startingBalance,
            totalEMIPaidOut,
            totalDeltaPurchased,
            totalDeltaSold,
            goalsTotal,
            emiBucketTotal,
            safeBalance
        };
    }, [transactions, balance, goals, emis]);

    return (
        <div className="space-y-3">
            {/* System Overview */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-3 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                    <Wallet size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total System</span>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                    ${stats.totalSystem.toFixed(2)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                        <div className="text-slate-400">Main</div>
                        <div className="text-white text-sm font-bold">${stats.safeBalance.toFixed(0)}</div>
                    </div>
                    <div>
                        <div className="text-slate-400">Goals</div>
                        <div className="text-white text-sm font-bold">${stats.goalsTotal.toFixed(0)}</div>
                    </div>
                    <div>
                        <div className="text-slate-400">EMI</div>
                        <div className="text-white text-sm font-bold">${stats.emiBucketTotal.toFixed(0)}</div>
                    </div>
                </div>
            </div>

            {/* This Month's Flow */}
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">This Month</div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                        <div className="flex items-center gap-1 text-emerald-400 mb-1">
                            <TrendingUp size={12} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Inflow</span>
                        </div>
                        <div className="text-lg font-bold text-white">${stats.inflow.toFixed(0)}</div>
                    </div>
                    <div className="bg-rose-500/10 rounded-lg p-2 border border-rose-500/20">
                        <div className="flex items-center gap-1 text-rose-400 mb-1">
                            <TrendingDown size={12} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Outflow</span>
                        </div>
                        <div className="text-lg font-bold text-white">${stats.outflow.toFixed(0)}</div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs bg-slate-800/50 rounded-lg p-2">
                    <span className="text-slate-400">Net Cashflow</span>
                    <span className={`font-mono font-bold ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.net >= 0 ? '+' : ''}${stats.net.toFixed(2)}
                    </span>
                </div>

                {/* Flow Bar */}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${stats.inflow + stats.outflow > 0 ? (stats.inflow / (stats.inflow + stats.outflow)) * 100 : 50}%` }}
                    />
                    <div
                        className="h-full bg-rose-500"
                        style={{ width: `${stats.inflow + stats.outflow > 0 ? (stats.outflow / (stats.inflow + stats.outflow)) * 100 : 50}%` }}
                    />
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                        <TrendingUp size={10} className="text-indigo-400" />
                        <span>Delta Bought</span>
                    </div>
                    <div className="text-white font-bold">${stats.totalDeltaPurchased.toFixed(0)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                        <TrendingDown size={10} className="text-emerald-400" />
                        <span>Delta Sold</span>
                    </div>
                    <div className="text-white font-bold">${stats.totalDeltaSold.toFixed(0)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                    <div className="text-slate-500 mb-1">Month Start</div>
                    <div className="text-white font-bold">${stats.startingBalance.toFixed(0)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                        <Send size={10} />
                        <span>EMI Paid Out</span>
                    </div>
                    <div className="text-rose-400 font-bold">${stats.totalEMIPaidOut.toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
};

export default CashflowSnapshot;
