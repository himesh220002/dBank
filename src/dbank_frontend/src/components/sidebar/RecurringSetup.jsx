import React, { useState, useEffect } from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';

const RecurringSetup = ({ goals = [] }) => {
    const [type, setType] = useState('deposit');
    const [targetId, setTargetId] = useState('');
    const [frequency, setFrequency] = useState('monthly'); // 'daily', 'weekly', 'monthly'
    const [amount, setAmount] = useState('');
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('dbank_schedules');
        if (saved) setSchedules(JSON.parse(saved));
    }, []);

    const handleSchedule = (e) => {
        e.preventDefault();
        console.log("Schedule attempt:", { targetId, amount });

        if (!targetId || !amount) {
            alert("Please select a goal and enter an amount");
            return;
        }

        const newSchedule = {
            id: Date.now(),
            type,
            targetId,
            goalName: goals.find(g => Number(g.id) === Number(targetId))?.name || 'Unknown',
            frequency,
            amount: parseFloat(amount),
            nextRun: Date.now() + 1000 // Run almost immediately for demo/test
        };

        const updated = [...schedules, newSchedule];
        setSchedules(updated);
        localStorage.setItem('dbank_schedules', JSON.stringify(updated));

        setAmount('');
        // Don't reset targetId to keep context

        console.log("Schedule saved:", updated);
        // Force a check immediately if possible, or wait for interval

        alert("Automation Scheduled! (This runs locally in your browser)");
    };

    const handleDelete = (id) => {
        const updated = schedules.filter(s => s.id !== id);
        setSchedules(updated);
        localStorage.setItem('dbank_schedules', JSON.stringify(updated));
    };

    const getNextRunDelay = (freq) => {
        const DAY = 86400000;
        if (freq === 'daily') return DAY;
        if (freq === 'weekly') return DAY * 7;
        if (freq === 'monthly') return DAY * 30;
        return DAY;
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSchedule} className="space-y-3">
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setType('deposit')}
                        className={`flex-1 text-xs py-1 rounded-md transition-all ${type === 'deposit' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Deposit
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('emi')}
                        className={`flex-1 text-xs py-1 rounded-md transition-all ${type === 'emi' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pay EMI
                    </button>
                </div>

                <div className="grid grid-cols-[2fr,1fr] gap-2">
                    <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none"
                    >
                        <option value="" disabled>Select Goal</option>
                        {goals.map(g => (
                            <option key={g.id.toString()} value={g.id.toString()}>{g.name}</option>
                        ))
                        }
                    </select>

                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amt"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600"
                    />
                </div>

                <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-gray-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none"
                >
                    <option value="daily">Daily (Demo)</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>

                <button
                    type="submit"
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium py-2.5 rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-2"
                >
                    <CalendarClock size={14} className="text-amber-400" />
                    Set Schedule
                </button>
            </form>

            {/* Active Schedules List */}
            {schedules.length > 0 && (
                <div className="border-t border-white/10 pt-2 space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Automations</div>
                    {schedules.map(sch => (
                        <div key={sch.id} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded border border-white/5">
                            <div>
                                <div className="text-white">{sch.goalName}</div>
                                <div className="text-slate-400 text-[10px]">{sch.type} • {sch.frequency} • ⨎{sch.amount}</div>
                            </div>
                            <button onClick={() => handleDelete(sch.id)} className="text-slate-500 hover:text-rose-400 p-1">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecurringSetup;
