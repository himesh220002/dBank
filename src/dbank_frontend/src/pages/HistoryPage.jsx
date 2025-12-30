// /src/dbank_frontend/src/pages/HistoryPage.jsx
// Financial History & Achievements Page
// Displays a detailed ledger of all account operations and a "Hall of Fame" for completed goals.

import React, { useEffect, useState } from 'react';
import { dbank_backend } from 'declarations/dbank_backend';
import { Trophy, Medal, History, ArrowLeft, Download, Wallet, TrendingUp, CheckCircle2, Award, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * HistoryPage Component
 * 
 * Provides an audit trail and achievement tracking. Highlights:
 * - Tabbed interface for success stories (Hall of Fame) and raw ledger (Global Ledger).
 * - Intelligent transaction mapping: converts obscure opcodes into human-readable flows.
 * - Monthly grouping and pagination for long-term account histories.
 */
export function HistoryPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);
    const [archivedGoals, setArchivedGoals] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('ledger'); // Default to Ledger
    const [visibleCount, setVisibleCount] = useState(30);

    function handleLoadMore() {
        setVisibleCount(prev => Math.min(prev + 20, transactions.length));
    }

    function handleCollapse() {
        setVisibleCount(30);
    }

    /**
     * Maps raw backend transactions into rich, styled table rows.
     * Implements "Smart Source Tracking" to show money movement (e.g., from Main to Goal).
     */
    function renderLedgerRows() {
        let lastMonthStr = '';

        return transactions.slice(0, visibleCount).map((t, index) => {
            const date = new Date(Number(t.time) / 1000000);
            const monthStr = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            const showSeparator = monthStr !== lastMonthStr;
            lastMonthStr = monthStr;

            let type = 'Transfer';
            let from = 'MainBal.';
            let to = 'MainBal.';
            let amount = Number(t.amount);
            let amountColor = 'text-white';

            // Logic to determine From/To based on t.op and t.memo
            switch (t.op) {
                case 'deposit':
                    type = 'Deposit'; from = 'TopUp'; to = 'MainBal.';
                    amountColor = 'text-green-300';
                    break;
                case 'withdraw':
                    type = 'Withdraw'; from = 'MainBal.'; to = 'Withdraw';
                    amountColor = 'text-red-300';
                    break;
                case 'goal_fund':
                    type = 'Goal Fund'; from = 'MainBal.'; to = `Goal(${t.memo})`;
                    amountColor = 'text-blue-400';
                    break;
                case 'emi_fund':
                    type = 'EMI Fund'; from = 'MainBal.'; to = `emi_bucket(${t.memo})`;
                    amountColor = 'text-gray-200';
                    break;
                case 'goal_withdraw':
                    type = 'Goal W/D'; from = `Goal(${t.memo})`; to = 'MainBal.';
                    amountColor = 'text-green-300';
                    break;
                case 'emi_withdraw':
                    type = 'EMI W/D'; from = `emi_bucket(${t.memo})`; to = 'MainBal.';
                    amountColor = 'text-green-300';
                    break;
                case 'goal_liquidate':
                    type = 'Liquidate'; from = `Goal(${t.memo})`; to = 'MainBal.';
                    amountColor = 'text-green-300';
                    break;
                case 'compound':
                    type = 'Interest'; from = 'Yield'; to = 'MainBal.';
                    amountColor = 'text-green-300';
                    break;
                case 'emi_payment_bucket':
                    type = 'EMI Pay'; from = `emi_bucket(${t.memo})`; to = `emi_pay(${t.memo})`;
                    amountColor = 'text-red-300';
                    break;
                case 'emi_payment_wallet':
                    type = 'EMI Pay'; from = 'MainBal.'; to = `emi_pay(${t.memo})`;
                    amountColor = 'text-red-300';
                    break;
                case 'goal_create':
                    type = 'Create'; from = 'MainBal.'; to = `Goal(${t.memo})`;
                    amountColor = 'text-blue-400';
                    break;
                case 'emi_setup':
                    type = 'Setup'; from = 'MainBal.'; to = `emi_bucket(${t.memo})`;
                    amountColor = 'text-gray-200';
                    break;
                case 'buy_delta':
                    type = 'Buy Δ'; from = 'MainBal.'; to = `InvWallet(${t.memo})`;
                    amountColor = 'text-amber-400';
                    break;
                case 'sell_delta':
                    type = 'Sell Δ'; from = `InvWallet(${t.memo})`; to = 'MainBal.';
                    amountColor = 'text-green-300';
                    break;
                case 'buy_asset':
                    type = 'Buy Asset'; from = `InvWallet`; to = `Asset(${t.memo})`;
                    amountColor = 'text-purple-400';
                    break;
                case 'sell_asset':
                    type = 'Sell Asset'; from = `Asset(${t.memo})`; to = 'InvWallet';
                    amountColor = 'text-green-300';
                    break;
                default:
                    type = t.op;
                    from = '?';
                    to = '?';
            }

            return (
                <React.Fragment key={t.id}>
                    {showSeparator && (
                        <tr className="bg-slate-900/50">
                            <td colSpan="5" className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-y border-slate-800">
                                {monthStr}
                            </td>
                        </tr>
                    )}
                    <tr className="hover:bg-slate-800/30 transition-colors text-sm border-b border-slate-800/50 last:border-0 group">
                        <td className="p-4 font-medium text-slate-300">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${type.includes('Deposit') || type.includes('Interest') ? 'bg-emerald-500/10 text-emerald-500' :
                                type.includes('Withdraw') || type.includes('Pay') ? 'bg-rose-500/10 text-rose-500' :
                                    'bg-indigo-500/10 text-indigo-400'
                                }`}>
                                {type}
                            </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{from}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{to}</td>
                        <td className={`p-4 font-bold ${amountColor}`}>⨎{amount.toLocaleString()}</td>
                        <td className="p-4 text-slate-500 text-xs">
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                    </tr>
                </React.Fragment>
            );
        });
    }

    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Fetches and normalizes data for the history view.
     * Ensures transactions are sorted newest-to-oldest for immediate visibility.
     */
    async function fetchData() {
        try {
            const [g, cg, t] = await Promise.all([
                dbank_backend.getGoals(),
                dbank_backend.getCompletedGoals(),
                dbank_backend.getTransactions()
            ]);
            setGoals(g);
            setArchivedGoals(cg);
            setArchivedGoals(cg);
            // Ensure Newest First (Desc Time)
            const sortedTxs = t.sort((a, b) => Number(b.time) - Number(a.time));
            setTransactions(sortedTxs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Merge Active Completed + Archived
    const activeCompleted = goals.filter(g => {
        const isEMI = g.gType.hasOwnProperty('EMI');
        if (isEMI) {
            return Number(g.paidAmount) >= Number(g.targetAmount);
        }
        return Number(g.currentAmount) >= Number(g.targetAmount);
    });

    // Combine and normalize structure if needed (Assuming backend CompletedGoal matches needed fields)
    // Backend CompletedGoal: { name, amount, targetAmount, paidAmount, gType, completionDate }
    const allAchievements = [...archivedGoals, ...activeCompleted].reverse(); // Show newest successes first

    const totalSaved = allAchievements.reduce((acc, g) => acc + Number(g.targetAmount), 0);
    const totalTxVolume = transactions.reduce((acc, t) => acc + Number(t.amount), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        <div className="p-2 rounded-full bg-slate-900 border border-slate-800 group-hover:border-indigo-500/30 transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-semibold">Back to Dashboard</span>
                    </button>
                    <div className="text-right">
                        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                            Financial Legacy
                        </h1>
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">History & Achievements</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
                        <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 min-w-[3.5rem] flex justify-center">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{allAchievements.length}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Goals Achieved</div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 min-w-[3.5rem] flex justify-center">
                            <Wallet size={28} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">⨎{totalSaved.toLocaleString()}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Lifetime Value</div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500 min-w-[3.5rem] flex justify-center">
                            <History size={28} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{transactions.length}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Operations</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden min-h-[600px]">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-800">
                        <button
                            onClick={() => setActiveTab('fame')}
                            className={`flex-1 py-6 font-bold text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'fame' ? 'bg-slate-800/50 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                        >
                            <Medal size={18} /> Hall of Fame
                        </button>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={`flex-1 py-6 font-bold text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'ledger' ? 'bg-slate-800/50 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                        >
                            <History size={18} /> Global Ledger
                        </button>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <AnimatePresence mode='wait'>
                                {activeTab === 'fame' ? (
                                    <motion.div
                                        key="fame"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    >
                                        {allAchievements.length === 0 ? (
                                            <div className="col-span-full py-20 text-center opacity-50">
                                                <Award size={48} className="mx-auto mb-4 text-slate-700" />
                                                <p className="text-slate-500">No achievements unlocked yet. Keep growing!</p>
                                            </div>
                                        ) : (
                                            allAchievements.map((g, i) => {
                                                const isEMI = g.gType.hasOwnProperty('EMI');
                                                const dateVal = g.isArchived ? g.completionDate : g.dueDate;
                                                return (
                                                    <motion.div
                                                        key={g.id}
                                                        whileHover={{ y: -5 }}
                                                        className="group relative bg-slate-950 border border-slate-800 p-6 rounded-2xl hover:border-amber-500/50 transition-all hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-900/20"
                                                    >
                                                        <div className="absolute top-4 right-4">
                                                            {isEMI ? (
                                                                <div className="bg-rose-500/10 text-rose-500 px-2 py-1 rounded-md text-[10px] uppercase font-bold">Debt Free</div>
                                                            ) : (
                                                                <div className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md text-[10px] uppercase font-bold">Goal Met</div>
                                                            )}
                                                        </div>
                                                        <div className="mb-4 pt-2">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 ${isEMI ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {isEMI ? '🛡️' : '🏆'}
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white">{g.name}</h3>
                                                            <p className="text-xs text-slate-500 uppercase mt-1">
                                                                COMPLETED: {new Date(Number(dateVal) / 1000000).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2 border-t border-slate-800 pt-4">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Target Hit</span>
                                                                <span className="font-bold text-white">⨎{Number(g.targetAmount).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Duration</span>
                                                                <span className="font-bold text-slate-400">Fixed</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ledger"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
                                                        <th className="p-4 font-bold">Type</th>
                                                        <th className="p-4 font-bold">From</th>
                                                        <th className="p-4 font-bold">To</th>
                                                        <th className="p-4 font-bold">Amount</th>
                                                        <th className="p-4 font-bold">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {renderLedgerRows()}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        <div className="flex justify-center items-center gap-4 py-4">
                                            {visibleCount < transactions.length && (
                                                <button
                                                    onClick={handleLoadMore}
                                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-bold transition-colors border border-slate-700"
                                                >
                                                    Load More (+20)
                                                </button>
                                            )}
                                            {visibleCount > 30 && (
                                                <button
                                                    onClick={handleCollapse}
                                                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full transition-colors border border-rose-500/20"
                                                    title="Collapse to latest"
                                                >
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
