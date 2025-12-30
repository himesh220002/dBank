import React, { useState } from 'react';
import { Coins, ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';
import { InvestmentService } from '../../services/InvestmentService';
import PinEntryModal from '../PinEntryModal';

const TokenWalletCard = ({ deltaBalance, mainBalance, onBuyTokens, onSellTokens, loading }) => {
    const [mode, setMode] = useState('buy'); // 'buy' or 'sell'
    const [amount, setAmount] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        // Store pending action and show PIN
        setPendingAction({ mode, amount: numAmount });
        setShowPin(true);
    };

    const handlePinSuccess = async () => {
        if (!pendingAction) return;

        if (pendingAction.mode === 'buy') {
            await onBuyTokens(pendingAction.amount);
        } else {
            await onSellTokens(pendingAction.amount);
        }

        setAmount('');
        setPendingAction(null);
        setShowPin(false);
    };

    const convertedAmount = amount ? (mode === 'buy'
        ? InvestmentService.dbankToDelta(Number(amount))
        : InvestmentService.deltaToDbank(Number(amount))
    ) : 0;

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Balance Display */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-500/20 rounded-xl">
                            <Coins size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Delta Token Balance</div>
                            <div className="text-3xl font-bold text-white">{deltaBalance.toLocaleString()} Δ</div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Equivalent dBank</span>
                            <span className="text-white font-mono">⨎{InvestmentService.deltaToDbank(deltaBalance).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Main Balance</span>
                            <span className="text-white font-mono">⨎{mainBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-amber-500/20">
                            <span className="text-slate-400">Conversion Rate</span>
                            <span className="text-amber-400 font-bold">1 ⨎ = 10,000 Δ</span>
                        </div>
                    </div>
                </div>

                {/* Buy/Sell Interface */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('buy')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${mode === 'buy'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <ArrowDownToLine size={16} className="inline mr-2" />
                            Buy Tokens
                        </button>
                        <button
                            onClick={() => setMode('sell')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${mode === 'sell'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <ArrowUpFromLine size={16} className="inline mr-2" />
                            Sell Tokens
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                {mode === 'buy' ? 'dBank Amount' : 'Delta Amount'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    {mode === 'buy' ? '⨎' : 'Δ'}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                                />
                            </div>
                        </div>

                        {amount && (
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <div className="text-sm text-slate-400 mb-1">You will {mode === 'buy' ? 'receive' : 'get'}</div>
                                <div className="text-2xl font-bold text-amber-400">
                                    {mode === 'buy' ? 'Δ' : '⨎'} {convertedAmount.toLocaleString()}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !amount || Number(amount) <= 0}
                            className={`w-full py-3 rounded-lg font-medium transition-colors ${mode === 'buy'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                `${mode === 'buy' ? 'Buy' : 'Sell'} Tokens`
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <PinEntryModal
                isOpen={showPin}
                onClose={() => {
                    setShowPin(false);
                    setPendingAction(null);
                }}
                onSuccess={handlePinSuccess}
                amount={pendingAction?.amount || 0}
            />
        </>
    );
};

export default TokenWalletCard;
