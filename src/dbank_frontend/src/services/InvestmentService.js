
// /src/dbank_frontend/src/services/InvestmentService.js

/**
 * InvestmentService - Central hub for asset data, historical tracking, and financial conversions.
 * 
 * CURRENT STATUS:
 * - Implements a hybrid data system: real-time API primary, deterministic fallback secondary.
 * - Handles statistical modeling (volatility, trends) for realistic chart generation.
 * - Manages persistent graph state in localStorage for consistent UI across sessions.
 * 
 * PLANNED UPGRADES:
 * - Migrating price variation logic to a dedicated backend microservice.
 * - Implementing WebSocket support for real-time live price streaming.
 * - Enhancing portfolio analytics with Risk/Reward (Sharpe Ratio) calculations.
 * - Support for fractional ownership of higher-value minerals (Lithium/Copper).
 */

const API_CACHE = {
    goldSilver: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 60000; // 1 minute
const HISTORY_STORAGE_KEY = 'investment_price_history';
const LONG_TERM_HISTORY_KEY = 'investment_long_term_history';
const HISTORY_DAYS = 7; // Keep last 7 days for rolling window calculations
const BASE_API_URL = 'https://my-api-rose-seven.vercel.app/api';

/**
 * VOLATILITY_PROFILES defines the boundary and behavior of different asset classes.
 * Adjusting these impacts how 'real' the fallback charts look.
 */
const VOLATILITY_PROFILES = {
    crypto: { base: 0.05, range: [0.03, 0.12], maxDaily: 0.15 },
    currency: { base: 0.01, range: [0.003, 0.02], maxDaily: 0.03 },
    fund: { base: 0.03, range: [0.01, 0.06], maxDaily: 0.08 },
    mineral: { base: 0.04, range: [0.02, 0.08], maxDaily: 0.10 },
    trade: { base: 0.05, range: [0.02, 0.10], maxDaily: 0.12 }
};

/**
 * Generates a deterministic seed based on the date.
 * Ensures all users see identical price movements for fallback data on any given day.
 */
function getDailySeed() {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
        seed = (seed << 5) - seed + dateString.charCodeAt(i);
    }
    return Math.abs(seed);
}

/**
 * Deterministic PRNG from seed.
 * Critical for keeping charts stable during refresh.
 */
function seededRandom(seed, index) {
    const x = Math.sin(seed + index * 1.618033) * 10000;
    return x - Math.floor(x);
}

function getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// --- HISTORICAL DATA MANAGEMENT ---

/**
 * Retrieves daily history snapshots from localStorage.
 * Note: Future implementations should sync this with a decentralized storage solution.
 */
function getHistoricalPrices(assetId) {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!data) return [];
        const allHistory = JSON.parse(data);
        return allHistory[assetId] || [];
    } catch (e) {
        console.warn('InvestmentService: Failed to load local history:', e);
        return [];
    }
}

/**
 * Persists current price as a daily snapshot.
 * Maintains a rolling window of HISTORY_DAYS to prevent storage bloat.
 */
function saveHistoricalPrice(assetId, price, change, trend) {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        const allHistory = data ? JSON.parse(data) : {};

        if (!allHistory[assetId]) {
            allHistory[assetId] = [];
        }

        const today = getTodayDateString();
        const existing = allHistory[assetId].findIndex(h => h.date === today);

        const entry = {
            date: today,
            price,
            change,
            trend,
            timestamp: Date.now()
        };

        if (existing >= 0) {
            allHistory[assetId][existing] = entry;
        } else {
            allHistory[assetId].push(entry);
        }

        allHistory[assetId] = allHistory[assetId]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, HISTORY_DAYS);

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    } catch (e) {
        console.warn('InvestmentService: Failed to save price snapshot:', e);
    }
}

/**
 * Prunes data older than the HISTORY_DAYS threshold.
 * Runs on every service initialization to maintain healthy browser performance.
 */
function cleanOldHistory() {
    try {
        const data = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!data) return;

        const allHistory = JSON.parse(data);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - HISTORY_DAYS);

        Object.keys(allHistory).forEach(assetId => {
            allHistory[assetId] = allHistory[assetId].filter(h => {
                return new Date(h.date) >= cutoffDate;
            });
        });

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    } catch (e) {
        console.warn('InvestmentService: History cleanup failure:', e);
    }
}

/**
 * Long-term history (Years/Months) used for macro-charts.
 */
function getLongTermHistory(assetId) {
    try {
        const data = localStorage.getItem(LONG_TERM_HISTORY_KEY);
        if (!data) return null;
        const allHistory = JSON.parse(data);
        return allHistory[assetId] || null;
    } catch (e) {
        console.warn('InvestmentService: Long-term history load failure:', e);
        return null;
    }
}

function saveLongTermHistory(assetId, historyData) {
    if (!historyData) return;
    try {
        const data = localStorage.getItem(LONG_TERM_HISTORY_KEY);
        const allHistory = data ? JSON.parse(data) : {};

        allHistory[assetId] = historyData;
        localStorage.setItem(LONG_TERM_HISTORY_KEY, JSON.stringify(allHistory));
    } catch (e) {
        console.warn('InvestmentService: Long-term history save failure:', e);
    }
}

// --- PERSISTENT CHART STATE ---

const GRAPH_STORAGE_KEY = 'investment_graph_data';

/**
 * Prevents "flickering" or regenerating charts on every component mount.
 * Storing calculated charts ensures the user has a stable visual experience.
 */
function getStoredGraphData() {
    try {
        const data = localStorage.getItem(GRAPH_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.warn('InvestmentService: Graph data load failure:', e);
        return {};
    }
}

function saveGraphData(graphKey, chartData, date, isLongTerm = false) {
    try {
        const allGraphs = getStoredGraphData();
        allGraphs[graphKey] = {
            data: chartData,
            date: date,
            isLongTerm: isLongTerm
        };
        localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(allGraphs));
    } catch (e) {
        console.warn('InvestmentService: Graph data save failure:', e);
    }
}

function getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

// --- STATISTICAL ANALYSIS ENGINE ---

/**
 * Calculates standard deviation of returns.
 * Future Use: Triggering system-wide "market crash/pump" events.
 */
function calculateVolatility(prices) {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

function calculateMovingAverage(prices, window = 3) {
    if (prices.length < window) return prices[prices.length - 1] || 0;

    const recent = prices.slice(-window);
    return recent.reduce((sum, p) => sum + p, 0) / window;
}

/**
 * Uses linear regression to detect if an asset is trending up, down, or sideways.
 * High strength trends influence the generation of subsequent data points.
 */
function detectTrend(prices) {
    if (prices.length < 3) return { direction: 'sideways', strength: 0 };

    const n = prices.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = prices.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * prices[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgPrice = sumY / n;
    const slopePercent = (slope / avgPrice) * 100;

    let direction, strength;
    if (Math.abs(slopePercent) < 0.5) {
        direction = 'sideways';
        strength = 0;
    } else if (slopePercent > 0) {
        direction = 'uptrend';
        strength = Math.min(Math.abs(slopePercent) / 2, 1);
    } else {
        direction = 'downtrend';
        strength = Math.min(Math.abs(slopePercent) / 2, 1);
    }

    return { direction, strength, slope: slopePercent };
}

/**
 * Normalizes price range for scaling charts.
 */
function getHistoricalRange(history) {
    if (history.length === 0) return null;

    const prices = history.map(h => h.price);
    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((sum, p) => sum + p, 0) / history.length
    };
}

/**
 * Gaussian Noise (Box-Muller) implementation.
 * Ensures simulated swings look like real market candles rather than jagged noise.
 */
function gaussianNoise(mean = 0, stdDev = 1) {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

/**
 * Fallback Price Generator.
 * Remains static for the entire day using seeded randomness.
 */
function getDailyPrice(basePrice, assetId, assetType = 'crypto') {
    const history = getHistoricalPrices(assetId);
    const today = getTodayDateString();
    const todayEntry = history.find(h => h.date === today);

    if (todayEntry) {
        return { price: todayEntry.price, change: todayEntry.change };
    }

    const dailySeed = getDailySeed();
    let assetSeed = 0;
    for (let i = 0; i < assetId.length; i++) {
        assetSeed = (assetSeed << 5) - assetSeed + assetId.charCodeAt(i);
    }
    const seed = dailySeed + Math.abs(assetSeed);

    const profile = VOLATILITY_PROFILES[assetType] || VOLATILITY_PROFILES.currency;
    const dailyChange = (seededRandom(seed, 0) - 0.5) * 2 * profile.base;

    return {
        price: basePrice * (1 + dailyChange),
        change: dailyChange * 100
    };
}

cleanOldHistory();

// --- CENTRALIZED ASSET API FETCHING ---

async function fetchAssetCategory(categoryName) {
    try {
        const response = await fetch(`${BASE_API_URL}/assets`);
        if (!response.ok) throw new Error('Assets API unreachable');
        const data = await response.json();

        const categoryObj = data.find(c => c.name === categoryName);
        if (!categoryObj || !categoryObj.data) throw new Error(`Asset category not found: ${categoryName}`);

        return Object.values(categoryObj.data).filter(item => item && typeof item === 'object' && item.id);
    } catch (error) {
        console.error(`InvestmentService: Fetch error for ${categoryName}:`, error);
        throw error;
    }
}

// ============================================================================
// PUBLIC INVESTMENT SERVICE API
// ============================================================================

export const InvestmentService = {

    /**
     * CRYPTOCURRENCY: High volatility assets (BTC, ETH, etc.)
     */
    async getCrypto() {
        try {
            const apiData = await fetchAssetCategory('cryptoPrices');
            return apiData.map(asset => {
                saveHistoricalPrice(asset.id, asset.price, asset.change, asset.market?.trend || 'sideways');
                if (asset.history) saveLongTermHistory(asset.id, asset.history);
                return { ...asset, type: 'crypto' };
            });
        } catch (error) {
            // Hardcoded baselines for offline/fallback mode
            const basePrices = { bitcoin: 7797949.28, ethereum: 325400, solana: 12800, ripple: 88, cardano: 48 };
            return [
                { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', ...getDailyPrice(basePrices.bitcoin, 'bitcoin', 'crypto'), type: 'crypto' },
                { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', ...getDailyPrice(basePrices.ethereum, 'ethereum', 'crypto'), type: 'crypto' },
                { id: 'solana', name: 'Solana', symbol: 'SOL', ...getDailyPrice(basePrices.solana, 'solana', 'crypto'), type: 'crypto' },
                { id: 'ripple', name: 'XRP', symbol: 'XRP', ...getDailyPrice(basePrices.ripple, 'ripple', 'crypto'), type: 'crypto' },
                { id: 'cardano', name: 'Cardano', symbol: 'ADA', ...getDailyPrice(basePrices.cardano, 'cardano', 'crypto'), type: 'crypto' }
            ];
        }
    },

    /**
     * FOREX: Low volatility fiat pairings (USD/INR, EUR/INR)
     */
    async getForex() {
        try {
            const apiData = await fetchAssetCategory('forexPrices');
            return apiData.map(asset => {
                saveHistoricalPrice(asset.id, asset.price, asset.change, asset.market?.trend || 'sideways');
                if (asset.history) saveLongTermHistory(asset.id, asset.history);
                return { ...asset, type: 'currency' };
            });
        } catch (error) {
            const basePrices = { usd: 89.76, eur: 94.50, gbp: 112.40, cny: 12.30, brl: 17.50 };
            return [
                { id: 'usd', name: 'US Dollar', symbol: 'USD', ...getDailyPrice(basePrices.usd, 'usd', 'currency'), type: 'currency' },
                { id: 'eur', name: 'Euro', symbol: 'EUR', ...getDailyPrice(basePrices.eur, 'eur', 'currency'), type: 'currency' },
                { id: 'gbp', name: 'British Pound', symbol: 'GBP', ...getDailyPrice(basePrices.gbp, 'gbp', 'currency'), type: 'currency' },
                { id: 'cny', name: 'Chinese Yuan', symbol: 'CNY', ...getDailyPrice(basePrices.cny, 'cny', 'currency'), type: 'currency' },
                { id: 'brl', name: 'Brazilian Real', symbol: 'BRL', ...getDailyPrice(basePrices.brl, 'brl', 'currency'), type: 'currency' }
            ];
        }
    },

    async getMutualFunds() {
        try {
            const apiData = await fetchAssetCategory('fundPrices');
            return apiData.map(asset => {
                saveHistoricalPrice(asset.id, asset.price, asset.change, asset.market?.trend || 'sideways');
                if (asset.history) saveLongTermHistory(asset.id, asset.history);
                return { ...asset, type: 'fund' };
            });
        } catch (error) {
            const basePrices = { sbi: 168.28, hdfc: 1650.20, icici: 92.40, axis: 104.20, nippon: 3450.80 };
            return [
                { id: 'sbi', name: 'SBI Small Cap', symbol: 'SBI-SC', ...getDailyPrice(basePrices.sbi, 'sbi', 'fund'), type: 'fund' },
                { id: 'hdfc', name: 'HDFC Flexi Cap', symbol: 'HDFC-FC', ...getDailyPrice(basePrices.hdfc, 'hdfc', 'fund'), type: 'fund' },
                { id: 'icici', name: 'ICICI Bluechip', symbol: 'ICICI-BC', ...getDailyPrice(basePrices.icici, 'icici', 'fund'), type: 'fund' },
                { id: 'axis', name: 'Axis Midcap', symbol: 'AXIS-MC', ...getDailyPrice(basePrices.axis, 'axis', 'fund'), type: 'fund' },
                { id: 'nippon', name: 'Nippon Growth', symbol: 'NIPPON-G', ...getDailyPrice(basePrices.nippon, 'nippon', 'fund'), type: 'fund' }
            ];
        }
    },

    async getMinerals() {
        if (Date.now() - API_CACHE.goldSilver.timestamp < CACHE_DURATION && API_CACHE.goldSilver.data) {
            return API_CACHE.goldSilver.data;
        }

        try {
            const apiData = await fetchAssetCategory('mineralPrices');
            const formatted = apiData.map(asset => {
                saveHistoricalPrice(asset.id, asset.price, asset.change, asset.market?.trend || 'sideways');
                if (asset.history) saveLongTermHistory(asset.id, asset.history);
                return { ...asset, type: 'mineral' };
            });

            API_CACHE.goldSilver = { data: formatted, timestamp: Date.now() };
            return formatted;
        } catch (apiError) {
            return [
                { id: 'gold', name: 'Gold (24K)', symbol: 'Au', ...getDailyPrice(138560, 'gold', 'mineral'), unit: '10g', type: 'mineral' },
                { id: 'silver', name: 'Silver', symbol: 'Ag', ...getDailyPrice(232100, 'silver', 'mineral'), unit: '1kg', type: 'mineral' },
                { id: 'lithium', name: 'Lithium', symbol: 'Li', ...getDailyPrice(1850000, 'lithium', 'mineral'), unit: 'Ton', type: 'mineral' },
                { id: 'copper', name: 'Copper', symbol: 'Cu', ...getDailyPrice(1156, 'copper', 'mineral'), unit: 'kg', type: 'mineral' },
                { id: 'nickel', name: 'Nickel', symbol: 'Ni', ...getDailyPrice(1550, 'nickel', 'mineral'), unit: 'kg', type: 'mineral' }
            ];
        }
    },

    async getCommodities() {
        try {
            const apiData = await fetchAssetCategory('commodityPrices');
            return apiData.map(asset => {
                saveHistoricalPrice(asset.id, asset.price, asset.change, asset.market?.trend || 'sideways');
                if (asset.history) saveLongTermHistory(asset.id, asset.history);
                return { ...asset, type: 'trade' };
            });
        } catch (error) {
            const basePrices = { oil: 6800, gas: 356.4, steel: 52000, wheat: 2600, cotton: 58500 };
            return [
                { id: 'oil', name: 'Crude Oil', symbol: 'OIL', ...getDailyPrice(basePrices.oil, 'oil', 'trade'), unit: 'Barrel', type: 'trade' },
                { id: 'gas', name: 'Natural Gas', symbol: 'NG', ...getDailyPrice(basePrices.gas, 'gas', 'trade'), unit: 'MMBtu', type: 'trade' },
                { id: 'steel', name: 'Steel', symbol: 'STL', ...getDailyPrice(basePrices.steel, 'steel', 'trade'), unit: 'Ton', type: 'trade' },
                { id: 'wheat', name: 'Wheat', symbol: 'WHT', ...getDailyPrice(basePrices.wheat, 'wheat', 'trade'), unit: 'Quintal', type: 'trade' },
                { id: 'cotton', name: 'Cotton', symbol: 'CTN', ...getDailyPrice(basePrices.cotton, 'cotton', 'trade'), unit: 'Candy', type: 'trade' }
            ];
        }
    },

    /**
     * CHART GENERATION: Intelligent History Synthesizer.
     * 
     * Prioritization Logic:
     * 1. Check local cache (graphKey) for today's pre-calculated data.
     * 2. Use Long-Term historical data if the range is 1Y or 5Y.
     * 3. Utilize daily snapshots (7-day window) for recent precision.
     * 4. Implement a "Rolling Window" from yesterday's data + current price.
     * 5. Fallback to statistical simulation (Gaussian noise + trend progression).
     */
    async getHistory(id, range, basePrice, type = 'generic', apiHistory = null) {
        if (apiHistory) saveLongTermHistory(id, apiHistory);

        const history = getHistoricalPrices(id);
        const longTerm = apiHistory || getLongTermHistory(id);
        const today = getTodayDateString();
        const graphKey = `graph_${id}_${range}`;
        const storedGraphs = getStoredGraphData();

        let points = range === '1D' ? 24 : (range === '1W' ? 7 : (range === '1M' ? 30 : (range === '1Y' ? 12 : 60)));
        let labelFormat = range === '1D' ? 'Hour' : (range === '1Y' ? 'Month' : (range === '5Y' ? 'YearMonth' : 'Day'));

        let finalHistory = null;
        let isHighQuality = false;

        // Path 1: Fresh Cache Check
        if (storedGraphs[graphKey] && storedGraphs[graphKey].date === today) {
            const isCachedLowQuality = !storedGraphs[graphKey].isLongTerm;
            if (!(isCachedLowQuality && !!longTerm)) {
                finalHistory = [...storedGraphs[graphKey].data];
                isHighQuality = !isCachedLowQuality;
            }
        }

        // Path 2: Long-Term Simulation (Yearly Data Points)
        if (!finalHistory && (range === '5Y' || range === '1Y') && longTerm) {
            const years = Object.keys(longTerm).filter(k => !isNaN(k)).sort();
            if (years.length > 0) {
                const currentYear = new Date().getFullYear();
                const startYear = range === '5Y' ? currentYear - 4 : currentYear;
                finalHistory = [];
                for (let i = 0; i < points; i++) {
                    const progress = i / (points - 1);
                    const targetYear = startYear + progress * (range === '5Y' ? 4 : 1);
                    const fY = Math.floor(targetYear).toString(), cY = Math.ceil(targetYear).toString();
                    let val = (longTerm[fY] && longTerm[cY]) ? longTerm[fY] + (longTerm[cY] - longTerm[fY]) * (targetYear - Math.floor(targetYear)) : (longTerm[fY] || longTerm[cY] || basePrice);
                    if (longTerm.low && val < longTerm.low) val = longTerm.low;
                    if (longTerm.high && val > longTerm.high) val = longTerm.high;
                    finalHistory.push({ val });
                }
                isHighQuality = true;
            }
        }

        // Path 3: Snapshot Reconstruction
        if (!finalHistory && history.length >= points) {
            finalHistory = history.slice(-points).map(h => {
                let val = h.price;
                if (longTerm?.high && val > longTerm.high) val = longTerm.high;
                if (longTerm?.low && val < longTerm.low) val = longTerm.low;
                return { val };
            });
            isHighQuality = true;
        }

        // Path 4: Rolling Window (Yesterday -> Today shift)
        const yesterday = getYesterdayDateString();
        const cachedYesterday = storedGraphs[graphKey];
        if (!finalHistory && cachedYesterday?.date === yesterday && !(!cachedYesterday.isLongTerm && !!longTerm)) {
            const rolled = cachedYesterday.data.slice(1);
            let newVal = basePrice;
            if (longTerm?.high && newVal > longTerm.high) newVal = longTerm.high;
            if (longTerm?.low && newVal < longTerm.low) newVal = longTerm.low;
            rolled.push({ val: newVal });
            finalHistory = rolled;
            isHighQuality = !!cachedYesterday.isLongTerm;
        }

        // Path 5: Statistical Micro-simulation (Absolute Fallback)
        if (!finalHistory) {
            const profile = VOLATILITY_PROFILES[type] || VOLATILITY_PROFILES.currency;
            const volatility = profile.base;
            const seed = getDailySeed() + Math.abs(id.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) + range.charCodeAt(0);

            let start = basePrice / (1 + (seededRandom(seed, 0) - 0.5) * 2 * volatility * Math.sqrt(points));
            if (id.toLowerCase().includes('usd')) start = range === '5Y' ? 76.5 : (range === '1Y' ? 86.2 : start);
            else if (longTerm?.low) start = longTerm.low;

            finalHistory = [];
            for (let i = 0; i < points; i++) {
                const noise = (seededRandom(seed, i + 1) - 0.5) * 2 * volatility;
                let val = (start + (basePrice - start) * (i / (points - 1))) * (1 + noise * 0.3);
                if (longTerm?.high && val > longTerm.high) val = longTerm.high;
                if (longTerm?.low && val < longTerm.low) val = longTerm.low;
                finalHistory.push({ val });
            }
            isHighQuality = false;
        }

        // --- GRAPH FINALIZATION ---
        // Ensuring the very last point EXACTLY matches the current live price
        finalHistory[finalHistory.length - 1].val = basePrice;

        const normalized = finalHistory.map((p, i) => {
            let label = '';
            if (labelFormat === 'Hour') label = `${i}h`;
            else if (labelFormat === 'Day') label = `D${i + 1}`;
            else if (labelFormat === 'Month') label = `M${i + 1}`;
            else if (labelFormat === 'YearMonth') {
                const yI = Math.floor(i / (points / 5));
                label = `${2021 + yI}-M${(i % (points / 5)) + 1}`;
            } else label = `P${i + 1}`;
            return { ...p, label };
        });

        saveGraphData(graphKey, normalized, today, isHighQuality);
        return normalized;
    },

    // --- FINANCIAL CONVERSION UTILITIES ---

    dbankToDelta(dbankAmount) {
        return dbankAmount * 10000; // Rate: 1 ⨎ = 10,000 Δ
    },

    deltaToDbank(deltaAmount) {
        return deltaAmount / 10000;
    },

    calculateAssetQuantity(deltaAmount, assetPriceInINR) {
        const inrAmount = this.deltaToDbank(deltaAmount);
        return inrAmount / assetPriceInINR;
    },

    calculateDeltaCost(assetQuantity, assetPriceInINR) {
        const inrCost = assetQuantity * assetPriceInINR;
        return this.dbankToDelta(inrCost);
    }
};
