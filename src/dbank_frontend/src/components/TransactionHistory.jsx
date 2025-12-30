import React, { useState } from 'react';
import { History, ArrowUpRight, ArrowDownRight, CreditCard, PlusCircle, Zap, ArrowRightLeft, X } from 'lucide-react';

export function TransactionHistory({ transactions }) {
    const [visibleTxsCount, setVisibleTxsCount] = useState(10);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold flex items-center gap-2"><History className="text-slate-400" size={20} /> Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-800">
                {transactions.slice(0, visibleTxsCount).map((t, i) => {
                    const op = t.op.toLowerCase();
                    const isCredit = ['deposit', 'compound', 'interest', 'goal_withdraw', 'goal_liquidate'].includes(op);

                    let Icon = isCredit ? ArrowUpRight : ArrowDownRight;
                    let colorClass = isCredit ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10';

                    if (op === 'emi_payment') {
                        Icon = CreditCard;
                        colorClass = 'text-rose-400 bg-rose-500/10';
                    } else if (op === 'goal_fund' || op === 'goal_create' || op === 'emi_setup') {
                        Icon = PlusCircle;
                        colorClass = 'text-indigo-400 bg-indigo-500/10';
                    } else if (op === 'goal_liquidate') {
                        Icon = Zap;
                        colorClass = 'text-amber-400 bg-amber-500/10';
                    } else if (op === 'goal_withdraw') {
                        Icon = ArrowRightLeft;
                        colorClass = 'text-emerald-400 bg-emerald-500/10';
                    }

                    return (
                        <div key={i} className="p-4 flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-sm capitalize">{t.op.replace('goal_', 'Goal ').replace('emi_', 'EMI ')} {t.memo && <span className="text-indigo-400 text-xs ml-2">({t.memo})</span>}</div>
                                    <div className="text-[10px] text-slate-500">{new Date(t.time).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>{isCredit ? '+' : '-'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    );
                })}
                <div className="p-4 flex justify-center items-center gap-4">
                    {transactions.length > visibleTxsCount && (
                        <button
                            onClick={() => setVisibleTxsCount(v => v + 10)}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-bold transition-colors border border-slate-700"
                        >
                            Load More
                        </button>
                    )}
                    {visibleTxsCount > 10 && (
                        <button
                            onClick={() => setVisibleTxsCount(10)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full transition-colors border border-rose-500/20"
                            title="Collapse to latest 10"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
