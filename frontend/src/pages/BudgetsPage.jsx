
import { useCallback, useEffect, useState } from "react";

import { getExpenseCategories } from "../services/expense_category_service";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  getBudgetActual,
  updateBudget,
} from "../services/budget_service";

const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

const initialForm = {
  category_id: "",
  amount: "",
  start_date: formatDate(monthStart),
  end_date: formatDate(monthEnd),
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [actuals, setActuals] = useState({});
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [budgetData, categoryData] = await Promise.all([
        getBudgets(),
        getExpenseCategories(false),
      ]);

      setBudgets(budgetData);
      setCategories(categoryData);

      const results = await Promise.all(
        budgetData.map(async (budget) => {
          try {
            return [
              budget.id,
              await getBudgetActual(budget.id),
            ];
          } catch {
            return [budget.id, null];
          }
        })
      );

      setActuals(Object.fromEntries(results));
    } catch (err) {
      setError(err.message || "Could not load budgets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEdit(budget) {
    setEditingId(budget.id);
    setForm({
      category_id: String(budget.category_id),
      amount: String(budget.amount),
      start_date: budget.start_date,
      end_date: budget.end_date,
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.category_id) {
      setError("Choose an expense category.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSaving(true);

    const payload = {
      category_id: Number(form.category_id),
      amount: form.amount,
      start_date: form.start_date,
      end_date: form.end_date,
    };

    try {
      if (editingId) {
        await updateBudget(editingId, payload);
        setSuccess("Budget updated successfully.");
      } else {
        await createBudget(payload);
        setSuccess("Budget created successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Could not save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(budget) {
    const confirmed = window.confirm(
      "Delete this budget? Your recorded expenses will not be deleted."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteBudget(budget.id);
      setSuccess("Budget deleted.");
      await loadData();

      if (editingId === budget.id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Could not delete budget.");
    }
  }

  const activeCategories = categories.filter(
    (category) => category.is_active
  );

  const totalBudgeted = budgets.reduce(
    (sum, budget) => sum + Number(budget.amount),
    0
  );

  const totalActual = budgets.reduce(
    (sum, budget) =>
      sum + Number(actuals[budget.id]?.actual_amount || 0),
    0
  );

  const categoryName = (id) =>
    categories.find((category) => category.id === id)?.name ||
    "Unknown category";

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <p className="text-sm text-emerald-400">Financial planning</p>
        <h1 className="mt-1 text-2xl font-semibold">Budgets</h1>
        <p className="mt-1 text-sm text-slate-400">
          Plan your spending and compare it with recorded expenses.
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Budgeted</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatMoney(totalBudgeted)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sum of all listed budgets
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Actual Spending</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatMoney(totalActual)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sum of spending across listed budget periods
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-5">
          <h2 className="font-semibold">
            {editingId ? "Edit budget" : "Create a budget"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Set a spending limit for one category and period.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Expense category
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
                className="input mt-2"
              >
                <option value="">Choose category</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Budget amount (KES)
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                placeholder="15000.00"
                className="input mt-2"
              />
            </label>

            <label className="text-sm text-slate-300">
              Start date
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                required
                className="input mt-2"
              />
            </label>

            <label className="text-sm text-slate-300">
              End date
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                min={form.start_date}
                required
                className="input mt-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update budget"
                  : "Create budget"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Your budgets</h2>
          <p className="mt-1 text-sm text-slate-400">
            Spending is calculated from recorded expenses.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
            Loading budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
            <p className="font-medium">No budgets yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Create your first budget above to start tracking spending.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {budgets.map((budget) => {
              const actual = actuals[budget.id];
              const spent = Number(actual?.actual_amount || 0);
              const limit = Number(budget.amount);
              const remaining = limit - spent;
              const usage = limit > 0 ? (spent / limit) * 100 : 0;
              const overspent = spent > limit;

              return (
                <article
                  key={budget.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {categoryName(budget.category_id)}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {budget.start_date} – {budget.end_date}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        !actual
                          ? "bg-slate-800 text-slate-300"
                          : overspent
                            ? "bg-red-500/10 text-red-300"
                            : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {!actual
                        ? "Actual unavailable"
                        : overspent
                          ? "Overspent"
                          : "Within budget"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Budgeted</p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(limit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Actual</p>
                      <p className="mt-1 font-semibold">
                        {actual ? formatMoney(spent) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Remaining</p>
                      <p
                        className={`mt-1 font-semibold ${
                          overspent ? "text-red-300" : "text-emerald-300"
                        }`}
                      >
                        {actual ? formatMoney(remaining) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Budget used</p>
                      <p className="mt-1 font-semibold">
                        {actual ? `${usage.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        overspent ? "bg-red-400" : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${Math.min(usage, 100)}%`,
                      }}
                    />
                  </div>

                  {actual && overspent && (
                    <p className="mt-2 text-xs text-red-300">
                      Over budget by {formatMoney(Math.abs(remaining))}.
                    </p>
                  )}

                  <div className="mt-5 flex gap-3 border-t border-slate-800 pt-4">
                    <button
                      type="button"
                      onClick={() => startEdit(budget)}
                      className="text-sm text-emerald-300 hover:text-emerald-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(budget)}
                      className="text-sm text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}