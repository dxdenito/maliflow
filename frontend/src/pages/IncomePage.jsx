import { useEffect, useMemo, useState } from "react";

import {
  createIncome,
  deleteIncome,
  getIncome,
  updateIncome,
} from "../services/income_service";

const emptyForm = {
  source: "",
  amount: "",
  received_date: "",
  intended_period: "",
  description: "",
};

function IncomePage() {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadIncome();
  }, []);

  async function loadIncome() {
    try {
      setLoading(true);
      setError("");
      setIncome(await getIncome());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      source: item.source,
      amount: item.amount,
      received_date: item.received_date,
      intended_period: item.intended_period,
      description: item.description || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (editingId) {
        const updated = await updateIncome(editingId, payload);

        setIncome((current) =>
          current.map((item) => (item.id === editingId ? updated : item))
        );
      } else {
        const created = await createIncome(payload);
        setIncome((current) => [created, ...current]);
      }

      closeForm();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this income record?")) return;

    try {
      setError("");
      await deleteIncome(id);
      setIncome((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const totalIncome = useMemo(
    () => income.reduce((total, item) => total + Number(item.amount), 0),
    [income]
  );

  const reservedIncome = useMemo(
    () =>
      income
        .filter((item) => item.received_date < item.intended_period)
        .reduce((total, item) => total + Number(item.amount), 0),
    [income]
  );

  const availableIncome = totalIncome - reservedIncome;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
          <p className="mt-1 text-sm text-slate-400">
            Money received and expected in your financial system.
          </p>
        </div>

        <button
          type="button"
          onClick={showForm ? closeForm : openCreate}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add Income"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Income" value={totalIncome} />
        <SummaryCard label="Available Impact" value={availableIncome} />
        <SummaryCard label="Reserved" value={reservedIncome} />
      </div>

      {showForm && (
        <IncomeForm
          form={form}
          editing={Boolean(editingId)}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Income History</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {income.length} record{income.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Loading income...
          </div>
        ) : income.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No income recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {income.map((item) => {
                  const early = item.received_date < item.intended_period;

                  return (
                    <tr key={item.id} className="transition hover:bg-slate-800/40">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">
                          {item.source}
                        </div>

                        {item.description && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                            {item.description}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {formatDate(item.received_date)}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {formatDate(item.intended_period)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-emerald-400">
                        KSh {formatMoney(item.amount)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                            early
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          {early ? "Reserved" : "Available"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="mr-3 text-xs text-slate-400 hover:text-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function IncomeForm({ form, editing, onChange, onSubmit, onCancel }) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold">
          {editing ? "Edit Income" : "Add Income"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Record when the money arrived and which period it belongs to.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Source">
          <input
            required
            name="source"
            value={form.source}
            onChange={onChange}
            placeholder="Salary"
            className="input"
          />
        </FormField>

        <FormField label="Amount">
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            name="amount"
            value={form.amount}
            onChange={onChange}
            placeholder="80000"
            className="input"
          />
        </FormField>

        <FormField label="Received Date">
          <input
            required
            type="date"
            name="received_date"
            value={form.received_date}
            onChange={onChange}
            className="input"
          />
        </FormField>

        <FormField label="Intended Period">
          <input
            required
            type="date"
            name="intended_period"
            value={form.intended_period}
            onChange={onChange}
            className="input"
          />
        </FormField>
      </div>

      <div className="mt-4">
        <FormField label="Description">
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows="2"
            placeholder="Optional note..."
            className="input resize-none"
          />
        </FormField>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {editing ? "Save Changes" : "Save Income"}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">
        KSh {formatMoney(value)}
      </p>
    </div>
  );
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default IncomePage;