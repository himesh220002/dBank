// /src/dbank_frontend/src/components/Header.jsx
// Application Header & Navigation
// Standardized navigation bar across Dashboard, Investments, and History pages.

import React, { useState } from 'react';
import { LayoutDashboard, History, TrendingUp, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ProfileModal from './ProfileModal';

/**
 * Header Component
 * 
 * Orchestrates top-level navigation and system status reporting.
 * - Dynamic route highlighting for Dashboard vs secondary pages.
 * - Real-time system message display for transaction feedback.
 * - Profile & Identity management portal entry.
 */
export function Header({ message, onExport }) {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                        DBANK <span className="text-xs align-top text-indigo-400 font-bold ml-1 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">PRO</span>
                    </h1>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-400 mt-1">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> MAINNET ACTIVE</span>
                        <span className="text-slate-700">•</span>
                        <span className="uppercase tracking-wider">HIMESH'S VAULT</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isHome ? (
                    <>
                        <Link to="/investments" className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-sm font-bold">
                            <TrendingUp size={16} /> Investments
                        </Link>
                        <Link to="/history" className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-sm font-bold">
                            <History size={16} /> History
                        </Link>
                    </>
                ) : (
                    <Link to="/" className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-sm font-bold">
                        <LayoutDashboard size={16} /> Dashboard
                    </Link>
                )}

                <div className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${message ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                    <div className={`w-2 h-2 rounded-full ${message ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`} />
                    {message || "System Stationary"}
                </div>

                {onExport && (
                    <button onClick={onExport} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 text-sm">
                        Export CSV
                    </button>
                )}

                {/* Profile Button */}
                <button
                    onClick={() => setShowProfile(true)}
                    className="w-12 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/30 transition-all flex items-center justify-center text-slate-300 hover:text-white"
                >
                    <User size={18} />
                </button>
            </div>

            <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
        </div>
    );
}
