
import { useCallback, useEffect, useState } from "react";

import {
  depositSavings,
  getSavingsBalances,
  getSavingsPerformance,
  withdrawSavings,
} from "../services/savings_service";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function MetricCard({ label, value, description }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{formatMoney(value)}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default function SavingsPage() {
  const [balances, setBalances] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [period, setPeriod] = useState(currentMonth());
  const [amount, setAmount] = useState("");
  const [transferType, setTransferType] = useState("deposit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [balanceData, ...performanceResult] = await Promise.all([
        getSavingsBalances(),
        getSavingsPerformance(
          Number(period.split("-")[0]),
          Number(period.split("-")[1])
        ),
      ]);

      setBalances(balanceData);
      setPerformance(performanceResult[0]);
    } catch (err) {
      setError(err.message || "Could not load savings information.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleTransfer(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);

    try {
      if (transferType === "deposit") {
        await depositSavings(amount);
        setSuccess(`${formatMoney(value)} transferred into Savings.`);
      } else {
        await withdrawSavings(amount);
        setSuccess(`${formatMoney(value)} transferred to Available Funds.`);
      }

      setAmount("");
      await loadData();
    } catch (err) {
      setError(err.message || "The transfer could not be completed.");
    } finally {
      setSaving(false);
    }
  }

  const metrics = [
    {
      label: "Potential Savings",
      value: performance?.potential_savings,
      description: "Income minus allocated budgets",
    },
    {
      label: "Real Savings",
      value: performance?.real_savings,
      description: "Income minus recorded expenses",
    },
    {
      label: "Savings Variance",
      value: performance?.savings_variance,
      description: "Real savings minus potential savings",
    },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <p className="text-sm text-emerald-400">Build your financial future</p>
        <h1 className="mt-1 text-2xl font-semibold">Savings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track your savings performance and control how much you set aside.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {loading && !balances ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          Loading savings...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Available Funds"
              value={balances?.available_funds}
              description="Money currently available to spend"
            />
            <MetricCard
              label="Actual Savings Fund"
              value={balances?.savings_funds}
              description="Money deliberately transferred into savings"
            />
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Move money</h2>
            <p className="mt-1 text-sm text-slate-400">
              Transfers move existing money between your own balances.
            </p>

            <form onSubmit={handleTransfer} className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTransferType("deposit")}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    transferType === "deposit"
                      ? "bg-emerald-400 font-semibold text-slate-950"
                      : "border border-slate-700 text-slate-300"
                  }`}
                >
                  Save money
                </button>

                <button
                  type="button"
                  onClick={() => setTransferType("withdraw")}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    transferType === "withdraw"
                      ? "bg-emerald-400 font-semibold text-slate-950"
                      : "border border-slate-700 text-slate-300"
                  }`}
                >
                  Withdraw savings
                </button>
              </div>

              <label className="block text-sm text-slate-300">
                Amount (KES)
                <input
                  className="input mt-2"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 1000"
                  required
                />
              </label>

              <p className="text-xs text-slate-500">
                {transferType === "deposit"
                  ? `Available to transfer: ${formatMoney(balances?.available_funds)}`
                  : `Available to withdraw: ${formatMoney(balances?.savings_funds)}`}
              </p>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                {saving
                  ? "Processing..."
                  : transferType === "deposit"
                    ? "Transfer to Savings"
                    : "Transfer to Available Funds"}
              </button>
            </form>
          </section>
        </>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Savings performance</h2>
            <p className="mt-1 text-sm text-slate-400">
              Compare planned savings with your actual financial activity.
            </p>
          </div>

          <label className="text-sm text-slate-300">
            Reporting month
            <input
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="input mt-2"
            />
          </label>
        </div>

        {performance && (
          <p className="text-xs text-slate-500">
            Period: {performance.period_start} to {performance.period_end}
          </p>
        )}

        {!performance && !loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
            Performance data is unavailable. Check the backend endpoint and try again.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                description={metric.description}
              />
            ))}
          </div>
        )}

        {performance && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-medium">Monthly breakdown</h3>
            <div className="mt-4 divide-y divide-slate-800">
              {[
                ["Income", performance.income],
                ["Budgeted amount", performance.budgeted_amount],
                ["Actual expenses", performance.actual_expenses],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium">{formatMoney(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}