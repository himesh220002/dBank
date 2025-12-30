// /src/dbank_frontend/src/components/investments/AssetPurchaseModal.jsx

/**
 * AssetPurchaseModal - Execution layer for investment transactions.
 * 
 * CORE LOGIC:
 * - Dual-input synchronization: Update Delta cost when Quantity changes, and vice-versa.
 * - Real-time balance verification against the user's current Delta (Δ) hold.
 * - Integration with PinEntryModal for secure transaction verification on the blockchain.
 * 
 * DEVELOPER NOTES:
 * - Delta to INR conversion happens via `InvestmentService` to ensure consistency.
 * - The `assetType` prop must correspond exactly to the Motoko Backend's union type tags.
 * 
 * FUTURE UPGRADES:
 * - Implementing "Limit Orders" (Execute buy only when price hits target).
 * - "Recurring Buy" setup directly from this modal.
 * - Visual price impact estimator for large volume purchases.
 */

import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { InvestmentService } from '../../services/InvestmentService';
import PinEntryModal from '../PinEntryModal';

const AssetPurchaseModal = ({ asset, assetType, deltaBalance, onClose, onBuy, loading }) => {
    const [inputMode, setInputMode] = useState('delta'); // 'delta' (fiat-value) or 'quantity' (asset-units)
    const [deltaAmount, setDeltaAmount] = useState('');
    const [quantity, setQuantity] = useState('');
    const [showPin, setShowPin] = useState(false);

    /**
     * Cross-calculates Quantity when user inputs preferred Delta spend.
     */
    const handleDeltaChange = (value) => {
        setDeltaAmount(value);
        if (value && asset.price > 0) {
            const qty = InvestmentService.calculateAssetQuantity(Number(value), asset.price);
            setQuantity(qty.toString());
        } else {
            setQuantity('');
        }
    };

    /**
     * Cross-calculates Delta cost when user inputs specific Asset units.
     */
    const handleQuantityChange = (value) => {
        setQuantity(value);
        if (value && asset.price > 0) {
            const delta = InvestmentService.calculateDeltaCost(Number(value), asset.price);
            setDeltaAmount(delta.toString());
        } else {
            setDeltaAmount('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!deltaAmount || Number(deltaAmount) <= 0) return;
        // Proceed to security verification before calling backend
        setShowPin(true);
    };

    /**
     * Callback from PinEntryModal. This is where the actual blockchain actor call is initiated.
     */
    const handlePinSuccess = async () => {
        await onBuy(assetType, asset.symbol, Number(deltaAmount), asset.price);
        setShowPin(false);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-lg w-full">

                    {/* Header: Transaction Target Designation */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="text-sm text-slate-500">{asset.symbol}</div>
                            <h3 className="text-2xl font-bold text-white">{asset.name}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Live Market Reference Context */}
                    <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-400">Current Price</div>
                                <div className="text-2xl font-bold text-white">₹{asset.price.toLocaleString()}</div>
                                {asset.unit && <div className="text-xs text-slate-500">per {asset.unit}</div>}
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {asset.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                {Math.abs(asset.change).toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    {/* Order Configuration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Unit Selection: Fiat vs Asset Units */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setInputMode('delta')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${inputMode === 'delta'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                Spend Delta
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputMode('quantity')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${inputMode === 'quantity'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                Buy Quantity
                            </button>
                        </div>

                        {/* Dynamics Inputs with Label Awareness */}
                        {inputMode === 'delta' ? (
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Delta Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Δ</span>
                                    <input
                                        type="number"
                                        value={deltaAmount}
                                        onChange={(e) => handleDeltaChange(e.target.value)}
                                        placeholder="0"
                                        step="1"
                                        min="0"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Available: {deltaBalance.toLocaleString()} Δ
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    placeholder="0.00"
                                    step="0.000001"
                                    min="0"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                                />
                                <div className="text-xs text-slate-500 mt-1 uppercase">
                                    Symbol: {asset.symbol}
                                </div>
                            </div>
                        )}

                        {/* Order Confirmation Preview (Real-time Calculation) */}
                        {deltaAmount && quantity && (
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">You will receive</span>
                                    <span className="text-white font-mono">{Number(quantity).toFixed(6)} {asset.symbol}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Total cost</span>
                                    <span className="text-amber-400 font-mono">{Number(deltaAmount).toLocaleString()} Δ</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t border-slate-700">
                                    <span className="text-slate-500">≈ dBank value</span>
                                    <span className="text-slate-500">⨎{InvestmentService.deltaToDbank(Number(deltaAmount)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t border-slate-700">
                                    <span className="text-slate-500">Remaining balance</span>
                                    <span className={`font-mono ${Number(deltaAmount) > deltaBalance ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {(deltaBalance - Number(deltaAmount)).toLocaleString()} Δ
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Dynamic Error Messaging: Solvency Check */}
                        {deltaAmount && Number(deltaAmount) > deltaBalance && (
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-rose-400 text-2xl">⚠</div>
                                    <div>
                                        <div className="text-rose-400 font-bold text-sm mb-1">Insufficient Delta Balance</div>
                                        <div className="text-rose-300 text-xs text-balance">
                                            You need <span className="font-bold">{Number(deltaAmount).toLocaleString()} Δ</span> but only have <span className="font-bold">{deltaBalance.toLocaleString()} Δ</span>.
                                        </div>
                                        <div className="text-rose-300 text-xs mt-2">
                                            💡 TIP: Convert more dBank (⨎) to Delta (Δ) in the <span className="font-bold">Token Wallet</span> tab.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Primary Action Button */}
                        <button
                            type="submit"
                            disabled={loading || !deltaAmount || Number(deltaAmount) <= 0 || Number(deltaAmount) > deltaBalance}
                            className="w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                'Confirm Purchase'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Verification Security Layer */}
            <PinEntryModal
                isOpen={showPin}
                onClose={() => setShowPin(false)}
                onSuccess={handlePinSuccess}
                amount={Number(deltaAmount)}
            />
        </>
    );
};

export default AssetPurchaseModal;
