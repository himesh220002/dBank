// /src/dbank_frontend/src/pages/Home.jsx
// Main Dashboard Page - dBank
// Orchestrates balance tracking, goal management, automation, and gamification metrics.

import { useEffect, useState, useRef } from 'react';
import { dbank_backend } from 'declarations/dbank_backend';
import { Header } from '../components/Header';
import { BalanceCard } from '../components/BalanceCard';
import { OperationsCard } from '../components/OperationsCard';
import { StatsGrid } from '../components/StatsGrid';
import { GrowthChart } from '../components/GrowthChart';
import { FinancialPlans } from '../components/FinancialPlans';
import { TransactionHistory } from '../components/TransactionHistory';
import { GoalDetailModal } from '../components/GoalDetailModal';
import { ConfettiBomb } from '../components/ConfettiBomb';
import { TransactionModal } from '../components/TransactionModal';
import PinEntryModal from '../components/PinEntryModal';

import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { AchievementsGrid } from '../components/AchievementsGrid';

// Sidebar Components
import CollapsibleCard from '../components/sidebar/CollapsibleCard';
import QuickTransfer from '../components/sidebar/QuickTransfer';
import RecurringSetup from '../components/sidebar/RecurringSetup';
import SmartAllocation from '../components/sidebar/SmartAllocation';
import CashflowSnapshot from '../components/sidebar/CashflowSnapshot';
import FinancialCalendar from '../components/sidebar/FinancialCalendar';
import ActionQueue from '../components/sidebar/ActionQueue';
import EmergencyFundTracker from '../components/sidebar/EmergencyFundTracker';
import RiskAlerts from '../components/sidebar/RiskAlerts';
import GoalSuggestions from '../components/sidebar/GoalSuggestions';
import HabitStreaks from '../components/sidebar/HabitStreaks';
import { ArrowRightLeft, CalendarClock, PieChart, Activity, Calendar as CalIcon, ListTodo, ShieldAlert, AlertTriangle, Lightbulb, Flame } from 'lucide-react';

/**
 * Home Component
 * 
 * Functional core of the frontend dApp. Manages:
 * - Real-time balance streaming (virtual ticking).
 * - Goal-based financial planning lifecycle.
 * - Local-storage based automation scheduler.
 * - Verification flow with PIN protection.
 */
export function Home() {
    const [balance, setBalance] = useState(null);
    const [virtualBalance, setVirtualBalance] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [txs, setTxs] = useState([]);
    const [goals, setGoals] = useState([]);
    const [completedGoals, setCompletedGoals] = useState([]);
    const [emis, setEmis] = useState([]); // EMI-type goals
    const [projections, setProjections] = useState([]);
    const [apr, setApr] = useState(0.05); // Default 5%
    const [manageMode, setManageMode] = useState(false);

    // Gamification State
    const [healthScore, setHealthScore] = useState(50);
    const [achievements, setAchievements] = useState([]);

    // Goal state
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Transaction Modal State
    const [transactionModal, setTransactionModal] = useState({
        isOpen: false,
        type: 'fund',
        goalId: null,
        title: '',
        action: null,
        success: false,
        balanceInfo: null // { goalBalance, mainBalance }
    });

    // PIN Modal State
    const [showPin, setShowPin] = useState(false);
    const [pendingOperation, setPendingOperation] = useState(null); // { type: 'deposit' | 'withdraw', amount: number }

    // --- Refs ---
    // tickInterval stores the ID of the real-time balance streaming interval to prevent leaks.
    const tickInterval = useRef(null);

    // --- Data Fetching & Sync ---
    /**
     * Synchronizes local state with the Internet Computer canister.
     * Maps raw backend BigInts and Variants to frontend-friendly formats.
     */
    async function fetchData() {
        try {
            const b = await dbank_backend.getCurrentValue();
            const val = Number(b);
            setBalance(val);
            setVirtualBalance(val);

            // Fetch Gamification Data
            const score = await dbank_backend.getFinancialHealth();
            setHealthScore(Number(score));

            const ach = await dbank_backend.getAchievements();
            setAchievements(ach.map(a => ({
                ...a,
                unlockedAt: a.unlockedAt.length > 0 ? Number(a.unlockedAt[0]) / 1_000_000 : null
            })));

            const t = await dbank_backend.getTransactions();
            setTxs(t.map(tx => ({
                ...tx,
                amount: Number(tx.amount),
                balance: Number(tx.balance),
                time: Number(tx.time) / 1_000_000
            })));

            const g = await dbank_backend.getGoals();
            const mappedGoals = g.map(goal => ({
                ...goal,
                targetAmount: Number(goal.targetAmount),
                currentAmount: Number(goal.currentAmount),
                pendingInterest: Number(goal.pendingInterest),
                lockedUntil: Number(goal.lockedUntil),
                dueDate: Number(goal.dueDate) / 1_000_000,
                monthlyCommitment: Number(goal.monthlyCommitment),
                paidAmount: Number(goal.paidAmount)
            }));
            setGoals(mappedGoals);

            // Separate EMI-type goals for cashflow tracking
            const emiGoals = mappedGoals.filter(goal => goal.gType && 'EMI' in goal.gType);
            setEmis(emiGoals);

            const cg = await dbank_backend.getCompletedGoals();
            setCompletedGoals(cg.map(goal => ({
                ...goal,
                amount: Number(goal.amount),
                targetAmount: Number(goal.targetAmount),
                paidAmount: Number(goal.paidAmount),
                completionDate: Number(goal.completionDate) / 1_000_000
            })));

            const projYears = [0, 1, 2, 5, 10];
            const p = await dbank_backend.projectedBalances(projYears.map(y => BigInt(y)));
            const currentBalance = Number(p[0]); // Year 0 is the principal
            setProjections(projYears.map((y, i) => ({
                year: y === 0 ? 'Now' : `Year ${y}`,
                balance: Number(p[i]),
                principal: currentBalance // Show principal as flat line
            })));

            if (val < 10000) setApr(0.03);
            else if (val < 100000) setApr(0.05);
            else setApr(0.07);

        } catch (e) {
            console.error("fetchData error:", e);
        }
    }

    function triggerConfetti() {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    }

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (balance === null) return;
        setVirtualBalance(balance);
        if (tickInterval.current) clearInterval(tickInterval.current);
        const ratePerSecond = apr / (365 * 24 * 60 * 60);
        tickInterval.current = setInterval(() => {
            setVirtualBalance(prev => {
                if (prev === null) return balance;
                return prev * Math.exp(ratePerSecond);
            });
        }, 1000);
        return () => clearInterval(tickInterval.current);
    }, [balance, apr]);

    // --- Local Automation Scheduler ---
    /**
     * Periodically checks for due automated tasks (deposits, EMI payments).
     * Uses localStorage as an offline queue for scheduled actions.
     * Note: This is a client-side convenience, not a robust backend cron.
     */
    useEffect(() => {
        const checkAutomations = async () => {
            const saved = localStorage.getItem('dbank_schedules');
            if (!saved) return;

            let schedules = JSON.parse(saved);
            const now = Date.now();
            let changed = false;

            for (let task of schedules) {
                if (now >= task.nextRun) {
                    console.log("Running automation:", task);

                    // Execute Task
                    try {
                        if (task.type === 'deposit') {
                            // Assuming fundGoal handles generic deposit to savings
                            await dbank_backend.fundGoal(Number(task.targetId), task.amount);
                        } else {
                            // EMI Payment
                            await dbank_backend.payEMI(Number(task.targetId), task.amount, false); // Pay from Main by default
                        }
                        triggerConfetti();

                        // Update Next Run
                        const DAY = 86400000;
                        let next = now;
                        if (task.frequency === 'daily') next += DAY;
                        else if (task.frequency === 'weekly') next += DAY * 7;
                        else if (task.frequency === 'monthly') next += DAY * 30;

                        task.nextRun = next;
                        changed = true;
                    } catch (e) {
                        console.error("Automation failed for", task.id, e);
                    }
                }
            }

            if (changed) {
                localStorage.setItem('dbank_schedules', JSON.stringify(schedules));
                await fetchData(); // Refresh data
                setMessage("Automated tasks executed");
            }
        };

        const timer = setInterval(checkAutomations, 10000); // Check every 10s
        checkAutomations(); // Initial check
        return () => clearInterval(timer);
    }, []);

    // --- Core Financial Operations ---
    /**
     * Executes pending deposit/withdrawal after successful PIN verification.
     */
    async function executePendingOperation() {
        if (!pendingOperation) return;

        // Handle EMI payments separately
        if (pendingOperation.type === 'emi_payment') {
            await executeEMIPayment();
            return;
        }

        setLoading(true);
        try {
            let newBal;
            if (pendingOperation.type === 'deposit') {
                newBal = await dbank_backend.deposit(pendingOperation.amount);
                setBalance(Number(newBal));
                setMessage('Deposit successful');
            } else if (pendingOperation.type === 'withdraw') {
                const res = await dbank_backend.withdraw(pendingOperation.amount);
                if (res && res.length > 0) {
                    setBalance(Number(res[0]));
                    setMessage('Withdraw successful');
                } else {
                    setMessage('Insufficient funds');
                }
            }
            setAmount('');
            await fetchData();
        } catch (err) {
            setMessage(`${pendingOperation.type === 'deposit' ? 'Deposit' : 'Withdrawal'} failed`);
        } finally {
            setLoading(false);
            setPendingOperation(null);
            setShowPin(false); // Close PIN modal
        }
    }

    async function handleDeposit(e) {
        if (e) e.preventDefault();
        const n = Number(amount);
        if (isNaN(n) || n <= 0) return;
        // Open PIN modal
        setPendingOperation({ type: 'deposit', amount: n });
        setShowPin(true);
    }

    async function handleWithdraw(e) {
        if (e) e.preventDefault();
        const n = Number(amount);
        if (isNaN(n) || n <= 0) return;
        // Open PIN modal
        setPendingOperation({ type: 'withdraw', amount: n });
        setShowPin(true);
    }

    async function handleCompound() {
        setLoading(true);
        try {
            await dbank_backend.compound();
            await fetchData();
            setMessage('Gains realized');
        } catch (err) {
            setMessage('Compound failed');
        } finally {
            setLoading(false);
        }
    }

    /**
     * EMI Payment Pipeline
     * Handles source selection (Wallet vs Goal Bucket), PIN verification, and UI feedback.
     */
    async function handlePayEMI(goalId, fromGoalBalance = false, amount = null, source = null) {
        // Find the goal to get its bucket balance and status
        const g = goals.find(x => Number(x.id) === Number(goalId));
        if (!g) return;

        const goalBalance = Number(g.currentAmount);
        const mainBalance = balance || 0;
        const paidAmount = Number(g.paidAmount);
        const targetAmount = Number(g.targetAmount);

        // CASE A: Goal Achieved - Change to Withdrawal Mode (Exit Strategy)
        if (paidAmount >= targetAmount && amount === null) {
            setTransactionModal({
                isOpen: true,
                type: 'withdraw',
                goalId,
                title: 'Withdraw Excess Funds',
                balanceInfo: { goalBalance, mainBalance }, // For withdraw, we primarily care about goalBalance
                action: (amt) => handleWithdrawGoal(goalId, amt) // Reuse withdrawal logic
            });
            return;
        }

        // CASE B: Not Achieved - Normal Payment Modal (with Source Selection)
        if (amount === null) {
            setTransactionModal({
                isOpen: true,
                type: 'pay',
                goalId,
                title: 'Pay EMI',
                balanceInfo: {
                    goalBalance,
                    mainBalance,
                    paidAmount,
                    targetAmount,
                    remaining: Math.max(0, targetAmount - paidAmount)
                },
                action: (amt, src) => handlePayEMI(goalId, src === 'bucket', amt, src)
            });
            return;
        }

        // CASE C: Amount provided - Require PIN before payment
        if (!amount || isNaN(amount)) return;
        const finalAmount = Number(amount);

        // Open PIN modal for verification
        setPendingOperation({
            type: 'emi_payment',
            amount: finalAmount,
            goalId,
            fromGoalBalance
        });
        setShowPin(true);
    }

    async function executeEMIPayment() {
        if (!pendingOperation || pendingOperation.type !== 'emi_payment') return;

        const { goalId, amount, fromGoalBalance } = pendingOperation;
        setLoading(true);

        try {
            const res = await dbank_backend.payEMI(goalId, amount, fromGoalBalance);
            if (res.length > 0) {
                setBalance(Number(res[0]));
                setMessage(fromGoalBalance ? "Paid from Goal Bucket" : "Paid from Main Balance");
                // Success Handling
                setTransactionModal(prev => ({ ...prev, success: true }));
                setTimeout(() => {
                    setTransactionModal(prev => ({ ...prev, isOpen: false, success: false, balanceInfo: null }));
                }, 2000);

                await fetchData();
                // ... rest of refresh logic existing ...
                if (selectedGoal && Number(selectedGoal.id) === Number(goalId)) {
                    const updatedGoals = await dbank_backend.getGoals();
                    const ug = updatedGoals.find(g => Number(g.id) === Number(goalId));
                    if (ug) {
                        setSelectedGoal({
                            ...ug,
                            targetAmount: Number(ug.targetAmount),
                            currentAmount: Number(ug.currentAmount),
                            paidAmount: Number(ug.paidAmount),
                            pendingInterest: Number(ug.pendingInterest),
                            lockedUntil: Number(ug.lockedUntil),
                            dueDate: Number(ug.dueDate) / 1_000_000,
                            monthlyCommitment: Number(ug.monthlyCommitment)
                        });
                        if (Number(ug.paidAmount) >= Number(ug.targetAmount)) triggerConfetti();
                    }
                }
            } else {
                setMessage(fromGoalBalance ? "Insufficient funds in Goal Bucket" : "Insufficient Main Balance");
            }
        } catch (err) {
            console.error('EMI payment error', err);
            setMessage('EMI payment failed');
        } finally {
            setLoading(false);
            setPendingOperation(null);
            setShowPin(false);
        }
    }

    async function handleCreateGoal({ name, amount, type, date, initial, autoPay }) {
        if (!name || !amount || !date) return;
        setLoading(true);
        try {
            const typeArg = type === 'Savings' ? { Savings: null } : { EMI: null };
            const dueTimestamp = BigInt(new Date(date).getTime() * 1_000_000);
            const monthlySuggest = Number(amount) / 12;
            const initialFund = Number(initial) || 0;

            await dbank_backend.createGoal(
                name,
                Number(amount),
                120,
                typeArg,
                dueTimestamp,
                monthlySuggest,
                initialFund,
                autoPay
            );
            await fetchData();

            const isAchieved = initialFund >= Number(amount);
            if (isAchieved) {
                triggerConfetti();
            }

            setMessage(`${type} established`);
        } catch (err) {
            console.error('Goal error', err);
        } finally {
            setLoading(false);
        }
    }

    // --- Goal-Specific Actions ---
    /**
     * Funds a specific goal from the main balance.
     */
    async function handleFundGoal(goalId, amount = null) {
        if (amount === null) {
            setTransactionModal({
                isOpen: true,
                type: 'fund',
                goalId,
                title: 'Fund Goal',
                action: (amt) => handleFundGoal(goalId, amt)
            });
            return;
        }

        if (!amount || isNaN(amount)) return;
        const finalAmount = Number(amount);
        setLoading(true);
        // Do not close modal immediately

        try {
            const res = await dbank_backend.fundGoal(goalId, finalAmount);
            if (res === null || res[0] === undefined) {
                alert("Action failed");
            } else {
                // Success Handling
                setTransactionModal(prev => ({ ...prev, success: true }));
                setTimeout(() => {
                    setTransactionModal(prev => ({ ...prev, isOpen: false, success: false }));
                }, 2000);

                if (selectedGoal) {
                    const updatedGoals = await dbank_backend.getGoals();
                    const updatedGoal = updatedGoals.find(ug => Number(ug.id) === Number(goalId));
                    if (updatedGoal) setSelectedGoal({
                        ...updatedGoal,
                        targetAmount: Number(updatedGoal.targetAmount),
                        currentAmount: Number(updatedGoal.currentAmount),
                        pendingInterest: Number(updatedGoal.pendingInterest),
                        lockedUntil: Number(updatedGoal.lockedUntil),
                        dueDate: Number(updatedGoal.dueDate) / 1_000_000,
                        monthlyCommitment: Number(updatedGoal.monthlyCommitment)
                    });
                }
                await fetchData();
                setMessage(`Funded ⨎${finalAmount.toLocaleString()} `);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }

    async function handleWithdrawGoal(goalId, amount = null) {
        if (amount === null) {
            setTransactionModal({
                isOpen: true,
                type: 'withdraw',
                goalId,
                title: 'Withdraw from Goal',
                action: (amt) => handleWithdrawGoal(goalId, amt)
            });
            return;
        }

        if (!amount || isNaN(amount)) return;
        setLoading(true);
        // Do not close modal immediately

        try {
            const res = await dbank_backend.withdrawFromGoal(goalId, Number(amount));
            if (res === null || res[0] === undefined) {
                alert('Insufficient funds in goal');
                // Could handle failure gracefully here too
            } else {
                // Success Handling
                setTransactionModal(prev => ({ ...prev, success: true }));
                setTimeout(() => {
                    setTransactionModal(prev => ({ ...prev, isOpen: false, success: false }));
                }, 2000);

                setBalance(Number(res[0]));
                setMessage('Withdrawn from goal');
                await fetchData();
                if (selectedGoal) {
                    const updatedGoals = await dbank_backend.getGoals();
                    const updatedGoal = updatedGoals.find(ug => Number(ug.id) === Number(goalId));
                    if (updatedGoal) setSelectedGoal({
                        ...updatedGoal,
                        targetAmount: Number(updatedGoal.targetAmount),
                        currentAmount: Number(updatedGoal.currentAmount),
                        paidAmount: Number(updatedGoal.paidAmount),
                        pendingInterest: Number(updatedGoal.pendingInterest),
                        lockedUntil: Number(updatedGoal.lockedUntil),
                        dueDate: Number(updatedGoal.dueDate) / 1_000_000,
                        monthlyCommitment: Number(updatedGoal.monthlyCommitment)
                    });
                }
            }
        } catch (err) {
            setMessage('Goal withdraw failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleCloseGoal(goalId) {
        if (!confirm("Liquidate this goal? It will be archived in your achievements.")) return;
        setLoading(true);
        try {
            await dbank_backend.closeGoal(goalId);
            setSelectedGoal(null);
            await fetchData();
            setMessage("Goal liquidated and archived!");
            triggerConfetti();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }

    async function handleDeleteGoal(goalId, confirmed = false) {
        if (!confirmed) {
            setTransactionModal({
                isOpen: true,
                type: 'delete',
                goalId,
                title: 'Delete Goal',
                action: () => handleDeleteGoal(goalId, true)
            });
            return;
        }

        setLoading(true);
        // Do not close immediately
        try {
            const res = await dbank_backend.deleteGoal(goalId);
            if (res) {
                // Success Handling
                setTransactionModal(prev => ({ ...prev, success: true }));
                setTimeout(() => {
                    setTransactionModal(prev => ({ ...prev, isOpen: false, success: false }));
                }, 2000);

                setMessage("Goal deleted");
                setManageMode(false);
                await fetchData();
            } else {
                setMessage("Error: Goal must be empty");
                // Close modal manually if error, or let user close
                setTransactionModal(prev => ({ ...prev, isOpen: false }));
                alert("Error: Only goals with 0 balance can be deleted.");
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }

    async function handleExportCSV() {
        try {
            const csv = await dbank_backend.exportTransactionsCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'dbank_history.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) { console.error(e); }
    }

    // --- Sidebar Utility Handlers ---
    /**
     * Quick Transfer facilitates rapid moving of funds between Main and Goal buckets.
     */
    const handleQuickTransfer = async ({ source, target, amount }) => {
        if (!amount || isNaN(amount)) return;
        setLoading(true);
        try {
            // Main -> Goal
            if (source === 'main' && target !== 'main') {
                await dbank_backend.fundGoal(Number(target), amount);
                setMessage(`Transferred ⨎${amount} to goal`);
            }
            // Goal -> Main
            else if (source !== 'main' && target === 'main') {
                // Using existing logic that calls withdrawFromGoal
                await dbank_backend.withdrawFromGoal(Number(source), amount);
                setMessage(`Transferred ⨎${amount} to Main`);
            }
            await fetchData();
        } catch (err) {
            console.error("Transfer error", err);
            setMessage("Transfer failed");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePreset = async (preset) => {
        // Preset: { name, amount, type, ... }
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        await handleCreateGoal({
            name: preset.name,
            amount: preset.amount.toString(),
            type: preset.type,
            date: nextYear.toISOString().split('T')[0], // YYYY-MM-DD
            initial: '0',
            autoPay: false
        });
    };

    const healthInsights = [
        balance > 1000 ? "Great job maintaining a healthy balance!" : "Try to build your balance above ⨎1,000.",
        goals.length > 0 ? "You're actively working on goals." : "Set a goal to boost your score.",
        achievements.filter(a => a.unlockedAt).length > 2 ? "You're unlocking badges fast!" : "Keep going to unlock more badges."
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <Header message={message} onExport={handleExportCSV} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <BalanceCard
                            balance={virtualBalance}
                            loading={loading}
                            onCompound={handleCompound}
                            onRefresh={fetchData}
                        />

                        <OperationsCard
                            amount={amount}
                            setAmount={setAmount}
                            loading={loading}
                            onDeposit={handleDeposit}
                            onWithdraw={handleWithdraw}
                        />

                        <StatsGrid apr={apr} balance={balance || 0} />

                        {/* Power User Sidebar */}
                        <div className="space-y-4">
                            {/* Fast Action Row */}
                            <div className="grid grid-cols-1 gap-4">
                                <CollapsibleCard title="Quick Transfer" icon={ArrowRightLeft} defaultOpen={false}>
                                    <QuickTransfer goals={goals} currentBalance={balance || 0} onTransfer={handleQuickTransfer} />
                                </CollapsibleCard>
                                <CollapsibleCard title="Recurring Setup" icon={CalendarClock} defaultOpen={false}>
                                    <RecurringSetup goals={goals} />
                                </CollapsibleCard>
                            </div>

                            {/* Analysis & Tools */}
                            <CollapsibleCard title="Cashflow Snapshot" icon={Activity} defaultOpen={true}>
                                <CashflowSnapshot
                                    transactions={txs}
                                    balance={balance}
                                    goals={goals}
                                    emis={emis}
                                />
                            </CollapsibleCard>

                            <CollapsibleCard title="Smart Allocation" icon={PieChart} defaultOpen={false}>
                                <SmartAllocation goals={goals} onAllocate={(id, amt) => handleFundGoal(id, amt)} />
                            </CollapsibleCard>

                            <CollapsibleCard title="Financial Calendar" icon={CalIcon} defaultOpen={true}>
                                <FinancialCalendar goals={goals} />
                            </CollapsibleCard>

                            <CollapsibleCard title="Action Queue" icon={ListTodo} defaultOpen={false}>
                                <ActionQueue goals={goals} />
                            </CollapsibleCard>

                            <CollapsibleCard title="Emergency Fund" icon={ShieldAlert} defaultOpen={true}>
                                <EmergencyFundTracker currentBalance={balance || 0} />
                            </CollapsibleCard>

                            <CollapsibleCard title="Risk Alerts" icon={AlertTriangle} defaultOpen={true}>
                                <RiskAlerts currentBalance={balance || 0} transactions={txs} />
                            </CollapsibleCard>

                            <CollapsibleCard title="Goal Suggestions" icon={Lightbulb} defaultOpen={false}>
                                <GoalSuggestions onCreatePreset={handleCreatePreset} />
                            </CollapsibleCard>

                            <CollapsibleCard title="Habit Streaks" icon={Flame} defaultOpen={true}>
                                <HabitStreaks transactions={txs} />
                            </CollapsibleCard>
                        </div>


                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <GrowthChart projections={projections} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <HealthScoreGauge score={healthScore} insights={healthInsights} />
                            <AchievementsGrid achievements={achievements} />
                        </div>

                        <FinancialPlans
                            goals={goals}
                            completedGoals={completedGoals}
                            onSelectGoal={setSelectedGoal}
                            onCreateGoal={handleCreateGoal}
                            manageMode={manageMode}
                            toggleManageMode={() => setManageMode(!manageMode)}
                            onFund={handleFundGoal}
                            onWithdraw={handleWithdrawGoal}
                            onDelete={handleDeleteGoal}
                            onPayEMI={(id) => handlePayEMI(id, false)}
                            loading={loading}
                            healthScore={healthScore}
                            insights={healthInsights}
                        />

                        <TransactionHistory transactions={txs} />
                    </div>
                </div>
            </div>

            {selectedGoal && (
                <GoalDetailModal
                    goal={selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    onFund={(id, amt) => handleFundGoal(id, amt)}
                    onPayEMI={(id, amt) => handlePayEMI(id, false, amt)}
                    onPayFromBucket={(id, amt) => handlePayEMI(id, true, amt)}
                    onWithdraw={(id, amt) => handleWithdrawGoal(id, amt)}
                    onToggleStatus={async (id, isActive) => {
                        try {
                            await dbank_backend.toggleGoalStatus(id, isActive);
                            await fetchData();
                            setSelectedGoal(prev => ({ ...prev, status: isActive ? { 'Active': null } : { 'Paused': null } }));
                        } catch (e) { console.error(e); }
                    }}
                    onUpdate={async (id, name, target, commitment) => {
                        const res = await dbank_backend.updateGoal(id, name, target, commitment);
                        if (res) {
                            await fetchData();
                            setSelectedGoal(prev => ({ ...prev, name, targetAmount: target, monthlyCommitment: commitment }));
                            alert("Goal updated successfully!");
                        } else { alert("Update failed"); }
                    }}
                />
            )}
            {showConfetti && <ConfettiBomb />}

            <TransactionModal
                isOpen={transactionModal.isOpen}
                onClose={() => setTransactionModal(prev => ({ ...prev, isOpen: false, success: false }))}
                title={transactionModal.title}
                type={transactionModal.type}
                onConfirm={transactionModal.action}
                loading={loading}
                success={transactionModal.success}
                balanceInfo={transactionModal.balanceInfo}
            />

            {/* PIN Modal */}
            <PinEntryModal
                isOpen={showPin}
                onClose={() => {
                    setShowPin(false);
                    setPendingOperation(null);
                }}
                onSuccess={executePendingOperation}
                amount={pendingOperation?.amount || 0}
            />
        </div>
    );
}

export default Home;
