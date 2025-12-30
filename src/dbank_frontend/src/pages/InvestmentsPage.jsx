// /src/dbank_frontend/src/pages/InvestmentsPage.jsx
// Investment Hub - dBank
// Manages asset trading, portfolio valuation, and the Delta token bridge system.

import { useState, useEffect } from 'react';
import { dbank_backend } from 'declarations/dbank_backend';
import { Header } from '../components/Header';
import TokenWalletCard from '../components/investments/TokenWalletCard';
import AssetMarketplace from '../components/investments/AssetMarketplace';
import PortfolioDashboard from '../components/investments/PortfolioDashboard';
import { InvestmentService } from '../services/InvestmentService';
import { TrendingUp, Wallet, PieChart } from 'lucide-react';

/**
 * InvestmentsPage Component
 * 
 * Central dashboard for non-banking financial assets. Features:
 * - Delta Token bridge: Converts dBank liquidity into tradeable investment units.
 * - Multi-asset Marketplace: Supports Crypto, Minerals, Commodities, and Forex.
 * - Live Portfolio Tracking: Real-time valuation based on current market prices.
 * - Persistence Layer: Restores active tab state across session refreshes.
 */
export function InvestmentsPage() {
    // Session-aware tab management to maintain context during development/refreshes.
    const [activeTab, setActiveTab] = useState(() => {
        // Check if we have a saved tab from a refresh (not a navigation)
        const savedTab = sessionStorage.getItem('investmentsActiveTab');
        const isRefresh = sessionStorage.getItem('investmentsPageLoaded');

        if (isRefresh && savedTab) {
            return savedTab; // Restore tab on refresh
        }
        return 'marketplace'; // Default on navigation from other pages
    });
    const [deltaBalance, setDeltaBalance] = useState(0);
    const [holdings, setHoldings] = useState([]);
    const [mainBalance, setMainBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Asset prices
    const [cryptoPrices, setCryptoPrices] = useState([]);
    const [mineralPrices, setMineralPrices] = useState([]);
    const [commodityPrices, setCommodityPrices] = useState([]);
    const [fundPrices, setFundPrices] = useState([]);
    const [forexPrices, setForexPrices] = useState([]);

    /**
     * Aggregates financial data from backend canisters and external price oracles.
     * Synchronizes main balance, investment wallet, and various asset categories.
     */
    async function fetchData() {
        try {
            // Fetch main balance
            const bal = await dbank_backend.getCurrentValue();
            setMainBalance(Number(bal));

            // Fetch investment wallet
            const wallet = await dbank_backend.getInvestmentWallet();
            setDeltaBalance(Number(wallet.deltaBalance));
            setHoldings(wallet.holdings.map(h => ({
                ...h,
                amount: Number(h.amount),
                avgPurchasePrice: Number(h.avgPurchasePrice),
                totalInvested: Number(h.totalInvested),
                purchaseDate: Number(h.purchaseDate) / 1_000_000
            })));

            // Fetch asset prices
            const crypto = await InvestmentService.getCrypto();
            const minerals = await InvestmentService.getMinerals();
            const commodities = await InvestmentService.getCommodities();
            const funds = await InvestmentService.getMutualFunds();
            const forex = await InvestmentService.getForex();

            setCryptoPrices(crypto);
            setMineralPrices(minerals);
            setCommodityPrices(commodities);
            setFundPrices(funds);
            setForexPrices(forex);
        } catch (e) {
            console.error('fetchData error:', e);
        }
    }

    useEffect(() => {
        // Mark that the page has been loaded (for refresh detection)
        sessionStorage.setItem('investmentsPageLoaded', 'true');

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s

        return () => {
            clearInterval(interval);
            // Clear the page loaded flag when leaving the page
            sessionStorage.removeItem('investmentsPageLoaded');
        };
    }, []);

    // Save active tab to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('investmentsActiveTab', activeTab);
    }, [activeTab]);

    const handleBuyTokens = async (dbankAmount) => {
        setLoading(true);
        try {
            const res = await dbank_backend.buyDeltaTokens(dbankAmount);
            if (res && res.length > 0) {
                setMessage(`Purchased ${InvestmentService.dbankToDelta(dbankAmount).toLocaleString()} Δ`);
                await fetchData();
            } else {
                setMessage('Insufficient dBank balance');
            }
        } catch (e) {
            console.error(e);
            setMessage('Purchase failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSellTokens = async (deltaAmount) => {
        setLoading(true);
        try {
            const res = await dbank_backend.sellDeltaTokens(deltaAmount);
            if (res && res.length > 0) {
                setMessage(`Sold ${deltaAmount.toLocaleString()} Δ for ⨎${InvestmentService.deltaToDbank(deltaAmount).toFixed(2)}`);
                await fetchData();
            } else {
                setMessage('Insufficient Delta balance');
            }
        } catch (e) {
            console.error(e);
            setMessage('Sale failed');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Purchase Flow: Validates Delta balance and executes decentralized asset acquisition.
     */
    const handleBuyAsset = async (assetType, symbol, deltaAmount, currentPrice) => {
        setLoading(true);
        try {
            const res = await dbank_backend.buyAsset(assetType, symbol, deltaAmount, currentPrice);
            if (res) {
                const quantity = InvestmentService.calculateAssetQuantity(deltaAmount, currentPrice);
                setMessage(`Purchased ${quantity.toFixed(6)} ${symbol}`);
                await fetchData();
            } else {
                setMessage(`Purchase failed - You need ${deltaAmount.toLocaleString()}Δ but only have ${deltaBalance.toLocaleString()}Δ`);
            }
        } catch (e) {
            console.error(e);
            setMessage('Purchase failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSellAsset = async (assetType, symbol, assetAmount, currentPrice) => {
        setLoading(true);
        try {
            const res = await dbank_backend.sellAsset(assetType, symbol, assetAmount, currentPrice);
            if (res && res.length > 0) {
                const deltaValue = InvestmentService.calculateDeltaCost(assetAmount, currentPrice);
                setMessage(`Sold ${assetAmount.toFixed(6)} ${symbol} for ${deltaValue.toLocaleString()} Δ`);
                await fetchData();
            } else {
                setMessage('Sale failed - insufficient holdings');
            }
        } catch (e) {
            console.error(e);
            setMessage('Sale failed');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'marketplace', label: 'Marketplace', icon: TrendingUp },
        { id: 'portfolio', label: 'Portfolio', icon: PieChart },
        { id: 'wallet', label: 'Token Wallet', icon: Wallet },
    ];

    const allAssets = [...cryptoPrices, ...mineralPrices, ...commodityPrices, ...fundPrices, ...forexPrices];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <Header message={message} />

                {/* Page Header */}
                <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Investments</h1>
                        <p className="text-slate-400 mt-1">Trade assets with Delta tokens</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Delta Balance</div>
                        <div className="text-2xl font-bold text-amber-400">{deltaBalance.toLocaleString()} Δ</div>
                        <div className="text-xs text-slate-600">≈ ⨎{InvestmentService.deltaToDbank(deltaBalance).toFixed(2)}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-800">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[600px]">
                    {activeTab === 'wallet' && (
                        <TokenWalletCard
                            deltaBalance={deltaBalance}
                            mainBalance={mainBalance}
                            onBuyTokens={handleBuyTokens}
                            onSellTokens={handleSellTokens}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'marketplace' && (
                        <AssetMarketplace
                            cryptoAssets={cryptoPrices}
                            mineralAssets={mineralPrices}
                            commodityAssets={commodityPrices}
                            fundAssets={fundPrices}
                            forexAssets={forexPrices}
                            deltaBalance={deltaBalance}
                            onBuyAsset={handleBuyAsset}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'portfolio' && (
                        <PortfolioDashboard
                            holdings={holdings}
                            deltaBalance={deltaBalance}
                            allAssets={allAssets}
                            onSellAsset={handleSellAsset}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default InvestmentsPage;
