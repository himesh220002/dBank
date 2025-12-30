// /src/dbank_frontend/src/components/FinancialPlans.jsx
// Financial Lifecycle Component
// Handles the display, creation, and management of savings goals and EMI debts.

import React, { useState } from 'react';
import { Target, Settings2, Plus, Trophy, PartyPopper as Party, Trash2, CheckCircle2, Lock, ChevronDown, ChevronUp, Zap } from 'lucide-react';

/**
 * FinancialPlans Component
 * 
 * Main interface for goal-based banking. Includes:
 * - Reactive goal grid with progress-based styling and animations.
 * - Dynamic form for establishing newSavings/EMI plans.
 * - "Achieved Goals" archive with cumulative target tracking.
 * - Manage mode for administrative actions (deletion, status toggling).
 */
export function FinancialPlans({
    goals,
    completedGoals,
    onSelectGoal,
    onCreateGoal,
    manageMode,
    toggleManageMode,
    onFund,
    onWithdraw,
    onDelete,
    onPayEMI,
    loading,
    healthScore = 50,
    insights = []
}) {
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [showAchieved, setShowAchieved] = useState(false);
    const [goalName, setGoalName] = useState('');
    const [goalAmount, setGoalAmount] = useState('');
    const [goalType, setGoalType] = useState('');
    const [goalDueDate, setGoalDueDate] = useState('');
    const [goalInitialFund, setGoalInitialFund] = useState('');
    const [goalAutoPay, setGoalAutoPay] = useState(true);

    /**
     * Goal Creation Logic
     * Normalizes dates and propagates new goal data to the backend.
     * Default: If no due date is provided, sets a 10-year long-term horizon.
     */
    const handleCreate = () => {
        // Handle Optional Date: Default to 10 years from now if not set
        let finalDate = goalDueDate;
        if (!finalDate) {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 10);
            finalDate = d.toISOString().split('T')[0];
        }

        onCreateGoal({
            name: goalName,
            amount: goalAmount,
            type: goalType,
            date: finalDate,
            initial: goalInitialFund,
            autoPay: goalAutoPay
        });

        setGoalName('');
        setGoalAmount('');
        setGoalType('');
        setGoalDueDate('');
        setGoalInitialFund('');
        setGoalAutoPay(true);
        setShowGoalForm(false);
    };

    const handleToggleForm = () => {
        if (showGoalForm) {
            // Reset form when cancelling
            setGoalName('');
            setGoalAmount('');
            setGoalType('');
            setGoalDueDate('');
            setGoalInitialFund('');
            setGoalAutoPay(true);
        }
        setShowGoalForm(!showGoalForm);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Target className="text-indigo-400" size={20} /> Financial Plans
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleManageMode}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${manageMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                        <Settings2 size={14} /> {manageMode ? 'Exit Manage' : 'Manage'}
                    </button>
                    <button onClick={handleToggleForm} className="text-xs text-sky-400 hover:text-sky-300 font-medium bg-sky-500/5 px-3 py-1.5 rounded-full border border-sky-500/10 transition-colors">
                        {showGoalForm ? 'Cancel' : '+ New Plan'}
                    </button>
                </div>
            </div>

            {showGoalForm && (
                <div className="mb-8 p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Plus size={16} /> New Asset/Debt Goal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-300 uppercase ml-1">Plan Name *</label>
                            <input required type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="e.g. Dream Car" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-300 uppercase ml-1">Target Amount (⨎) *</label>
                            <input required type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="1000" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-300 uppercase ml-1">Goal Type *</label>
                            <select required value={goalType} onChange={(e) => setGoalType(e.target.value)} className={`w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm outline-none appearance-none ${!goalType ? 'text-slate-500' : 'text-white'}`}>
                                <option value="" disabled>{`Select goal type`}</option>
                                <option value="Savings">Savings Goal</option>
                                <option value="EMI">EMI Repayment</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-300 uppercase ml-1">Target Date (Optional)</label>
                            <input
                                type="date"
                                value={goalDueDate}
                                onChange={(e) => setGoalDueDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm outline-none text-slate-400 focus:text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-300 uppercase ml-1">Initial Funding (Optional)</label>
                            <input
                                type="number"
                                value={goalInitialFund}
                                onChange={(e) => setGoalInitialFund(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1 col-span-2 md:col-span-1">
                            <label className="text-[10px] text-slate-300 uppercase ml-1 block mb-2">Automation</label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={goalAutoPay}
                                    onChange={(e) => setGoalAutoPay(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-800"
                                />
                                <span className="text-sm text-slate-300">Enable Auto-Pay</span>
                            </label>
                        </div>
                    </div>
                    <button onClick={handleCreate} disabled={loading || !goalName || !goalAmount || !goalType} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-30">Establish Financial Plan</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.length === 0 ? (
                    <div className="col-span-2 py-12 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                        <p className="text-slate-600 text-sm">No active plans found</p>
                    </div>
                ) : (
                    goals.map((g, i) => {
                        const isLocked = g.lockedUntil > Date.now() * 1000000;
                        const isEMI = g.gType.hasOwnProperty('EMI');
                        const statusObj = g.status || {};
                        const isAutoPay = statusObj.hasOwnProperty('Active');
                        const progress = isEMI ? ((g.paidAmount + g.currentAmount) / g.targetAmount) * 100 : (g.currentAmount / g.targetAmount) * 100;
                        const isHighProgress = progress >= 70;
                        const isAchieved = progress >= 100;

                        let cardClass = "bg-slate-950 p-5 rounded-2xl border flex flex-col gap-4 cursor-pointer transition-all group relative overflow-hidden ";
                        if (isAchieved) cardClass += "border-amber-500/50 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]";
                        else if (isHighProgress) cardClass += "border-emerald-500/30 bg-emerald-500/5";
                        else cardClass += "border-slate-800 hover:border-indigo-500/50 shadow-xl";

                        return (
                            <div
                                key={i}
                                onClick={() => onSelectGoal(g)}
                                className={cardClass}
                            >
                                {isAchieved && (
                                    <div className="absolute -top-1 -right-1 w-12 h-12 bg-amber-500/20 rounded-bl-3xl flex items-center justify-center animate-pulse">
                                        <Trophy size={16} className="text-amber-400" />
                                    </div>
                                )}

                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className={`font-semibold text-sm flex items-center gap-2 ${isAchieved ? 'text-amber-400' : isHighProgress ? 'text-emerald-400' : ''}`}>
                                            {g.name}
                                            {isAutoPay && !isAchieved && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                                    <Zap size={10} fill="currentColor" /> AUTO
                                                </span>
                                            )}
                                            {isAchieved && <Party size={14} className="animate-bounce" />}
                                            {isEMI && <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded-md border border-rose-500/10">EMI</span>}
                                        </div>
                                        <div className="flex gap-2 text-[10px] text-slate-500 uppercase mt-0.5">
                                            <span>{g.category}</span>
                                            <span>•</span>
                                            <span>ID: {Number(g.id)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-bold ${isAchieved ? 'text-amber-500' : isHighProgress ? 'text-emerald-500' : 'text-indigo-400'}`}>
                                            {isAchieved ? 'COMPLETED' : Object.keys(g.status || {})[0] || (isHighProgress ? 'ALMOST THERE' : isEMI ? 'REPAYING' : 'SAVING')}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span className={isAchieved ? 'text-amber-400 font-bold' : ''}>
                                            {isEMI ? `Bucket: ⨎${g.currentAmount.toLocaleString()}` : `⨎${g.currentAmount.toLocaleString()}`}
                                        </span>
                                        <span>
                                            {isEMI ? `Paid: ⨎${g.paidAmount.toLocaleString()}` : `⨎${g.targetAmount.toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isAchieved ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-gradient-x' :
                                                isHighProgress ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                                    isEMI ? 'bg-rose-500' : 'bg-indigo-500'
                                                }`}
                                            style={{ width: `${Math.min(100, progress)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onFund(g.id); }} className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-indigo-500/20">FUND</button>
                                    {isEMI ? (
                                        <button onClick={(e) => { e.stopPropagation(); onPayEMI(g.id); }} className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-500/10">PAY</button>
                                    ) : (
                                        <button onClick={(e) => { e.stopPropagation(); onWithdraw(g.id); }} className={`${isLocked ? 'opacity-30' : 'text-emerald-400'} text-[10px] font-bold px-3 py-1.5 rounded-lg border`} disabled={isLocked}>WD</button>
                                    )}
                                    {manageMode && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(g.id); }}
                                            className={`ml-auto p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors ${g.currentAmount > 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                                            title={g.currentAmount > 0 ? "Goal must be empty to delete" : "Delete Goal"}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 
                Achieved Goals Section
                Displays a collapsible history of successfully met financial targets.
                Calculates total cumulative value of all fulfilled legacy plans.
            */}
            {
                completedGoals.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-800">
                        <button
                            onClick={() => setShowAchieved(!showAchieved)}
                            className="w-full flex items-center justify-between group mb-6 hover:bg-slate-900/50 p-2 rounded-xl transition-colors -mx-2"
                        >
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle2 className="text-amber-500" size={20} />
                                Achieved Goals
                                {showAchieved ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-sm font-black text-amber-400">Target Achieved = ⨎{completedGoals.reduce((acc, g) => acc + (Number(g.paidAmount) || Number(g.amount)), 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </button>

                        {showAchieved && (
                            <div className="space-y-3">
                                {completedGoals.map((cg, idx) => (
                                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                                <Trophy size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">{cg.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase">
                                                    {cg.gType.hasOwnProperty('EMI') ? 'EMI Payoff' : 'Savings Goal'} •
                                                    Target: ⨎{cg.targetAmount.toLocaleString()} •
                                                    Done: {new Date(cg.completionDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-amber-400">⨎{(Number(cg.paidAmount) || Number(cg.amount)).toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">{Number(cg.paidAmount) >= Number(cg.targetAmount) ? 'Fully Funded' : 'Liquidated'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    );
}
