import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, PiggyBank } from 'lucide-react';

export function TransactionModal({ isOpen, onClose, title, type, onConfirm, loading, success, balanceInfo }) {
    const [amount, setAmount] = useState('');
    const [paymentSource, setPaymentSource] = useState('bucket'); // 'bucket' or 'main'
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setError('');
            // Default to bucket if available, else main
            if (balanceInfo && balanceInfo.goalBalance > 0) {
                setPaymentSource('bucket');
            } else {
                setPaymentSource('main');
            }
        }
    }, [isOpen, balanceInfo]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // For delete, no amount validation needed
        if (type === 'delete') {
            onConfirm();
            return;
        }

        const val = Number(amount);
        if (!amount || isNaN(amount) || val <= 0) return;

        // Validation: Check for overpayment on EMI
        if (type === 'pay' && balanceInfo) {
            if (balanceInfo.remaining !== undefined && val > balanceInfo.remaining) {
                setError(`Amount exceeds remaining debt (Max: ⨎${balanceInfo.remaining})`);
                return;
            }
            if (paymentSource === 'bucket' && val > balanceInfo.goalBalance) {
                setError(`Insufficient Goal Balance (Max: ⨎${balanceInfo.goalBalance})`);
                return;
            }
            if (paymentSource === 'main' && val > balanceInfo.mainBalance) {
                setError(`Insufficient Main Balance (Max: ⨎${balanceInfo.mainBalance})`);
                return;
            }
        }

        // Pass source if it's a payment, otherwise just amount
        if (type === 'pay') {
            onConfirm(val, paymentSource);
        } else {
            onConfirm(val);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white">{title}</h3>
                    {!success && (
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {success ? (
                    <div className="p-8 flex flex-col items-center justify-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h4 className="text-xl font-bold text-white">Success!</h4>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
                            <div className="h-full bg-emerald-500 animate-[progress_2s_linear_forwards]" />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">

                        {/* Status Card for EMI Context */}
                        {type === 'pay' && balanceInfo?.targetAmount && (
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-2">
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-2">
                                    <span>Repayment Progress</span>
                                    <span className="text-indigo-400">
                                        {((balanceInfo.paidAmount / balanceInfo.targetAmount) * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-slate-400">Paid</div>
                                        <div className="text-sm font-bold text-white">⨎{balanceInfo.paidAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-rose-400">Remaining Due</div>
                                        <div className="text-sm font-bold text-rose-500">⨎{balanceInfo.remaining.toLocaleString()}</div>
                                    </div>
                                </div>
                                {/* Visual Progress Bar inside Modal */}
                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (balanceInfo.paidAmount / balanceInfo.targetAmount) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {type === 'pay' && balanceInfo && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div
                                    onClick={() => setPaymentSource('bucket')}
                                    className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentSource === 'bucket' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/30'}`}
                                >
                                    <PiggyBank size={20} />
                                    <div className="text-center">
                                        <div className="text-[10px] uppercase font-bold">Goal Bucket</div>
                                        <div className="text-xs">⨎{balanceInfo.goalBalance.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setPaymentSource('main')}
                                    className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentSource === 'main' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/30'}`}
                                >
                                    <Wallet size={20} />
                                    <div className="text-center">
                                        <div className="text-[10px] uppercase font-bold">Main Wallet</div>
                                        <div className="text-xs">⨎{balanceInfo.mainBalance.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {type === 'delete' ? (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-center">
                                <p className="text-rose-400 text-sm font-medium">Are you sure you want to delete this goal?</p>
                                <p className="text-rose-500/60 text-xs mt-1">This action cannot be undone.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Amount</label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={amount}
                                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                    placeholder="0.00"
                                    className={`w-full bg-slate-950 border rounded-xl p-4 text-xl font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'}`}
                                />
                                {type === 'withdraw' && balanceInfo?.goalBalance > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setAmount(balanceInfo.goalBalance)}
                                        className="absolute right-4 top-10 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 hover:bg-indigo-500/20"
                                    >
                                        MAX
                                    </button>
                                )}
                                {error && <p className="text-rose-500 text-xs mt-2 font-bold">{error}</p>}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (type !== 'delete' && (!amount || !!error))}
                            className={`w-full py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all ${type === 'withdraw'
                                ? 'bg-slate-800 hover:bg-slate-700'
                                : type === 'pay' || type === 'delete'
                                    ? 'bg-rose-600 hover:bg-rose-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {type === 'delete' ? <X size={18} /> : <Check size={18} />}
                                    {type === 'delete' ? 'Delete Goal' : 'Confirm'}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
            <style>{`
        @keyframes progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
        </div >
    );
}
