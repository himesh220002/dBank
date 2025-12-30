import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import PinEntryModal from '../PinEntryModal';

const QuickTransfer = ({ goals = [], currentBalance = 0, onTransfer }) => {
    const [source, setSource] = useState('main');
    const [target, setTarget] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPin, setShowPin] = useState(false);

    // Use all goals for now to ensure visibility. Can refine later if needed.
    const activeGoals = goals;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !target) return;
        // Open PIN check
        setShowPin(true);
    };

    const handlePinSuccess = async () => {
        setLoading(true);
        try {
            await onTransfer({
                source,
                target,
                amount: parseFloat(amount)
            });
            setAmount('');
            // Reset logic: keep source, maybe reset target?
            // User likely wants to clear amount but keep context
        } catch (error) {
            console.error("Transfer failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSourceChange = (e) => {
        const newSource = e.target.value;
        setSource(newSource);

        // If switching TO 'main', we allow target to be selected (initially empty or reset?)
        // If switching FROM 'main' to a goal, target MUST be 'main'
        if (newSource !== 'main') {
            setTarget('main');
        } else {
            // If going back to main, and target was 'main', reset it
            if (target === 'main') setTarget('');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                    {/* Source Select */}
                    <div className="relative">
                        <select
                            value={source}
                            onChange={handleSourceChange}
                            className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none truncate pr-6"
                        >
                            <option value="main">Main Wallet</option>
                            <optgroup label="From Goal">
                                {activeGoals.map(g => (
                                    <option key={g.id.toString()} value={g.id.toString()}>{g.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <ArrowRightLeft size={14} className="text-slate-500" />

                    {/* Target Select */}
                    <div className="relative">
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            disabled={source !== 'main'} // If source is goal, target is locked to Main
                            className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none truncate"
                        >
                            {source === 'main' ? (
                                <>
                                    <option value="" disabled>Select Goal</option>
                                    {activeGoals.map(g => (
                                        <option key={g.id.toString()} value={g.id.toString()}>{g.name}</option>
                                    ))}
                                </>
                            ) : (
                                <option value="main">Main Wallet</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount"
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !target || !amount}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium py-2.5 rounded-lg transition-colors border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : 'Execute Transfer'}
                </button>
            </form>

            <PinEntryModal
                isOpen={showPin}
                onClose={() => setShowPin(false)}
                onSuccess={handlePinSuccess}
                amount={amount}
            />
        </>
    );
};

export default QuickTransfer;
