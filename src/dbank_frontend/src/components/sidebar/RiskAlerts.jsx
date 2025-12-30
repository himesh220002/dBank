import React, { useMemo } from 'react';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

const RiskAlerts = ({ currentBalance = 0, transactions = [] }) => {
    const alerts = useMemo(() => {
        const list = [];

        // 1. Low Balance Warning
        // Threshold: $100
        if (currentBalance < 100) {
            list.push({
                id: 'low-bal',
                severity: 'high',
                title: 'Low Balance',
                desc: 'Your main wallet is critically low.',
                action: 'Deposit'
            });
        }

        // 2. High Outflow Warning based on recent transactions (last 5)
        // We filter for 'withdraw', 'spend', 'pay_emi'
        const recentOutflow = transactions
            .slice(0, 5)
            .filter(t => {
                const op = (t.operation || '').toLowerCase();
                return op.includes('withdraw') || op.includes('spend') || op.includes('pay_emi');
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // If spent > $500 and > 50% of current balance (or 20% of previous if balance is low)
        // Simple heuristic: > 500 recently is "high" for this demo
        if (recentOutflow > 500) {
            list.push({
                id: 'high-spend',
                severity: 'medium',
                title: 'High Spending',
                desc: `Recent outflow: ⨎${recentOutflow.toFixed(0)}`,
                action: 'Review'
            });
        }

        return list;
    }, [currentBalance, transactions]);

    if (alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-4 text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                <div className="bg-emerald-500/10 p-2 rounded-full mb-2">
                    <AlertTriangle size={16} className="text-emerald-500 opacity-50" />
                </div>
                <span className="text-xs">No risks detected</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {alerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border flex items-start gap-3 ${alert.severity === 'high'
                        ? 'bg-rose-500/10 border-rose-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                    <div className={`p-1.5 rounded-md shrink-0 ${alert.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                        {alert.severity === 'high' ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold mb-0.5 ${alert.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                            {alert.title}
                        </div>
                        <div className="text-[10px] text-slate-300 leading-tight mb-2">
                            {alert.desc}
                        </div>
                        <button className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${alert.severity === 'high'
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                            }`}>
                            {alert.action}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RiskAlerts;
