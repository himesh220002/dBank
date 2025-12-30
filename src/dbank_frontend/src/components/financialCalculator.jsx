import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

/**
 * Props:
 *  - backend (optional) : canister actor (dbank_backend) to call projectedBalances / setInterestRate / resetInterestRate
 *  - pollIntervalMs (optional) : if backend provided, poll current balance (default 5000)
 *  - initialBalance (optional) : numeric initial balance fallback
 */
export default function FinancialCalculator({
  backend = null,
  pollIntervalMs = 5000,
  initialBalance = 0,
}) {
  const defaultYears = [0, 1, 2, 3, 4, 5, 10];
  const [balance, setBalance] = useState(Number(initialBalance || 0));
  const [fixedRate, setFixedRate] = useState(""); // percent, e.g. "5" for 5%
  const [useFixedRate, setUseFixedRate] = useState(false);
  const [years, setYears] = useState(defaultYears);
  const [projected, setProjected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [showTerms, setShowTerms] = useState(false);

  // poll current value from canister if available
  useEffect(() => {
    if (!backend) return;
    let cancelled = false;
    async function fetchBal() {
      try {
        const b = await backend.getCurrentValue();
        if (!cancelled) setBalance(Number(b));
      } catch (e) {
        // ignore
      }
    }
    fetchBal();
    const t = setInterval(fetchBal, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [backend, pollIntervalMs]);

  // compute local projection using continuous compounding A = P * e^(r * t)
  const computeLocalProjection = (p, rFraction, yrs) => {
    return yrs.map((y) => {
      const t = Number(y);
      return Number((p * Math.exp(rFraction * t)).toFixed(8));
    });
  };

  // fetch projections from canister if backend provided and not using fixed override,
  // otherwise compute locally using chosen rate
  async function refreshProjections() {
    setLoading(true);
    setMessage("");
    try {
      // if using fixed rate override, use local compute
      if (useFixedRate) {
        const r = parseFloat(fixedRate) / 100.0;
        const res = computeLocalProjection(balance, r, years);
        setProjected(res);
        setLoading(false);
        return;
      }

      if (backend && backend.projectedBalances) {
        // backend expects [Int], pass years as ints
        const res = await backend.projectedBalances(years.map((y) => Number(y)));
        setProjected((res || []).map((v) => Number(v)));
      } else {
        // fallback: use tiered logic here (same as canister)
        // determine rate from balance:
        let rate = 0.07;
        if (balance < 10000.0) rate = 0.03;
        else if (balance < 100000.0) rate = 0.05;
        const res = computeLocalProjection(balance, rate, years);
        setProjected(res);
      }
    } catch (err) {
      setMessage("Projection failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // refresh when balance, years or rate mode change
    refreshProjections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, years, useFixedRate, fixedRate, backend]);

  // derive displayed applied rate (percent) and label
  const appliedRateDisplay = useMemo(() => {
    if (useFixedRate) {
      const r = parseFloat(fixedRate);
      return { pct: Number.isFinite(r) ? r : null, label: "Fixed" };
    }
    // tiered rule (mirror canister)
    let pct = 7.0;
    if (balance < 10000.0) pct = 3.0;
    else if (balance < 100000.0) pct = 5.0;
    return { pct, label: "Tiered" };
  }, [useFixedRate, fixedRate, balance]);

  // chart data
  const chartData = useMemo(() => {
    return {
      labels: years.map((y) => `${y}y`),
      datasets: [
        {
          label: "Projected balance",
          data: projected.map((v) => Number(v).toFixed(2)),
          fill: true,
          backgroundColor: "rgba(56,189,248,0.12)",
          borderColor: "rgba(6,182,212,0.9)",
          tension: 0.3,
          pointRadius: 4,
        },
        {
          label: "Current",
          data: years.map(() => Number(balance)),
          borderDash: [6, 4],
          borderColor: "rgba(107,114,128,0.6)",
          backgroundColor: "rgba(0,0,0,0)",
          pointRadius: 0,
        },
      ],
    };
  }, [years, projected, balance]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        ticks: { callback: (v) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }) },
      },
    },
  };

  // apply fixed rate on chain (optional)
  const applyFixedRateOnChain = async () => {
    if (!backend || !backend.setInterestRate) {
      setMessage("No backend available to apply rate");
      return;
    }
    const r = parseFloat(fixedRate);
    if (!Number.isFinite(r)) {
      setMessage("Enter valid rate");
      return;
    }
    try {
      setLoading(true);
      await backend.setInterestRate(Number(r / 100.0)); // pass fraction to canister
      setMessage("Fixed annual rate applied on-chain");
      await refreshProjections();
    } catch (e) {
      setMessage("Failed to set rate on chain");
    } finally {
      setLoading(false);
    }
  };

  // reset chain to tiered
  const resetRateOnChain = async () => {
    if (!backend || !backend.resetInterestRate) {
      setMessage("No backend available to reset rate");
      return;
    }
    try {
      setLoading(true);
      await backend.resetInterestRate();
      setMessage("Reset to tiered rates on-chain");
      await refreshProjections();
    } catch (e) {
      setMessage("Failed to reset rate");
    } finally {
      setLoading(false);
    }
  };

   // close modal on Esc
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setShowTerms(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="p-4 bg-gradient-to-b from-white to-[#ffffff] rounded shadow">
      <div className="flex items-start justify-center mb-3 p-4  rounded">
        <div>
          <h2 className="text-xl text-center font-semibold">Financial calculator</h2>
          <div className="text-xs text-gray-500">Projected balances using continuous compounding</div>
        </div>

        
      </div>

        <div className="flex justify-between items-center"> 

       <div className="flex flex-col gap-2 mb-4">
  <label className="text-xs text-gray-500">Interest Rate Mode</label>
  <div className="flex gap-2 items-center">
    <select
      value={useFixedRate ? "fixed" : "tiered"}
      onChange={async (e) => {
        const mode = e.target.value;
        setUseFixedRate(mode === "fixed");
        if (mode === "tiered") {
          await resetRateOnChain();
          setFixedRate("");
        }
      }}
      className="px-2 py-2 border border-sky-100 bg-white rounded text-md "
    >
      <option value="tiered">Tiered (auto by balance)</option>
      <option value="fixed">Fixed (custom %)</option>
    </select>

    <input
      type="number"
      step="0.01"
      placeholder="e.g. 5"
      disabled={!useFixedRate}
      value={fixedRate}
      onChange={(e) => setFixedRate(e.target.value)}
      className="px-2 py-2 border border-sky-100 bg-white rounded text-sm w-24"
    />

    <button
      disabled={!useFixedRate || !fixedRate}
      onClick={async () => {
        const r = parseFloat(fixedRate);
        if (Number.isFinite(r)) {
          await applyFixedRateOnChain();
        }
      }}
      className="px-3 py-2 bg-sky-600 text-white rounded text-sm disabled:opacity-0 cursor-pointer disabled:cursor-default hover:bg-sky-700"
    >
      Apply
    </button>
  </div>
  {message && <div className="text-xs text-gray-600">{message}</div>}
</div>
        <div>
        {/* Applied rate badge + T&C button */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-sky-50 border border-sky-200 rounded text-sm text-sky-700">
            Applied rate:{" "}
            {appliedRateDisplay.pct === null ? "—" : `${appliedRateDisplay.pct.toFixed(2)}%`}{" "}
            <span className="text-xs text-gray-400">({appliedRateDisplay.label})</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="px-3 py-2 bg-white border border-sky-100 rounded text-sm hover:bg-sky-50 cursor-pointer"
          >
            Terms & Conditions
          </button>
        </div>
      </div>
      </div>

      
    <div className= "grid grid-cols-2 bg-white gap-8 rounded p-4">
        <div>
            <div className="p-4 text-center">
          <label className="text-xs text-gray-500">Projection years</label>
          <div className="flex justify-center gap-2 flex-wrap ">
            {defaultYears.map((y) => (
              <button
                key={y}
                type="button"
                className={`px-2 py-1 border rounded text-sm ${years.includes(y) ? "bg-sky-100 border-sky-300" : "bg-white"} cursor-pointer hover:bg-sky-50`}
                onClick={() =>
                  setYears((prev) => (prev.includes(y) ? prev.filter((z) => z !== y) : [...prev, y].sort((a,b)=>a-b)))
                }
              >
                {y}y
              </button>
            ))}
          </div>
        </div>
        
      <div className=" h-[400px] overflow-hidden border border-gray-200 rounded">
        <Line options={chartOptions} data={chartData} />
        <div className="h-6 mt-2 text-center text-sm text-gray-600">
    {loading ? "Working..." : message}
  </div>
      </div>
        </div>
      <div className="">
        <div className="p-5 text-center rounded mt-1"> 
          <div className="text-xs text-gray-500">Current balance</div>
          <div className="text-xl font-bold">{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ⨎</div>
        </div>
      

      <div className="mb-4">
        <table className="text-sm w-full ">
          <thead className="">
            <tr className="text-center border border-gray-300 bg-sky-100">
              <th className=" ">Years</th>
              <th className="text-center">Projected balance</th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-br from-gray-500 to-green-500">
            {years.map((y, i) => (
              <tr key={y} className="">
                <td className="py-1 text-center border border-gray-100 text-gray-50">{y} year{y>1?"s":""}</td>
                <td className="py-1 text-center font-mono border border-gray-100 text-white">{projected[i] !== undefined ? Number(projected[i]).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"} ⨎</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-2">
  <div className="flex items-start text-xs text-gray-600 px-2">
    <span className="mr-2">💡</span>
    <span>
      <span className="font-medium">Tip:</span> Compounding rewards patience. The longer your funds stay untouched, the more exponential your growth. Use the <span className="font-semibold text-sky-700">“Compound”</span> button periodically to lock in earned interest and boost future projections.
    </span>
  </div>
  <div className="flex items-start text-xs text-gray-600 px-2">
    <span className="mr-2">📈</span>
    <span>
      <span className="font-medium">Insight:</span> Your projected balances are based on continuous compounding. This means even small rate changes or longer durations can lead to big differences. Try toggling between <span className="font-semibold text-sky-700">“Tiered”</span> and <span className="font-semibold text-sky-700">“Fixed”</span> modes to explore different growth paths.
    </span>
  </div>
  <div className="flex items-start text-xs text-gray-600 px-2">
    <span className="mr-2">🧮</span>
    <span>
      <span className="font-medium">Reminder:</span> You can simulate future growth without committing funds. Adjust the rate or years, and use the chart to visualize outcomes. This helps you plan smarter before making any deposit or withdrawal.
    </span>
  </div>
</div>


      </div>
      </div>
    </div>


      {/* Terms & Conditions modal */}
      {showTerms && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowTerms(false)} // clicking outside closes
        >
          <div
            className="bg-white rounded shadow-lg max-w-xl w-full p-4 mx-4"
            onClick={(e) => e.stopPropagation()} // prevent outside-click from closing when clicking modal
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-semibold">Interest rate terms & conditions</h4>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-500 hover:text-gray-700 ml-3"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-700 space-y-2">
              <p><strong>How rates are determined</strong></p>
              <p>
                When no fixed annual rate is applied, the account uses tiered interest:
                balances &lt; ₹10,000 → 3.00% p.a., balances &lt; ₹100,000 → 5.00% p.a.,
                balances ≥ ₹100,000 → 7.00% p.a.
              </p>
              <p>
                If a fixed annual rate is set (via the simulator or applied on-chain), that fixed
                rate will be used instead of the tiered schedule.
              </p>
              <p>
                Projections use continuous compounding for display purposes. Actual on-chain
                compounding occurs only when the <em>Compound</em> operation is run and recorded.
              </p>
              <p className="text-xs text-gray-500">
                By using these tools you acknowledge projections are illustrative and not financial advice.
              </p>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowTerms(false)}
                className="px-3 py-1 bg-sky-600 text-white rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}