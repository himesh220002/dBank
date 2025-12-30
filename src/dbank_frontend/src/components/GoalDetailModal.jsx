// /src/dbank_frontend/src/components/GoalDetailModal.jsx
// Deep-Dive Goal Analytics & Management Modal
// Provides detailed financial projections, safety zone indicators, and inline transaction controls.

import React, { useState } from 'react';
import {
    Trophy,
    PartyPopper,
    Wallet,
    Zap,
    CreditCard,
    Plus,
    ArrowRightLeft,
    CheckCircle2,
    X,
    Check,
    Pencil,
    Star,
    Target,
    Lock
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
    Cell
} from 'recharts';

/**
 * GoalDetailModal Component
 * 
 * Comprehensive management interface for a single financial plan. Features:
 * - Real-time "Wealth Trajectory" or "Path to Freedom" (EMI) chart projections.
 * - "Green Zone" safety indicator for EMI buckets to ensure stress-free repayment.
 * - Inline "Fast-Action" buttons with success animations for immediate funding/payment.
 * - Editable goal parameters (Name, Target, Commitment) for dynamic planning.
 */
export function GoalDetailModal({ goal, onClose, onFund, onPayEMI, onWithdraw, onPayFromBucket, onUpdate, onToggleStatus }) {
    const [commitment, setCommitment] = useState(goal.monthlyCommitment);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(goal.name);
    const [editTarget, setEditTarget] = useState(goal.targetAmount);

    // New states for inline interaction
    const [activeAction, setActiveAction] = useState(null); // 'fund', 'pay_main', 'pay_bucket', 'withdraw'
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success'

    const isEMI = goal.gType.hasOwnProperty('EMI');
    const progress = isEMI ? ((goal.paidAmount + goal.currentAmount) / goal.targetAmount) * 100 : (goal.currentAmount / goal.targetAmount) * 100;
    const isAchieved = progress >= 100;

    /**
     * Inline Action Pipeline
     * Orchestrates the verification, loading, and success states for modal transactions.
     * Provides immediate visual feedback (Confetti/Green status) upon successful backend response.
     */
    const handleActionSubmit = async (actionType) => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) return;
        setStatus('loading');

        // Slight delay to simulate processing if immediate
        try {
            if (actionType === 'pay_main') await onPayEMI(goal.id, Number(amount));
            else if (actionType === 'pay_bucket') await onPayFromBucket(goal.id, Number(amount));
            else if (actionType === 'fund') await onFund(goal.id, Number(amount));
            else if (actionType === 'withdraw') await onWithdraw(goal.id, Number(amount));

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setActiveAction(null);
                setAmount('');
            }, 1500);
        } catch (e) {
            setStatus('idle');
            alert("Action failed");
        }
    };

    const handleSave = () => {
        onUpdate(goal.id, editName, Number(editTarget), commitment);
        setIsEditing(false);
    };

    /**
     * UI Helper: ActionButton
     * A polymorphic button that transforms into an input field or a success indicator.
     * Centralizes the look-and-feel of various goal-based transactions.
     */
    const ActionButton = ({ type, label, icon: Icon, colorClass, bgClass, shadowClass, disabled, subtitle }) => {
        const isActive = activeAction === type;
        const isSuccess = isActive && status === 'success';
        const isLoading = isActive && status === 'loading';

        if (isActive) {
            return (
                <div className={`w-full rounded-2xl overflow-hidden transition-all duration-300 ${bgClass.replace('hover:', '')} border border-white/10`}>
                    {isSuccess ? (
                        <div className="p-4 flex flex-col items-center justify-center text-white h-32 bg-emerald-500 transition-colors duration-500">
                            <CheckCircle2 size={40} className="animate-bounce mb-2" />
                            <span className="font-bold">Success!</span>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3 animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="flex justify-between items-center text-xs opacity-70">
                                <span className="uppercase font-bold">{label}</span>
                                <button onClick={() => setActiveAction(null)}><X size={14} /></button>
                            </div>
                            <input
                                type="number"
                                autoFocus
                                placeholder="Amount..."
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-lg font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                            />
                            <button
                                onClick={() => handleActionSubmit(type)}
                                disabled={isLoading}
                                className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2"
                            >
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                                Confirm
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <button
                onClick={() => { setActiveAction(type); setAmount(''); }}
                disabled={disabled}
                className={`w-full p-4 rounded-2xl font-bold text-left transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed ${bgClass} ${shadowClass}`}
            >
                <div>
                    <div className={`text-sm ${colorClass}`}>{label}</div>
                    {subtitle && <div className="text-[10px] opacity-60 font-normal mt-0.5">{subtitle}</div>}
                </div>
                {Icon && <Icon size={20} className={`${colorClass} opacity-70 group-hover:scale-110 transition-transform`} />}
            </button>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className={`bg-slate-900 border ${isAchieved ? 'border-amber-500/50' : 'border-slate-800'} w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAchieved ? 'border-amber-500/20 bg-amber-500/10' : 'border-slate-800 bg-indigo-500/5'} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isAchieved ? 'bg-amber-500/20 text-amber-500' : isEMI ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            {isAchieved ? <Trophy size={20} /> : isEMI ? <Lock size={20} /> : <Target size={20} />}
                        </div>
                        <div>
                            {isEditing ? (
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-lg font-bold text-white mb-1"
                                />
                            ) : (
                                <h3 className={`font-bold text-lg ${isAchieved ? 'text-amber-500' : ''}`}>{goal.name} {isAchieved && ' - GOAL REACHED!'}</h3>
                            )}
                            <p className="text-[10px] text-slate-500 uppercase">Financial Plan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-800 rounded-lg text-indigo-400">
                                <Pencil size={18} />
                            </button>
                        ) : (
                            <button onClick={handleSave} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400">
                                <Check size={18} />
                            </button>
                        )}
                        {isAchieved && <Star className="text-amber-500 fill-amber-500 animate-pulse" size={18} />}
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-2">
                                {isEMI ? 'Repayment Status' : 'Completion Status'}
                            </label>
                            <div className={`text-4xl font-black ${isAchieved ? 'text-amber-500' : 'text-white'} flex items-baseline gap-2`}>
                                {progress.toFixed(1)}%
                                {isAchieved && <PartyPopper className="text-amber-500" size={24} />}
                            </div>
                            {isEMI && (
                                <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                                    Paid: ⨎{goal.paidAmount.toLocaleString()} / ⨎{goal.targetAmount.toLocaleString()}
                                </div>
                            )}
                        </div>

                        <div className={`p-5 rounded-2xl border flex items-center justify-between ${isEMI ? 'bg-rose-500/10 border-rose-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                            <div>
                                <h4 className={`text-xs font-bold uppercase ${isEMI ? 'text-rose-400' : 'text-indigo-400'}`}>
                                    {isEMI ? 'Safe Bucket Balance' : 'Current Savings'}
                                </h4>
                                <p className="text-2xl font-black text-white">⨎{goal.currentAmount.toLocaleString()}</p>
                            </div>
                            <Wallet className={isEMI ? 'text-rose-500' : 'text-indigo-500'} size={32} />
                        </div>

                        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-slate-400 uppercase">Target Amount</span>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editTarget}
                                            onChange={(e) => setEditTarget(e.target.value)}
                                            className="bg-slate-900 border border-slate-700 rounded w-24 text-right px-2 py-1 text-sm font-bold text-white"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-white">⨎{goal.targetAmount.toLocaleString()}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 uppercase">Monthly Contribution</span>
                                        {!isAchieved && (
                                            <button
                                                onClick={() => onToggleStatus(goal.id, !goal.status.hasOwnProperty('Active'))}
                                                className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${goal.status.hasOwnProperty('Active') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400 opacity-50'}`}
                                                title={goal.status.hasOwnProperty('Active') ? "Auto-Pay Active" : "Auto-Pay Paused"}
                                            >
                                                {goal.status.hasOwnProperty('Active') ? <Zap size={8} className="fill-current" /> : <Lock size={8} />}
                                                {goal.status.hasOwnProperty('Active') ? "AUTO ON" : "PAUSED"}
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-indigo-400">⨎{commitment.toFixed(2)}</span>
                                </div>
                                <input disabled={!isEditing} type="range" min="1" max={Math.max(100, goal.targetAmount / 2)} step="1" value={commitment} onChange={(e) => setCommitment(Number(e.target.value))} className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${isEditing ? 'bg-slate-700 accent-indigo-500' : 'bg-slate-800 accent-slate-600'}`} />
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                                <span className="text-slate-400">Target Date</span>
                                <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-4">
                            <Zap className="text-emerald-400" size={24} />
                            <div>
                                <p className="text-[10px] text-emerald-400/70 uppercase">Estimated Finish</p>
                                <p className="text-sm font-bold text-emerald-400">
                                    {(() => {
                                        const progressVal = isEMI ? (goal.paidAmount + goal.currentAmount) : goal.currentAmount;
                                        const remaining = goal.targetAmount - progressVal;
                                        if (remaining <= 0) return "Achieved!";
                                        const months = remaining / Math.max(1, commitment);
                                        const finishDate = new Date();
                                        finishDate.setMonth(finishDate.getMonth() + Math.ceil(months));
                                        return finishDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Chart 1: The Trajectory (Freedom or Wealth) */}
                        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400">
                                    {isEMI ? 'Path to Freedom' : 'Wealth Trajectory'}
                                </h4>
                                <div className="flex gap-2 text-[10px]">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Projected</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-600"></div> Target</span>
                                </div>
                            </div>
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={(() => {
                                        const data = [];
                                        let curr = isEMI ? (goal.paidAmount + goal.currentAmount) : goal.currentAmount;
                                        const remaining = goal.targetAmount - curr;
                                        const months = Math.min(24, Math.ceil(remaining / Math.max(1, commitment)));
                                        const rate = isEMI ? 0 : 0.08 / 12;
                                        for (let i = 0; i <= Math.max(months, 6); i++) {
                                            data.push({
                                                month: i === 0 ? 'Now' : `+${i}m`,
                                                amount: Math.round(curr),
                                                target: goal.targetAmount
                                            });
                                            curr = curr * Math.exp(rate) + commitment;
                                        }
                                        return data;
                                    })()}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isEMI ? "#f43f5e" : "#6366f1"} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={isEMI ? "#f43f5e" : "#6366f1"} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                                            formatter={(val) => `⨎${val.toLocaleString()}`}
                                        />
                                        <ReferenceLine y={goal.targetAmount} stroke="#475569" strokeDasharray="3 3" />
                                        <Area type="monotone" dataKey="amount" stroke={isEMI ? "#f43f5e" : "#6366f1"} fill="url(#colorAmt)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Chart 2: The Safety Zone (Buffer Health) */}
                        {isEMI && (
                            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold uppercase text-slate-400">Green Zone Indicator</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${(goal.currentAmount / commitment) >= 3 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        (goal.currentAmount / commitment) >= 1 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                        {(goal.currentAmount / commitment) >= 3 ? 'Safe (3+ Months)' : (goal.currentAmount / commitment) >= 1 ? 'Building' : 'At Risk'}
                                    </span>
                                </div>
                                <div className="h-24 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={[{ name: 'Buffer', value: Math.min(6, goal.currentAmount / Math.max(1, commitment)) }]}>
                                            <XAxis type="number" domain={[0, 6]} hide />
                                            <YAxis type="category" dataKey="name" hide />
                                            <Tooltip cursor={{ fill: 'transparent' }} content={() => null} />
                                            <ReferenceLine x={3} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'GREEN ZONE', fill: '#10b981', fontSize: 10, position: 'top' }} />
                                            <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                                <Cell fill={(goal.currentAmount / commitment) >= 3 ? '#10b981' : (goal.currentAmount / commitment) >= 1 ? '#f59e0b' : '#f43f5e'} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center mt-2">
                                    You have <strong className="text-white">{(goal.currentAmount / Math.max(1, commitment)).toFixed(1)} months</strong> of EMI saved.
                                    Aim for 3+ months to be stress-free.
                                </p>
                            </div>
                        )}

                        {!isEMI && (
                            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-slate-400">Total Interest Earned</h4>
                                    <p className="text-lg font-bold text-emerald-400">+⨎{(goal.currentAmount - (goal.currentAmount / Math.exp(0.08 * (Date.now() - (Number(goal.lastUpdate) / 1_000_000)) / 31536000000))).toFixed(2)}</p>
                                </div>
                                <TrendingUp className="text-emerald-500/20" size={48} />
                            </div>
                        )}

                        {isEMI ? (
                            <div className="flex flex-col gap-3">
                                <ActionButton
                                    type="pay_main"
                                    label="Pay EMI from Main Balance"
                                    subtitle="Reduces debt directly"
                                    icon={CreditCard}
                                    bgClass="bg-rose-600 hover:bg-rose-500"
                                    colorClass="text-white"
                                    shadowClass="shadow-lg shadow-rose-900/20"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <ActionButton
                                        type="fund"
                                        label="Add to Bucket"
                                        icon={Plus}
                                        bgClass="bg-indigo-600 hover:bg-indigo-500"
                                        colorClass="text-white"
                                        shadowClass="shadow-lg shadow-indigo-900/20"
                                    />
                                    <ActionButton
                                        type="withdraw"
                                        label="Withdraw"
                                        icon={ArrowRightLeft}
                                        bgClass="bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                        colorClass="text-slate-300"
                                        shadowClass=""
                                    />
                                </div>
                                <ActionButton
                                    type="pay_bucket"
                                    label="Pay EMI from Bucket"
                                    subtitle={`Available: ⨎${goal.currentAmount.toLocaleString()}`}
                                    icon={CheckCircle2}
                                    bgClass="bg-emerald-600 hover:bg-emerald-500"
                                    colorClass="text-white"
                                    disabled={goal.currentAmount <= 0}
                                    shadowClass="shadow-lg shadow-emerald-900/20"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <ActionButton
                                    type="fund"
                                    label="Fund Goal Now"
                                    subtitle="Add savings from Main Balance"
                                    icon={Plus}
                                    bgClass="bg-indigo-600 hover:bg-indigo-500"
                                    colorClass="text-white"
                                    shadowClass="shadow-lg shadow-indigo-900/20"
                                />
                                <ActionButton
                                    type="withdraw"
                                    label="Withdraw Funds"
                                    subtitle="Move back to Main Wallet"
                                    icon={ArrowRightLeft}
                                    bgClass="bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                    colorClass="text-slate-300"
                                    shadowClass=""
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendingUp({ className, size }) {
    // Simple icon placeholder if not imported from lucide-react in parent but we are importing it.
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}
