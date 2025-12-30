import React from 'react';
import { Clock } from 'lucide-react';

export function OperationsCard({ amount, setAmount, loading, onDeposit, onWithdraw }) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Clock className="text-sky-400" size={20} /> Operations
            </h3>
            <div className="space-y-6">
                <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Amount to Transact</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-800"
                        placeholder="0.00"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onDeposit} disabled={loading} className="bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50">Deposit</button>
                    <button onClick={onWithdraw} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50">Withdraw</button>
                </div>
            </div>
        </div>
    );
}
