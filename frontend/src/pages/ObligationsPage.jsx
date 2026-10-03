
import { useCallback, useEffect, useState } from "react";
import {
  createObligation,
  getObligations,
  repayObligation,
} from "../services/obligation_service";

const initialForm = {
  source: "family",
  amount: "",
  reason: "",
  obligation_date: new Date().toLocaleDateString("en-CA"),
  due_date: "",
  description: "",
};

const sources = [
  ["investment_fund", "Investment Fund"],
  ["family", "Family"],
  ["friend", "Friend"],
  ["bank", "Bank"],
  ["sacco", "SACCO"],
  ["mobile_loan", "Mobile Loan"],
  ["other", "Other"],
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatSource(value) {
  return sources.find(([key]) => key === value)?.[1] || value;
}

function getRemaining(obligation) {
  return Math.max(
    0,
    Number(obligation.amount) - Number(obligation.amount_paid)
  );
}

function isOverdue(obligation) {
  if (!obligation.due_date || getRemaining(obligation) <= 0) {
    return false;
  }

  const today = new Date().toLocaleDateString("en-CA");
  return obligation.due_date < today;
}

export default function ObligationsPage() {
  const [obligations, setObligations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [repaymentAmounts, setRepaymentAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [repayingId, setRepayingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadObligations = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getObligations();
      setObligations(data);
    } catch (err) {
      setError(err.message || "Could not load obligations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObligations();
  }, [loadObligations]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      form.due_date &&
      form.due_date < form.obligation_date
    ) {
      setError("Due date cannot be before the obligation date.");
      return;
    }

    setCreating(true);

    try {
      await createObligation({
        source: form.source,
        amount: form.amount,
        reason: form.reason.trim(),
        obligation_date: form.obligation_date,
        due_date: form.due_date || null,
        description: form.description.trim() || null,
      });

      setForm(initialForm);
      setSuccess("Obligation recorded successfully.");
      await loadObligations();
    } catch (err) {
      setError(err.message || "Could not record obligation.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRepayment(obligation) {
    setError("");
    setSuccess("");

    const amount = Number(repaymentAmounts[obligation.id]);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a repayment amount greater than zero.");
      return;
    }

    if (amount > getRemaining(obligation)) {
      setError("Repayment cannot exceed the remaining balance.");
      return;
    }

    setRepayingId(obligation.id);

    try {
      const updated = await repayObligation(obligation.id, String(amount));

      setObligations((current) =>
        current.map((item) =>
          item.id === obligation.id ? updated : item
        )
      );

      setRepaymentAmounts((current) => ({
        ...current,
        [obligation.id]: "",
      }));

      setSuccess(
        `Repayment of ${formatMoney(amount)} recorded successfully.`
      );

      await loadObligations();
    } catch (err) {
      setError(err.message || "Could not record repayment.");
    } finally {
      setRepayingId(null);
    }
  }

  const outstanding = obligations.reduce(
    (sum, item) => sum + getRemaining(item),
    0
  );

  const overdue = obligations
    .filter(isOverdue)
    .reduce((sum, item) => sum + getRemaining(item), 0);

  const totalRepaid = obligations.reduce(
    (sum, item) => sum + Number(item.amount_paid || 0),
    0
  );

  const activeCount = obligations.filter(
    (item) => getRemaining(item) > 0
  ).length;

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <p className="text-sm text-emerald-400">Debt management</p>
        <h1 className="mt-1 text-2xl font-semibold">Obligations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track what you owe, repayment progress, and upcoming due dates.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Outstanding Debt" value={outstanding} />
        <MetricCard label="Total Repaid" value={totalRepaid} />
        <MetricCard label="Overdue Balance" value={overdue} />
        <MetricCard
          label="Active Obligations"
          value={activeCount}
          isCount
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="font-semibold">Record an obligation</h2>
        <p className="mt-1 text-sm text-slate-400">
          Record an amount owed without treating the debt itself as new income.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Creditor / source
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="input mt-2"
              >
                {sources.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Amount owed (KES)
              <input
                className="input mt-2"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="10000.00"
                required
              />
            </label>

            <label className="text-sm text-slate-300">
              Reason
              <input
                className="input mt-2"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                maxLength={255}
                placeholder="Emergency support"
                required
              />
            </label>

            <label className="text-sm text-slate-300">
              Obligation date
              <input
                className="input mt-2"
                type="date"
                name="obligation_date"
                value={form.obligation_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="text-sm text-slate-300">
              Due date (optional)
              <input
                className="input mt-2"
                type="date"
                name="due_date"
                min={form.obligation_date}
                value={form.due_date}
                onChange={handleChange}
              />
            </label>

            <label className="text-sm text-slate-300">
              Notes (optional)
              <input
                className="input mt-2"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Repay in instalments"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
          >
            {creating ? "Saving..." : "Record obligation"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Your obligations</h2>
          <p className="mt-1 text-sm text-slate-400">
            Record partial or full repayments against each outstanding balance.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
            Loading obligations...
          </div>
        ) : obligations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
            <p className="font-medium">No obligations recorded</p>
            <p className="mt-2 text-sm text-slate-400">
              Any debts you record will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {obligations.map((item) => {
              const remaining = getRemaining(item);
              const paid = Number(item.amount_paid || 0);
              const amount = Number(item.amount || 0);
              const paidPercentage =
                amount > 0 ? Math.min((paid / amount) * 100, 100) : 0;

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{item.reason}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatSource(item.source)} · Recorded{" "}
                        {item.obligation_date}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.due_date
                          ? `Due ${item.due_date}`
                          : "No due date set"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        remaining === 0
                          ? "bg-emerald-500/10 text-emerald-300"
                          : isOverdue(item)
                            ? "bg-red-500/10 text-red-300"
                            : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {remaining === 0
                        ? "Paid"
                        : isOverdue(item)
                          ? "Overdue"
                          : item.status === "partially_paid"
                            ? "Partially paid"
                            : "Outstanding"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-sm text-slate-400">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">Original amount</p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Repaid</p>
                      <p className="mt-1 font-semibold text-emerald-300">
                        {formatMoney(paid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Remaining</p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>

                  {remaining > 0 && (
                    <form
                      className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-800 pt-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleRepayment(item);
                      }}
                    >
                      <label className="min-w-0 flex-1 text-sm text-slate-300">
                        Repayment amount (KES)
                        <input
                          className="input mt-2"
                          type="number"
                          min="0.01"
                          max={remaining}
                          step="0.01"
                          value={repaymentAmounts[item.id] || ""}
                          onChange={(event) =>
                            setRepaymentAmounts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder={`Up to ${remaining.toFixed(2)}`}
                          required
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={repayingId === item.id}
                        className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
                      >
                        {repayingId === item.id
                          ? "Processing..."
                          : "Record repayment"}
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, isCount = false }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">
        {isCount ? value : formatMoney(value)}
      </p>
    </div>
  );
}