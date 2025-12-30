import React, { useState } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const FinancialCalendar = ({ goals = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const startDay = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const start = startDay(year, month);
    const today = new Date();

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    // Generate events for current view
    // project recurring dates based on start day
    const events = {};
    goals.forEach(g => {
        // EMI or Monthly Commitment - implies monthly recurrence on the same day
        if (g.monthlyCommitment > 0 || g.type === 'EMI') {
            // Derive day of month from created date or due date
            // Ideally we need a 'start day'. Using due date day for now or random valid day
            let day = 1;
            if (g.nextDueDate) {
                day = new Date(Number(g.nextDueDate) / 1000000).getDate();
            } else if (g.dueDate) {
                day = new Date(Number(g.dueDate) / 1000000).getDate();
            }

            // If viewing a future month, or current month, show this day
            // Simple projection: Assume it occurs every month on this 'day'
            if (day > daysInMonth(year, month)) day = daysInMonth(year, month); // Clamp

            if (!events[day]) events[day] = [];
            events[day].push({ type: 'due', name: g.name + ' (Auto)' });
        }

        // One-time Target Date
        if (g.dueDate) {
            const d = new Date(Number(g.dueDate) / 1000000);
            if (d.getMonth() === month && d.getFullYear() === year) {
                const day = d.getDate();
                if (!events[day]) events[day] = [];
                events[day].push({ type: 'target', name: g.name });
            }
        }
    });

    const renderDays = () => {
        const days = [];
        // Empty slots
        for (let i = 0; i < start; i++) {
            days.push(<div key={`empty-${i}`} className="h-6" />);
        }

        // Date slots
        for (let d = 1; d <= totalDays; d++) {
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasEvent = events[d];

            days.push(
                <div key={d} className={`h-6 flex items-center justify-center relative rounded hover:bg-white/10 cursor-pointer group ${isToday ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400'}`}>
                    <span className="text-[10px]">{d}</span>
                    {hasEvent && (
                        <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${hasEvent.some(e => e.type === 'due') ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                    )}

                    {/* Tooltip */}
                    {hasEvent && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 hidden group-hover:block bg-slate-900 border border-white/20 p-2 rounded text-[10px] text-white whitespace-nowrap shadow-xl">
                            {hasEvent.map((e, i) => (
                                <div key={i} className={e.type === 'due' ? 'text-rose-300' : 'text-emerald-300'}>
                                    {e.type === 'due' ? 'Due:' : 'Target:'} {e.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="select-none">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <ChevronLeft size={14} />
                </button>
                <div className="text-xs font-semibold text-white">
                    {monthNames[month]} {year}
                </div>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                    <ChevronRight size={14} />
                </button>
            </div>

            <div className="grid grid-cols-7 mb-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-[9px] text-slate-600 font-medium">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
                {renderDays()}
            </div>
        </div>
    );
};

export default FinancialCalendar;
