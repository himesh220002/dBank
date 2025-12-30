import React, { useState } from 'react';
import { X, User, QrCode, Settings, LogOut, Camera, Share2, Wallet, Shield } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('info'); // info | scanner | settings

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end md:justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md h-[80vh] md:h-auto overflow-hidden shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-indigo-400" size={24} />
                        Profile & Settings
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        My ID
                    </button>
                    <button
                        onClick={() => setActiveTab('scanner')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'scanner' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        QR Scan
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        Settings
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-925">

                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 border-4 border-slate-800 shadow-xl flex items-center justify-center text-4xl">
                                    👨‍💻
                                </div>
                                <h3 className="text-2xl font-black text-white">Himesh</h3>
                                <p className="text-slate-400">himesh@dbank.icp</p>
                            </div>

                            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Account ID</span>
                                    <span className="font-mono text-white">dbank-8822-x99</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Status</span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase">Verified</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Member Since</span>
                                    <span className="text-white">Dec 2024</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex flex-col items-center gap-2 group">
                                    <QrCode className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold text-slate-300">Share QR</span>
                                </button>
                                <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex flex-col items-center gap-2 group">
                                    <Wallet className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold text-slate-300">Copy Address</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCANNER TAB */}
                    {activeTab === 'scanner' && (
                        <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden relative border border-slate-700 group">
                            <div className="flex-1 flex items-center justify-center relative p-8">
                                {/* Placeholder QR Code */}
                                <div className="w-48 h-48 bg-white rounded-xl p-4 relative z-10 shadow-[0_0_100px_rgba(99,102,241,0.3)]">
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        <rect width="100" height="100" fill="white" />
                                        {/* QR Pattern Simulation */}
                                        <rect x="5" y="5" width="15" height="15" fill="black" />
                                        <rect x="80" y="5" width="15" height="15" fill="black" />
                                        <rect x="5" y="80" width="15" height="15" fill="black" />
                                        <rect x="25" y="10" width="5" height="5" fill="black" />
                                        <rect x="35" y="10" width="5" height="5" fill="black" />
                                        <rect x="45" y="10" width="5" height="5" fill="black" />
                                        <rect x="55" y="10" width="5" height="5" fill="black" />
                                        <rect x="65" y="10" width="5" height="5" fill="black" />
                                        <rect x="30" y="25" width="40" height="5" fill="black" />
                                        <rect x="25" y="35" width="10" height="10" fill="black" />
                                        <rect x="65" y="35" width="10" height="10" fill="black" />
                                        <rect x="40" y="40" width="20" height="20" fill="black" />
                                        <rect x="25" y="65" width="50" height="5" fill="black" />
                                        <rect x="30" y="75" width="5" height="5" fill="black" />
                                        <rect x="45" y="75" width="10" height="10" fill="black" />
                                        <rect x="65" y="75" width="10" height="10" fill="black" />
                                    </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
                                <div className="w-48 h-48 border-2 border-indigo-500 rounded-xl relative z-10 flex items-center justify-center shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                                    <div className="w-full h-0.5 bg-indigo-500 absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                                    <span className="text-xs text-indigo-300 bg-black/50 px-2 rounded">Align QR Code</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center">
                                <button className="bg-indigo-600 p-4 rounded-full shadow-lg shadow-indigo-500/50 hover:bg-indigo-500 transition-all hover:scale-110">
                                    <Camera className="text-white" size={24} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-700 p-2 rounded-lg"><Settings size={18} className="text-white" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-white">App Theme</div>
                                        <div className="text-xs text-slate-400">Dark Mode</div>
                                    </div>
                                </div>
                                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                                    <div className="w-6 h-6 bg-slate-700 rounded cursor-pointer" />
                                    <div className="w-6 h-6 bg-indigo-600 rounded shadow cursor-pointer" />
                                </div>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-700 p-2 rounded-lg"><Shield size={18} className="text-white" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Security Pin</div>
                                        <div className="text-xs text-slate-400">Change 4-digit PIN</div>
                                    </div>
                                </div>
                                <button className="text-xs bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors">Change</button>
                            </div>

                            <button className="w-full mt-8 flex items-center justify-center gap-2 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-bold text-sm">
                                <LogOut size={18} />
                                Log Out
                            </button>

                            <div className="text-center mt-4">
                                <p className="text-xs text-slate-600">DBANK v2.1.0 • Build 2025.12.24</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default ProfileModal;
