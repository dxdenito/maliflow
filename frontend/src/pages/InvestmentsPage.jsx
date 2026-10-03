import { useEffect, useMemo, useState } from "react";

import {
  createInvestment,
  getInvestments,
  redeemInvestment,
  updateInvestment,
} from "../services/investment_service";

const investmentTypes = [
  { value: "stock", label: "Stock" },
  { value: "bond", label: "Bond" },
  { value: "mmf", label: "Money Market Fund" },
  { value: "sacco", label: "SACCO" },
  { value: "crypto", label: "Crypto" },
  { value: "business", label: "Business" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

const initialForm = {
  name: "",
  investment_type: "mmf",
  principal_amount: "",
  investment_date: new Date().toISOString().split("T")[0],
  maturity_date: "",
  description: "",
};

function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [valuationInvestment, setValuationInvestment] = useState(null);
  const [valuation, setValuation] = useState("");

  const [redemptionInvestment, setRedemptionInvestment] = useState(null);
  const [redemptionAmount, setRedemptionAmount] = useState("");

  useEffect(() => {
    loadInvestments();
  }, []);

  async function loadInvestments() {
    try {
      setLoading(true);
      setError("");

      const data = await getInvestments();
      setInvestments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const principal = investments.reduce(
      (total, item) => total + Number(item.principal_amount || 0),
      0
    );

    const current = investments.reduce(
      (total, item) => total + Number(item.current_value || 0),
      0
    );

    const active = investments.filter(
      (item) =>
        item.status === "active" ||
        item.status === "partially_redeemed"
    ).length;

    return {
      principal,
      current,
      gainLoss: current - principal,
      active,
    };
  }, [investments]);

  function openCreateForm() {
    setEditingInvestment(null);
    setForm(initialForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(investment) {
    setEditingInvestment(investment);

    setForm({
      name: investment.name,
      investment_type: investment.investment_type,
      principal_amount: investment.principal_amount,
      investment_date: investment.investment_date,
      maturity_date: investment.maturity_date || "",
      description: investment.description || "",
    });

    setShowForm(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, {
          name: form.name,
          investment_type: form.investment_type,
          maturity_date: form.maturity_date || null,
          description: form.description || null,
        });
      } else {
        await createInvestment({
          name: form.name,
          investment_type: form.investment_type,
          principal_amount: form.principal_amount,
          investment_date: form.investment_date,
          maturity_date: form.maturity_date || null,
          description: form.description || null,
        });
      }

      setShowForm(false);
      setEditingInvestment(null);
      setForm(initialForm);

      await loadInvestments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openValuation(investment) {
    setValuationInvestment(investment);
    setValuation(investment.current_value);
  }

  async function handleValuationSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await updateInvestment(valuationInvestment.id, {
        current_value: valuation,
      });

      setValuationInvestment(null);
      setValuation("");

      await loadInvestments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openRedemption(investment) {
    setRedemptionInvestment(investment);
    setRedemptionAmount("");
  }

  async function handleRedemptionSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await redeemInvestment(
        redemptionInvestment.id,
        redemptionAmount
      );

      setRedemptionInvestment(null);
      setRedemptionAmount("");

      await loadInvestments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading investments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Investments
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track money you've allocated to investments and how they're performing.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          + New Investment
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PositionCard
          label="Total Invested"
          value={summary.principal}
        />

        <PositionCard
          label="Current Value"
          value={summary.current}
        />

        <PositionCard
          label="Gain / Loss"
          value={summary.gainLoss}
          accent={summary.gainLoss >= 0 ? "emerald" : "red"}
        />

        <CountCard
          label="Active Investments"
          value={summary.active}
        />
      </section>

      {showForm && (
        <section className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">
                {editingInvestment
                  ? "Edit Investment"
                  : "New Investment"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {editingInvestment
                  ? "Update the investment details."
                  : "Allocate money from Available Funds."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          <InvestmentForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            loading={saving}
            editing={Boolean(editingInvestment)}
          />
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold">Your Investments</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Current investment positions
          </p>
        </div>

        {investments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No investments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Investment</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Current Value</th>
                  <th className="px-4 py-3">Gain / Loss</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {investments.map((investment) => {
                  const principal = Number(
                    investment.principal_amount || 0
                  );

                  const current = Number(
                    investment.current_value || 0
                  );

                  const gainLoss = current - principal;

                  return (
                    <tr
                      key={investment.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium">
                          {investment.name}
                        </p>

                        {investment.maturity_date && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Matures {formatDate(investment.maturity_date)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-sm text-slate-400">
                        {formatType(investment.investment_type)}
                      </td>

                      <td className="px-4 py-3.5 text-sm">
                        KSh {formatMoney(principal)}
                      </td>

                      <td className="px-4 py-3.5 text-sm">
                        KSh {formatMoney(current)}
                      </td>

                      <td
                        className={`px-4 py-3.5 text-sm font-medium ${
                          gainLoss > 0
                            ? "text-emerald-400"
                            : gainLoss < 0
                              ? "text-red-400"
                              : "text-slate-400"
                        }`}
                      >
                        {gainLoss > 0 ? "+" : ""}
                        KSh {formatMoney(gainLoss)}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={investment.status} />
                      </td>

                      <td className="px-4 py-3.5">
                        {investment.status !== "redeemed" && (
                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              onClick={() => openValuation(investment)}
                            >
                              Value
                            </ActionButton>

                            <ActionButton
                              onClick={() => openEditForm(investment)}
                            >
                              Edit
                            </ActionButton>

                            <ActionButton
                              onClick={() => openRedemption(investment)}
                              positive
                            >
                              Redeem
                            </ActionButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {valuationInvestment && (
        <ValuationModal
          investment={valuationInvestment}
          value={valuation}
          setValue={setValuation}
          loading={saving}
          onClose={() => setValuationInvestment(null)}
          onSubmit={handleValuationSubmit}
        />
      )}

      {redemptionInvestment && (
        <RedemptionModal
          investment={redemptionInvestment}
          amount={redemptionAmount}
          setAmount={setRedemptionAmount}
          loading={saving}
          onClose={() => setRedemptionInvestment(null)}
          onSubmit={handleRedemptionSubmit}
        />
      )}
    </div>
  );
}

function PositionCard({ label, value, accent }) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "red"
        ? "text-red-400"
        : "text-white";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${valueClass}`}>
        KSh {formatMoney(value)}
      </p>
    </div>
  );
}

function CountCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-400",
    matured: "bg-blue-500/10 text-blue-400",
    partially_redeemed: "bg-amber-500/10 text-amber-400",
    redeemed: "bg-slate-800 text-slate-500",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-medium ${
        styles[status] || "bg-slate-800 text-slate-400"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function ActionButton({ children, onClick, positive }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        positive
          ? "rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
          : "rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }
    >
      {children}
    </button>
  );
}

function InvestmentForm({
  form,
  setForm,
  onSubmit,
  loading,
  editing,
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4 sm:grid-cols-2">
      <FormField
        label="Investment Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="e.g. Money Market Fund"
        required
      />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Investment Type
        </label>

        <select
          name="investment_type"
          value={form.investment_type}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
        >
          {investmentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {!editing && (
        <FormField
          label="Principal Amount"
          name="principal_amount"
          type="number"
          value={form.principal_amount}
          onChange={handleChange}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          required
        />
      )}

      <FormField
        label="Investment Date"
        name="investment_date"
        type="date"
        value={form.investment_date}
        onChange={handleChange}
        disabled={editing}
        required
      />

      <FormField
        label="Maturity Date"
        name="maturity_date"
        type="date"
        value={form.maturity_date}
        onChange={handleChange}
      />

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Description
        </label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional notes..."
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : editing
              ? "Update Investment"
              : "Create Investment"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  ...props
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        {...props}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function ValuationModal({
  investment,
  value,
  setValue,
  loading,
  onClose,
  onSubmit,
}) {
  return (
    <Modal title="Update Valuation" subtitle={investment.name}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Current Value"
          name="valuation"
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          min="0.01"
          step="0.01"
          required
        />

        <div className="flex justify-end gap-2">
          <ModalButton onClick={onClose}>Cancel</ModalButton>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Value"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RedemptionModal({
  investment,
  amount,
  setAmount,
  loading,
  onClose,
  onSubmit,
}) {
  const currentValue = Number(investment.current_value || 0);
  const redemption = Number(amount || 0);

  return (
    <Modal title="Redeem Investment" subtitle={investment.name}>
      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Current value</span>
          <span className="text-white">
            KSh {formatMoney(currentValue)}
          </span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">Remaining</span>
          <span className="text-white">
            KSh {formatMoney(Math.max(currentValue - redemption, 0))}
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Redemption Amount"
          name="redemption_amount"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          min="0.01"
          max={currentValue}
          step="0.01"
          required
        />

        <div className="flex justify-end gap-2">
          <ModalButton onClick={onClose}>Cancel</ModalButton>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Redeem"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, subtitle, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
        <div className="mb-5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    >
      {children}
    </button>
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatType(value) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(value) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default InvestmentsPage;