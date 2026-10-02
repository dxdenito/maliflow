import { useEffect, useMemo, useState } from "react";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../services/expense_service";

import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
} from "../services/expense_category_service";

const emptyForm = {
  category_id: "",
  amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  description: "",
};

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCategories, setShowCategories] = useState(false);
const [categoryName, setCategoryName] = useState("");
const [categorySaving, setCategorySaving] = useState(false);

  async function loadExpenses() {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadCategories() {
    try {
      setCategoriesLoading(true);

      const data = await getExpenseCategories(false);

      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function handleCreateCategory(event) {
  event.preventDefault();

  const name = categoryName.trim();

  if (!name) {
    setError("Enter a category name.");
    return;
  }

  try {
    setCategorySaving(true);
    setError("");

    await createExpenseCategory({ name });

    setCategoryName("");
    await loadCategories();

    setSuccess("Expense category created.");
  } catch (err) {
    setError(err.message);
  } finally {
    setCategorySaving(false);
  }
}

async function handleToggleCategory(category) {
  try {
    setError("");
    setSuccess("");

    await updateExpenseCategory(category.id, {
      is_active: !category.is_active,
    });

    await loadCategories();

    setSuccess(
      `${category.name} ${
        category.is_active ? "deactivated" : "activated"
      }.`
    );
  } catch (err) {
    setError(err.message);
  }
}

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadExpenses(),
        loadCategories(),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(expense) {
    setEditingId(expense.id);

    setForm({
      category_id: String(expense.category_id),
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      description: expense.description || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function getCategoryName(categoryId) {
    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name || "Unknown";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.category_id) {
      setError("Please select an expense category.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    if (!form.expense_date) {
      setError("Please select an expense date.");
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      amount: Number(form.amount),
      expense_date: form.expense_date,
      description: form.description.trim() || null,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateExpense(editingId, payload);
        setSuccess("Expense updated successfully.");
      } else {
        await createExpense(payload);
        setSuccess("Expense recorded successfully.");
      }

      resetForm();
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    const confirmed = window.confirm(
      `Delete this ${getCategoryName(expense.category_id)} expense of KSh ${Number(
        expense.amount
      ).toLocaleString()}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteExpense(expense.id);

      if (editingId === expense.id) {
        resetForm();
      }

      setSuccess("Expense deleted successfully.");
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  const summary = useMemo(() => {
    const now = new Date();

    const today = now.toISOString().split("T")[0];

    const monthPrefix = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const total = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const monthTotal = expenses
      .filter((expense) =>
        expense.expense_date.startsWith(monthPrefix)
      )
      .reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );

    const todayTotal = expenses
      .filter((expense) => expense.expense_date === today)
      .reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );

    return {
      total,
      monthTotal,
      todayTotal,
    };
  }, [expenses]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Expenses
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Track where your money is going.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Form */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {editingId ? "Edit Expense" : "Record Expense"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {editingId
                ? "Update the selected expense."
                : "Add a new expense to your records."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Category
            </label>

            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              disabled={categoriesLoading || saving}
              className="input"
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories..."
                  : "Select category"}
              </option>

              {categories
                .filter((category) => category.is_active)
                .map((category) => (
                    <option
                    key={category.id}
                    value={category.id}
                    >
                    {category.name}
                    </option>
                ))}
            </select>

            {!categoriesLoading &&
              categories.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-400">
                  No active categories found.
                </p>
              )}
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Amount
            </label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              disabled={saving}
              className="input"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Date
            </label>

            <input
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              disabled={saving}
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Description
            </label>

            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional"
              disabled={saving}
              className="input"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={
                saving ||
                categoriesLoading ||
                categories.length === 0
              }
              className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Expense"
                  : "Record Expense"}
            </button>
          </div>
        </form>
      </section>


      <section className="rounded-xl border border-slate-800 bg-slate-900/50">
        <button
            type="button"
            onClick={() => setShowCategories((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
            <div>
            <h2 className="text-sm font-semibold text-white">
                Manage Categories
            </h2>

            <p className="mt-1 text-xs text-slate-500">
                Create, activate, or deactivate expense categories.
            </p>
            </div>

            <span className="text-xs text-slate-400">
            {showCategories ? "Hide" : "Show"}
            </span>
        </button>

        {showCategories && (
            <div className="border-t border-slate-800 p-4">
            <form
                onSubmit={handleCreateCategory}
                className="flex flex-col gap-3 sm:flex-row"
            >
                <input
                type="text"
                value={categoryName}
                onChange={(event) =>
                    setCategoryName(event.target.value)
                }
                placeholder="e.g. Groceries"
                className="input flex-1"
                disabled={categorySaving}
                />

                <button
                type="submit"
                disabled={categorySaving}
                className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {categorySaving ? "Adding..." : "Add Category"}
                </button>
            </form>

            <div className="mt-4 divide-y divide-slate-800">
                {categories.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                    No categories yet.
                </p>
                ) : (
                categories.map((category) => (
                    <div
                    key={category.id}
                    className="flex items-center justify-between gap-4 py-3"
                    >
                    <div className="min-w-0">
                        <p
                        className={`text-sm ${
                            category.is_active
                            ? "text-slate-200"
                            : "text-slate-500"
                        }`}
                        >
                        {category.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-600">
                        {category.is_active
                            ? "Active"
                            : "Inactive"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                        handleToggleCategory(category)
                        }
                        className={`text-xs font-medium ${
                        category.is_active
                            ? "text-red-400 hover:text-red-300"
                            : "text-emerald-400 hover:text-emerald-300"
                        }`}
                    >
                        {category.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                    </div>
                ))
                )}
            </div>
            </div>
        )}
    </section>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">
            All Recorded Expenses
          </p>

          <p className="mt-1 text-xl font-semibold text-white">
            KSh {summary.total.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">
            This Month
          </p>

          <p className="mt-1 text-xl font-semibold text-white">
            KSh {summary.monthTotal.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">
            Today
          </p>

          <p className="mt-1 text-xl font-semibold text-white">
            KSh {summary.todayTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Expenses */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Expense History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {expenses.length}{" "}
              {expenses.length === 1
                ? "expense"
                : "expenses"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-slate-400">
              No expenses recorded yet.
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Your expense history will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Category
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Description
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="transition hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 text-slate-200">
                      {getCategoryName(expense.category_id)}
                    </td>

                    <td className="max-w-xs truncate px-4 py-3 text-slate-400">
                      {expense.description || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {expense.expense_date}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-white">
                      KSh{" "}
                      {Number(
                        expense.amount
                      ).toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(expense)
                        }
                        className="mr-3 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(expense)
                        }
                        className="text-xs font-medium text-red-400 transition hover:text-red-300"
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
    </div>
  );
}

export default ExpensesPage;