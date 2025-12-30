// /src/dbank_frontend/src/components/PinEntryModal.jsx
// Secure Transaction Verification Modal
// Handles PIN-based authentication, keyboard masking, and anti-brute-force lockout logic.

import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, Delete } from 'lucide-react';

// --- Security Constants ---
const PIN_KEY = import.meta.env.VITE_PAYMENTS_PIN;
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 Hour
const RESET_DURATION = 2 * 60 * 1000; // 2 Minutes

/**
 * PinEntryModal Component
 * 
 * Provides a specialized numerical keypad for verifying financial transitions.
 * Features:
 * - Anti-Brute-Force: Limits attempts and enforces a 1-hour cooling-down period.
 * - Local-Storage Persistence: Retains attempt history across page reloads.
 * - Keyboard Support: Captures numeric and backspace keys for desktop accessibility.
 */
const PinEntryModal = ({ isOpen, onClose, onSuccess, amount }) => {
    if (!isOpen) return null;

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(() => {
        const saved = localStorage.getItem('pin_attempts');
        return saved ? parseInt(saved) : MAX_ATTEMPTS;
    });
    const [lockedUntil, setLockedUntil] = useState(() => {
        const saved = localStorage.getItem('pin_lockout');
        return saved ? parseInt(saved) : null;
    });
    const [lastAttemptTime, setLastAttemptTime] = useState(() => {
        const saved = localStorage.getItem('pin_last_attempt');
        return saved ? parseInt(saved) : null;
    });

    /**
     * Lockout & Auto-Reset Monitor
     * Synchronizes local state with localStorage to enforce security policies.
     */
    useEffect(() => {
        if (lockedUntil) {
            if (Date.now() > lockedUntil) {
                // Lock expired
                localStorage.removeItem('pin_lockout');
                localStorage.removeItem('pin_attempts');
                localStorage.removeItem('pin_last_attempt');
                setLockedUntil(null);
                setAttempts(MAX_ATTEMPTS);
                setLastAttemptTime(null);
            }
        } else if (lastAttemptTime && attempts < MAX_ATTEMPTS) {
            // Check if 2 minutes have passed since last attempt
            if (Date.now() - lastAttemptTime > RESET_DURATION) {
                localStorage.removeItem('pin_attempts');
                localStorage.removeItem('pin_last_attempt');
                setAttempts(MAX_ATTEMPTS);
                setLastAttemptTime(null);
            }
        }
    }, [lockedUntil, lastAttemptTime, attempts, isOpen]);

    const handleDigit = (digit) => {
        if (lockedUntil) return;
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const verifyPin = () => {
        if (pin === PIN_KEY) {
            // Success
            localStorage.removeItem('pin_attempts');
            localStorage.removeItem('pin_last_attempt');
            onSuccess();
            onClose();
            setPin('');
        } else {
            // Failure
            const now = Date.now();
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            setLastAttemptTime(now);
            localStorage.setItem('pin_attempts', newAttempts);
            localStorage.setItem('pin_last_attempt', now);
            setPin('');

            if (newAttempts <= 0) {
                const lockTime = now + LOCKOUT_DURATION;
                setLockedUntil(lockTime);
                localStorage.setItem('pin_lockout', lockTime);
                setError('Transaction Locked for 1 Hour');
            } else {
                setError('Incorrect PIN');
            }
        }
    };

    // Auto-submit on 4th digit
    useEffect(() => {
        if (pin.length === 4) {
            verifyPin();
        }
    }, [pin]);

    // Keyboard input handler
    useEffect(() => {
        if (!isOpen || lockedUntil) return;

        const handleKeyPress = (e) => {
            // Only handle if modal is open and target is not an input/textarea
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return; // Let other inputs work normally
            }

            // Handle numeric keys (0-9)
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                e.stopPropagation();
                handleDigit(e.key);
            }
            // Handle backspace/delete
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
            }
            // Handle escape to close
            else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyPress, true); // Use capture phase
        return () => window.removeEventListener('keydown', handleKeyPress, true);
    }, [isOpen, lockedUntil, pin]);

    // Cleanup: Reset PIN when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setError('');
        }
    }, [isOpen]);

    const isLocked = lockedUntil && Date.now() < lockedUntil;
    const minutesLeft = isLocked ? Math.ceil((lockedUntil - Date.now()) / 60000) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-indigo-500/30">
                        {isLocked ? <Lock size={36} className="text-rose-500" /> : <Shield size={36} className="text-indigo-400" />}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">
                        {isLocked ? 'Wallet Locked' : 'Security Verification'}
                    </h2>
                    <p className="text-slate-400 text-base">
                        {isLocked
                            ? `Try again in ${minutesLeft} minutes`
                            : `Confirm transaction of ₹${amount}`}
                    </p>
                </div>

                {/* Warning Message */}
                {!isLocked && attempts <= 3 && (
                    <div className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-400 text-sm font-bold animate-pulse">
                        <AlertTriangle size={20} />
                        Only {attempts} attempts remaining
                    </div>
                )}

                {/* Error Message */}
                {!isLocked && error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl text-center text-rose-400 text-sm font-bold">
                        {error}
                    </div>
                )}

                {/* PIN Display */}
                {!isLocked && (
                    <>
                        <div className="flex justify-center gap-6 mb-10">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`w-5 h-5 rounded-full transition-all duration-200 ${i < pin.length
                                        ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50'
                                        : 'bg-slate-700 border-2 border-slate-600'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Numpad */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleDigit(num.toString())}
                                    className="h-16 bg-slate-800 hover:bg-slate-700 rounded-2xl text-2xl font-bold text-white transition-all border-2 border-slate-700 hover:border-indigo-500/50 active:scale-95 shadow-lg hover:shadow-indigo-500/20"
                                >
                                    {num}
                                </button>
                            ))}
                            <div /> {/* Spacer */}
                            <button
                                onClick={() => handleDigit('0')}
                                className="h-16 bg-slate-800 hover:bg-slate-700 rounded-2xl text-2xl font-bold text-white transition-all border-2 border-slate-700 hover:border-indigo-500/50 active:scale-95 shadow-lg hover:shadow-indigo-500/20"
                            >
                                0
                            </button>
                            <button
                                onClick={handleDelete}
                                className="h-16 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl text-rose-400 flex items-center justify-center transition-all border-2 border-rose-500/20 hover:border-rose-500/40 active:scale-95"
                            >
                                <Delete size={24} />
                            </button>
                        </div>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-4 mt-2 text-slate-500 hover:text-white font-semibold text-base transition-colors rounded-xl hover:bg-slate-800/50"
                >
                    Cancel Transaction
                </button>
            </div>
        </div>
    );
};

export default PinEntryModal;
