// /src/dbank_frontend/src/components/investments/AssetMarketplace.jsx

/**
 * AssetMarketplace - Unified interface for browsing and purchasing diverse asset classes.
 * 
 * CORE LOGIC:
 * - Dynamic category switching between Crypto, Minerals, Forex, etc.
 * - Local search filtering across all selected category assets.
 * - Sparkline caching system to optimize chart rendering within the grid.
 * 
 * DEVELOPER NOTES:
 * - `sparklineCache` prevents redundant API/Simulation calls during category toggles.
 * - Sparklines use a 1-week (1W) window for performance/visibility balance.
 * - Asset cards support both a "Quick Buy" and a "Full Detail" modal entry.
 * 
 * FUTURE UPGRADES:
 * - Implementing "Watchlist" persistence for favorite assets.
 * - Real-time "Hot/Trending" asset badges based on 24h volatility.
 * - Advanced sorting (Price High-Low, Gainers/Losers).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { InvestmentService } from '../../services/InvestmentService';
import AssetPurchaseModal from './AssetPurchaseModal';
import AssetDetailModal from './AssetDetailModal';

const AssetMarketplace = ({ cryptoAssets, mineralAssets, commodityAssets, fundAssets, forexAssets, deltaBalance, onBuyAsset, loading }) => {
    const [category, setCategory] = useState('crypto');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [detailAsset, setDetailAsset] = useState(null);
    const [sparklineCache, setSparklineCache] = useState({});

    // Memoized category mapping for clean rendering cycles
    const categories = useMemo(() => [
        { id: 'crypto', label: 'Crypto', assets: cryptoAssets },
        { id: 'minerals', label: 'Minerals', assets: mineralAssets },
        { id: 'commodities', label: 'Commodities', assets: commodityAssets },
        { id: 'funds', label: 'Mutual Funds', assets: fundAssets },
        { id: 'forex', label: 'Currencies', assets: forexAssets },
    ], [cryptoAssets, mineralAssets, commodityAssets, fundAssets, forexAssets]);

    const currentAssets = categories.find(c => c.id === category)?.assets || [];
    const filteredAssets = currentAssets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /**
     * Sparkline Management: Ensures every visible asset has a mini-chart.
     * Fires on category/asset updates and populates the local component cache.
     */
    useEffect(() => {
        const loadSparklines = async () => {
            const newCache = {};
            for (const asset of filteredAssets) {
                const cacheKey = `${asset.id}_1W`;
                if (!sparklineCache[cacheKey]) {
                    const data = await InvestmentService.getHistory(
                        asset.id,
                        '1W',
                        asset.price,
                        asset.type,
                        asset.history
                    );
                    newCache[cacheKey] = data;
                }
            }
            if (Object.keys(newCache).length > 0) {
                setSparklineCache(prev => ({ ...prev, ...newCache }));
            }
        };

        if (filteredAssets.length > 0) {
            loadSparklines();
        }
    }, [category, cryptoAssets, mineralAssets, commodityAssets, fundAssets, forexAssets]);

    // Maps UI categories to backend-compatible asset variants (Motoko Enums)
    const getAssetTypeVariant = (categoryId) => {
        const map = {
            'crypto': { Crypto: null },
            'minerals': { Mineral: null },
            'commodities': { Commodity: null },
            'funds': { MutualFund: null },
            'forex': { Currency: null }
        };
        return map[categoryId];
    };

    return (
        <>
            <div className="space-y-6">
                {/* Navigation: Category Toggles */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${category === cat.id
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Local Filtering Engine */}
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search assets..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                    />
                </div>

                {/* Dynamic Asset Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAssets.map(asset => {
                        const sparklineData = sparklineCache[`${asset.id}_1W`] || [];

                        // Chart Normalization: Ensures sparkline fills its container regardless of price magnitude
                        const values = sparklineData.map(d => d.val);
                        const minVal = values.length > 0 ? Math.min(...values) : 0;
                        const maxVal = values.length > 0 ? Math.max(...values) : 100;
                        const padding = (maxVal - minVal) * 0.1;

                        return (
                            <div
                                key={asset.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-all cursor-pointer group"
                            >
                                <div
                                    onClick={() => setDetailAsset(asset)}
                                    className="mb-3"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-sm text-slate-500">{asset.symbol}</div>
                                            <div className="font-bold text-white">{asset.name}</div>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                            {asset.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {Math.abs(asset.change).toFixed(2)}%
                                        </div>
                                    </div>

                                    {/* Sparkline Visualization Container */}
                                    <div className="h-16 mb-3">
                                        {sparklineData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={sparklineData}>
                                                    <YAxis
                                                        domain={[minVal - padding, maxVal + padding]}
                                                        hide
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="val"
                                                        stroke={asset.change >= 0 ? '#10b981' : '#f43f5e'}
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                                                Loading chart...
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-2xl font-bold text-amber-400">
                                            ₹{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        {asset.unit && (
                                            <div className="text-xs text-slate-500">per {asset.unit}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Initiation (Quick Buy) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAsset(asset);
                                    }}
                                    className="w-full mt-2 py-2 bg-amber-500/10 text-amber-400 rounded-lg font-medium group-hover:bg-amber-500/20 transition-colors"
                                >
                                    Buy Now
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State Result */}
                {filteredAssets.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No assets found matching "{searchTerm}"
                    </div>
                )}
            </div>

            {/* In-depth Asset Review Modal */}
            {detailAsset && (
                <AssetDetailModal
                    asset={detailAsset}
                    onClose={() => setDetailAsset(null)}
                    onBuyClick={() => setSelectedAsset(detailAsset)}
                />
            )}

            {/* Direct Purchase Transaction Modal */}
            {selectedAsset && (
                <AssetPurchaseModal
                    asset={selectedAsset}
                    assetType={getAssetTypeVariant(category)}
                    deltaBalance={deltaBalance}
                    onClose={() => setSelectedAsset(null)}
                    onBuy={onBuyAsset}
                    loading={loading}
                />
            )}
        </>
    );
};

export default AssetMarketplace;
