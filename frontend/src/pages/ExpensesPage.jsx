import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../services/expense_service";

const emptyForm = {
  category: "",
  amount: "",
  expense_date: new Date().toLocaleDateString("en-CA"),
  description: "",
};

function ExpensesPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");
      setExpenses(await getExpenses());
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
      category: item.category,
      amount: item.amount,
      expense_date: item.expense_date,
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
      const payload = { ...form, amount: Number(form.amount) };

      if (editingId !== null) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      closeForm();
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;

    try {
      setError("");
      await deleteExpense(id);
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalExpenses = useMemo(
    () => expenses.reduce((total, item) => total + Number(item.amount), 0),
    [expenses],
  );

  const today = new Date().toLocaleDateString("en-CA");
  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((item) => item.expense_date === today)
        .reduce((total, item) => total + Number(item.amount), 0),
    [expenses, today],
  );

  const currentMonth = today.slice(0, 7);
  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((item) => item.expense_date.startsWith(currentMonth))
        .reduce((total, item) => total + Number(item.amount), 0),
    [expenses, currentMonth],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track spending and see where your money goes.
          </p>
        </div>

        <button
          type="button"
          onClick={showForm ? closeForm : openCreate}
          className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={loadExpenses} className="shrink-0 underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="All Recorded Expenses" value={totalExpenses} />
        <SummaryCard label="This Month" value={monthExpenses} />
        <SummaryCard label="Today" value={todayExpenses} />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">
              {editingId !== null ? "Edit Expense" : "Record Expense"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Expenses can be backdated. Spending beyond available funds may
              create an obligation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Category">
              <input
                required
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Groceries"
                maxLength={100}
                className="input"
              />
            </FormField>

            <FormField label="Amount (KSh)">
              <input
                required
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="2500"
                className="input"
              />
            </FormField>

            <FormField label="Expense Date">
              <input
                required
                type="date"
                name="expense_date"
                value={form.expense_date}
                onChange={handleChange}
                className="input"
              />
            </FormField>

            <FormField label="Description">
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional note"
                className="input"
              />
            </FormField>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              {editingId !== null ? "Save Changes" : "Save Expense"}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Expense History</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {expenses.length} record{expenses.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {expenses.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-white">{item.category}</p>
                      {item.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {formatDate(item.expense_date)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-white">
                      KSh {formatMoney(item.amount)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="text-xs text-slate-500 hover:text-white"
      >
        ← Back to dashboard
      </button>
    </div>
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

export default ExpensesPage;