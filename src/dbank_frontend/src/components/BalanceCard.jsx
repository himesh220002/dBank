import React from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { IoRefreshCircleOutline } from "react-icons/io5";

export function BalanceCard({ balance, loading, onCompound, onRefresh }) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={120} />
            </div>
            <h2 className="text-slate-400 text-sm font-medium uppercase tracking-widest">Total Balance</h2>
            <div className="text-5xl font-bold mt-4 text-white flex items-baseline gap-2">
                {balance === null ? '---' : balance.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                <span className="text-2xl text-slate-600 font-light">⨎</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                    onClick={onCompound}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl hover:bg-emerald-500/20 transition-all font-semibold disabled:opacity-50"
                >
                    <Plus size={18} /> Compound
                </button>
                <button
                    onClick={onRefresh}
                    className="flex items-center justify-center bg-slate-800 text-slate-300 py-3 rounded-xl hover:bg-slate-700 transition"
                >
                    <IoRefreshCircleOutline size={24} />
                </button>
            </div>
        </div>
    );
}
