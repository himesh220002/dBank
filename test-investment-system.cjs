#!/usr/bin/env node

/**
 * Automated Test Suite for Investment Fallback Data System
 * Run with: node test-investment-system.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function testHeader(title) {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`  ${title}`, colors.bold + colors.cyan);
    log('='.repeat(60), colors.cyan);
}

function testResult(name, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        log(`✓ ${name}`, colors.green);
    } else {
        failedTests++;
        log(`✗ ${name}`, colors.red);
    }
    if (details) {
        log(`  ${details}`, colors.yellow);
    }
}

// Load InvestmentService for testing
function loadInvestmentService() {
    const servicePath = path.join(__dirname, 'src/dbank_frontend/src/services/InvestmentService.js');

    if (!fs.existsSync(servicePath)) {
        log('ERROR: InvestmentService.js not found!', colors.red);
        process.exit(1);
    }

    const code = fs.readFileSync(servicePath, 'utf8');
    return code;
}

// Test 1: Check if required functions exist
function testFunctionExistence(code) {
    testHeader('Test 1: Function Existence');

    const requiredFunctions = [
        'getDailySeed',
        'seededRandom',
        'getTodayDateString',
        'getHistoricalPrices',
        'saveHistoricalPrice',
        'cleanOldHistory',
        'calculateVolatility',
        'calculateMovingAverage',
        'detectTrend',
        'getHistoricalRange',
        'gaussianNoise',
        'followPreviousTrend',
        'followHistoricalRange',
        'followContinuousTrend',
        'weightedRandomChoice',
        'getStoredGraphData',
        'saveGraphData',
        'getYesterdayDateString'
    ];

    requiredFunctions.forEach(func => {
        const exists = code.includes(`function ${func}`);
        testResult(
            `Function ${func} exists`,
            exists,
            exists ? '' : `Missing function: ${func}`
        );
    });
}

// Test 2: Check volatility profiles
function testVolatilityProfiles(code) {
    testHeader('Test 2: Volatility Profiles Configuration');

    const profiles = ['crypto', 'currency', 'fund', 'mineral', 'trade'];

    profiles.forEach(profile => {
        const hasProfile = code.includes(`${profile}:`);
        testResult(
            `Volatility profile for ${profile} exists`,
            hasProfile
        );
    });

    // Check for required properties
    const hasBase = code.includes('base:');
    const hasRange = code.includes('range:');
    const hasMaxDaily = code.includes('maxDaily:');

    testResult('Volatility profiles have base property', hasBase);
    testResult('Volatility profiles have range property', hasRange);
    testResult('Volatility profiles have maxDaily property', hasMaxDaily);
}

// Test 3: Check localStorage keys
function testLocalStorageKeys(code) {
    testHeader('Test 3: localStorage Configuration');

    const hasHistoryKey = code.includes("HISTORY_STORAGE_KEY = 'investment_price_history'");
    const hasGraphKey = code.includes("GRAPH_STORAGE_KEY = 'investment_graph_data'");
    const hasHistoryDays = code.includes('HISTORY_DAYS = 7');

    testResult('HISTORY_STORAGE_KEY defined', hasHistoryKey);
    testResult('GRAPH_STORAGE_KEY defined', hasGraphKey);
    testResult('HISTORY_DAYS set to 7', hasHistoryDays);
}

// Test 4: Check asset fetch functions
function testAssetFunctions(code) {
    testHeader('Test 4: Asset Fetch Functions');

    const assetFunctions = [
        'getCrypto',
        'getForex',
        'getMutualFunds',
        'getMinerals',
        'getCommodities'
    ];

    assetFunctions.forEach(func => {
        const exists = code.includes(`async ${func}()`);
        testResult(
            `Asset function ${func} exists`,
            exists
        );
    });

    // Check if they use getDailyPrice
    const usesDailyPrice = code.includes('getDailyPrice(');
    testResult('Asset functions use getDailyPrice', usesDailyPrice);
}

// Test 5: Check graph persistence logic
function testGraphPersistence(code) {
    testHeader('Test 5: Graph Persistence Logic');

    const hasGraphKeyGeneration = code.includes('graph_${id}_${range}');
    const hasDateCheck = code.includes('storedGraphs[graphKey].date === today');
    const hasYesterdayCheck = code.includes('storedGraphs[graphKey].date === yesterday');
    const hasRollingWindow = code.includes('oldGraph.slice(1)');
    const hasSaveGraph = code.includes('saveGraphData(graphKey');

    testResult('Graph key generation implemented', hasGraphKeyGeneration);
    testResult('Today\'s date check implemented', hasDateCheck);
    testResult('Yesterday\'s date check implemented', hasYesterdayCheck);
    testResult('Rolling window logic implemented', hasRollingWindow);
    testResult('Graph saving implemented', hasSaveGraph);
}

// Test 6: Check deterministic generation
function testDeterministicGeneration(code) {
    testHeader('Test 6: Deterministic Generation');

    const usesSeededRandom = code.includes('seededRandom(seed');
    const hasSeedGeneration = code.includes('const seed =');
    const noMathRandom = !code.includes('Math.random()') ||
        code.split('Math.random()').length <= 3; // Allow a few for Gaussian noise

    testResult('Uses seededRandom for graphs', usesSeededRandom);
    testResult('Generates deterministic seed', hasSeedGeneration);
    // testResult('Minimal use of Math.random()', noMathRandom,
    //     noMathRandom ? '' : 'Warning: Math.random() used extensively');
}

// Test 7: Check variation strategies
function testVariationStrategies(code) {
    testHeader('Test 7: Variation Strategies');

    const hasStrategyArray = code.includes('const strategies = [');
    const hasWeights = code.includes('weights');
    const hasWeightedChoice = code.includes('weightedRandomChoice');
    const hasTrendDetection = code.includes('detectTrend(');

    testResult('Strategy array defined', hasStrategyArray);
    testResult('Strategy weights implemented', hasWeights);
    testResult('Weighted random choice used', hasWeightedChoice);
    testResult('Trend detection used', hasTrendDetection);
}

// Test 8: Check bounds and limits
function testBoundsChecking(code) {
    testHeader('Test 8: Bounds Checking');

    const hasMaxChange = code.includes('maxDaily');
    const hasBoundsCheck = code.includes('Math.abs(actualChange) > maxChange');
    const hasRangeEnforcement = code.includes('if (newPrice < min)') ||
        code.includes('if (newPrice > max)');

    testResult('Max daily change defined', hasMaxChange);
    testResult('Bounds checking implemented', hasBoundsCheck);
    testResult('Range enforcement implemented', hasRangeEnforcement);
}

// Test 9: Check InvestmentService exports
function testExports(code) {
    testHeader('Test 9: InvestmentService Exports');

    const hasExport = code.includes('export const InvestmentService');
    const hasGetHistory = code.includes('getHistory(id, range, basePrice, type');
    const hasDbankToDelta = code.includes('dbankToDelta');
    const hasDeltaToDbank = code.includes('deltaToDbank');
    const hasCalculateAssetQuantity = code.includes('calculateAssetQuantity');
    const hasCalculateDeltaCost = code.includes('calculateDeltaCost');

    testResult('InvestmentService exported', hasExport);
    testResult('getHistory method exists', hasGetHistory);
    testResult('dbankToDelta converter exists', hasDbankToDelta);
    testResult('deltaToDbank converter exists', hasDeltaToDbank);
    testResult('calculateAssetQuantity exists', hasCalculateAssetQuantity);
    testResult('calculateDeltaCost exists', hasCalculateDeltaCost);
}

// Test 10: Check for common issues
function testCommonIssues(code) {
    testHeader('Test 10: Common Issues Check');

    const noDuplicateFunctions = !code.includes('function getTodayDateString') ||
        code.split('function getTodayDateString').length === 2;
    const hasCleanupCall = code.includes('cleanOldHistory()');
    const noConsoleErrors = !code.includes('console.error') ||
        code.split('console.error').length <= 3;

    testResult('No duplicate function definitions', noDuplicateFunctions,
        noDuplicateFunctions ? '' : 'Warning: Duplicate functions found');
    testResult('Cleanup called on initialization', hasCleanupCall);
    testResult('Minimal console.error usage', noConsoleErrors);
}

// Main test runner
function runTests() {
    log('\n' + '█'.repeat(60), colors.blue);
    log('  INVESTMENT FALLBACK DATA SYSTEM - AUTOMATED TESTS', colors.bold + colors.blue);
    log('█'.repeat(60) + '\n', colors.blue);

    const code = loadInvestmentService();

    testFunctionExistence(code);
    testVolatilityProfiles(code);
    testLocalStorageKeys(code);
    testAssetFunctions(code);
    testGraphPersistence(code);
    testDeterministicGeneration(code);
    testVariationStrategies(code);
    testBoundsChecking(code);
    testExports(code);
    testCommonIssues(code);

    // Summary
    log('\n' + '='.repeat(60), colors.cyan);
    log('  TEST SUMMARY', colors.bold + colors.cyan);
    log('='.repeat(60), colors.cyan);
    log(`Total Tests: ${totalTests}`, colors.blue);
    log(`Passed: ${passedTests}`, colors.green);
    log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
    log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
        failedTests === 0 ? colors.green : colors.yellow);
    log('='.repeat(60) + '\n', colors.cyan);

    // Exit code
    process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests();
