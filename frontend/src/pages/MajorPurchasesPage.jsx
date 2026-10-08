import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  createMajorPurchase,
  getMajorPurchases,
} from "../services/majorPurchaseService";

const emptyForm = {
  name: "",
  purchase_price: "",
  purchase_date: new Date().toISOString().split("T")[0],
  purchase_type: "cash",
  description: "",
};

function formatMoney(value) {
  return `KSh ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status] || styles.active}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300">
      {type === "financed" ? "Financed" : "Cash"}
    </span>
  );
}

export default function MajorPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const navigate = useNavigate();

  const loadPurchases = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await getMajorPurchases();
    setPurchases(response || []);
  } catch (err) {
    setError(err.response?.data?.detail || "Failed to load major purchases.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadPurchases();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createMajorPurchase({
        name: form.name.trim(),
        purchase_price: Number(form.purchase_price),
        purchase_date: form.purchase_date,
        purchase_type: form.purchase_type,
        description: form.description.trim() || null,
      });

      setForm(emptyForm);
      setShowModal(false);
      await loadPurchases();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create major purchase.");
    } finally {
      setSaving(false);
    }
  };

  const totalValue = purchases.reduce(
    (total, purchase) => total + Number(purchase.purchase_price || 0),
    0,
  );

  const activePurchases = purchases.filter(
    (purchase) => purchase.status === "active",
  );

  const completedPurchases = purchases.filter(
    (purchase) => purchase.status === "completed",
  );

  const financedPurchases = purchases.filter(
    (purchase) => purchase.purchase_type === "financed",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Major Purchases</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track large purchases, financing and payment progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setError("");
            setShowModal(true);
          }}
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          + Add Purchase
        </button>
      </div>

      {error && !showModal && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Total Purchase Value</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {formatMoney(totalValue)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Active Purchases</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {activePurchases.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Completed</p>
          <p className="mt-2 text-xl font-semibold text-emerald-400">
            {completedPurchases.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-sm text-slate-400">Financed</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {financedPurchases.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Purchases</h2>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            Loading purchases...
          </div>
        ) : purchases.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-300">No major purchases yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first major purchase to start tracking it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Purchase</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    onClick={() => navigate(`/major-purchases/${purchase.id}`)}
                    className="cursor-pointer border-b border-slate-800 hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{purchase.name}</p>

                      {purchase.description && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {purchase.description}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-200">
                      {formatMoney(purchase.purchase_price)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {formatDate(purchase.purchase_date)}
                    </td>

                    <td className="px-5 py-4">
                      <TypeBadge type={purchase.purchase_type} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={purchase.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">Add Major Purchase</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Record the purchase before adding payments or financing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Purchase Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Toyota Probox"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Purchase Price
                  </label>

                  <input
                    type="number"
                    name="purchase_price"
                    value={form.purchase_price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Purchase Date
                  </label>

                  <input
                    type="date"
                    name="purchase_date"
                    value={form.purchase_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Purchase Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-xl border p-4 transition ${form.purchase_type === "cash" ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-950"}`}>
                    <input
                      type="radio"
                      name="purchase_type"
                      value="cash"
                      checked={form.purchase_type === "cash"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="block font-medium text-white">Cash</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Paid directly from your funds.
                    </span>
                  </label>

                  <label className={`cursor-pointer rounded-xl border p-4 transition ${form.purchase_type === "financed" ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-950"}`}>
                    <input
                      type="radio"
                      name="purchase_type"
                      value="financed"
                      checked={form.purchase_type === "financed"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="block font-medium text-white">Financed</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Paid through a financing agreement.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional notes..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

