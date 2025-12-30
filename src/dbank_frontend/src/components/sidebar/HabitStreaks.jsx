import React, { useMemo } from 'react';
import { Flame, Award, Zap } from 'lucide-react';

const HabitStreaks = ({ transactions = [] }) => {
    // Calculate streaks from real transactions
    const streaks = useMemo(() => {
        // 1. Funding Streak (Consecutive days with a Top Up)
        const topUps = transactions
            .filter(t => (t.operation || '').includes('top_up'))
            .map(t => new Date(Number(t.time) / 1000000).toDateString());

        const uniqueDays = [...new Set(topUps)].sort((a, b) => new Date(b) - new Date(a));

        let fundStreak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // Check if streak is active (today or yesterday)
        let currentCheck = today;
        if (!uniqueDays.includes(today)) currentCheck = yesterday;

        if (uniqueDays.includes(currentCheck)) {
            fundStreak = 1;
            let checkDate = new Date(currentCheck);
            for (let i = 1; i < uniqueDays.length; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                if (uniqueDays.includes(checkDate.toDateString())) {
                    fundStreak++;
                } else {
                    break;
                }
            }
        }

        // 2. Login Streak (Mock for now, but use localStorage to simulate)
        const storedLogin = localStorage.getItem('dbank_login_streak');
        const lastLoginDate = localStorage.getItem('dbank_last_login');

        let loginStreak = storedLogin ? parseInt(storedLogin) : 1;
        if (lastLoginDate !== today) {
            if (lastLoginDate === yesterday) {
                loginStreak++;
            } else if (lastLoginDate && new Date(lastLoginDate) < new Date(yesterday)) {
                loginStreak = 1; // Reset
            }
            localStorage.setItem('dbank_login_streak', loginStreak);
            localStorage.setItem('dbank_last_login', today);
        }

        return { fundStreak, loginStreak };
    }, [transactions]);

    const { fundStreak, loginStreak } = streaks;

    return (
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Flame size={32} />
                </div>
                <div className="flex justify-center mb-1 text-orange-500">
                    <Flame size={18} fill="currentColor" />
                </div>
                <div className="text-lg font-bold text-white leading-none">{loginStreak}</div>
                <div className="text-[9px] text-orange-200 uppercase tracking-wide mt-0.5">Day Streak</div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Zap size={32} />
                </div>
                <div className="flex justify-center mb-1 text-purple-400">
                    <Zap size={18} fill="currentColor" />
                </div>
                <div className="text-lg font-bold text-white leading-none">{fundStreak}</div>
                <div className="text-[9px] text-purple-200 uppercase tracking-wide mt-0.5">Fund Streak</div>
            </div>

            <div className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Award size={16} />
                </div>
                <div>
                    <div className="text-xs font-bold text-white">Saver Level: Gold</div>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-1 w-24">
                        <div className="bg-yellow-500 h-1 rounded-full w-3/4"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HabitStreaks;
