import React from 'react';
import { Trophy, Footprints, PiggyBank, Unlink, Diamond, Bot, Crown, Lock } from 'lucide-react';

export function AchievementsGrid({ achievements = [] }) {

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Footprints': return Footprints;
            case 'PiggyBank': return PiggyBank;
            case 'Unlink': return Unlink;
            case 'Diamond': return Diamond;
            case 'Bot': return Bot;
            case 'Crown': return Crown;
            default: return Trophy;
        }
    };

    return (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} />
                Badges & Milestones
                <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">
                    {achievements.filter(a => a.unlockedAt).length} / {achievements.length} UNLOCKED
                </span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((badge) => {
                    const isUnlocked = !!badge.unlockedAt;
                    const Icon = getIcon(badge.icon);

                    return (
                        <div
                            key={badge.id}
                            className={`group relative p-4 rounded-2xl border transition-all duration-300 ${isUnlocked
                                    ? 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/10'
                                    : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${isUnlocked ? 'bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform' : 'bg-slate-800 text-slate-500'}`}>
                                    <Icon size={24} />
                                </div>
                                {isUnlocked ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        UNLOCKED
                                    </span>
                                ) : (
                                    <Lock size={14} className="text-slate-600" />
                                )}
                            </div>

                            <h4 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                                {badge.title}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {badge.description}
                            </p>

                            {isUnlocked && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
