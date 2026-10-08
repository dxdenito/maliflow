import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getMajorPurchase,
  getFinancingAgreementForPurchase,
  createFinancingAgreement,
  getPurchasePayments,
} from "../services/majorPurchaseService";

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
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] || styles.active
      }`}
    >
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

function SummaryCard({ label, value, valueClass = "text-white" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

const emptyFinancingForm = {
  lender_name: "",
  agreement_date: new Date().toISOString().split("T")[0],
  deposit_amount: "",
  total_payable: "",
  expected_term_months: "",
  expected_payment_amount: "",
  payment_frequency: "monthly",
  first_due_date: "",
  custom_schedule_description: "",
};

export default function MajorPurchaseDetailsPage() {
  const { purchaseId } = useParams();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [savingFinancing, setSavingFinancing] = useState(false);
  const [financingForm, setFinancingForm] = useState(emptyFinancingForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const purchaseResponse = await getMajorPurchase(purchaseId);
      setPurchase(purchaseResponse);

      const paymentsResponse = await getPurchasePayments(purchaseId);
      setPayments(paymentsResponse || []);

      if (purchaseResponse.purchase_type === "financed") {
        try {
          const agreementResponse =
            await getFinancingAgreementForPurchase(purchaseId);

          setAgreement(agreementResponse);
        } catch (err) {
          if (err.response?.status === 404) {
            setAgreement(null);
          } else {
            throw err;
          }
        }
      } else {
        setAgreement(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load purchase details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [purchaseId]);

  const totalPaid = useMemo(() => {
    return payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );
  }, [payments]);

  const remaining = useMemo(() => {
    if (!purchase) return 0;

    return Math.max(
      Number(purchase.purchase_price || 0) - totalPaid,
      0
    );
  }, [purchase, totalPaid]);

  const progress = useMemo(() => {
    if (!purchase || !Number(purchase.purchase_price)) return 0;

    return Math.min(
      (totalPaid / Number(purchase.purchase_price)) * 100,
      100
    );
  }, [purchase, totalPaid]);

  const handleFinancingChange = (event) => {
    const { name, value } = event.target;

    setFinancingForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateFinancing = async (event) => {
    event.preventDefault();

    try {
      setSavingFinancing(true);
      setError("");

      const deposit = Number(financingForm.deposit_amount || 0);
      const financedAmount =
        Number(purchase.purchase_price) - deposit;

      await createFinancingAgreement({
        purchase_id: purchase.id,
        lender_name: financingForm.lender_name.trim(),
        agreement_date: financingForm.agreement_date,
        deposit_amount: deposit,
        financed_amount: financedAmount,
        total_payable: financingForm.total_payable
          ? Number(financingForm.total_payable)
          : null,
        expected_term_months: financingForm.expected_term_months
          ? Number(financingForm.expected_term_months)
          : null,
        expected_payment_amount: financingForm.expected_payment_amount
          ? Number(financingForm.expected_payment_amount)
          : null,
        payment_frequency: financingForm.payment_frequency || null,
        first_due_date: financingForm.first_due_date || null,
        custom_schedule_description:
          financingForm.custom_schedule_description.trim() || null,
      });

      setShowFinancingModal(false);
      setFinancingForm({
        ...emptyFinancingForm,
        agreement_date: new Date().toISOString().split("T")[0],
      });

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to create financing agreement."
      );
    } finally {
      setSavingFinancing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-400">Loading purchase...</p>
      </div>
    );
  }

  if (error && !purchase) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-sm text-red-400">{error}</p>

        <button
          type="button"
          onClick={() => navigate("/major-purchases")}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
        >
          Back to Major Purchases
        </button>
      </div>
    );
  }

  if (!purchase) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/major-purchases")}
            className="mb-3 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Major Purchases
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">
              {purchase.name}
            </h1>

            <StatusBadge status={purchase.status} />
            <TypeBadge type={purchase.purchase_type} />
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Purchased on {formatDate(purchase.purchase_date)}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Purchase Price"
          value={formatMoney(purchase.purchase_price)}
        />

        <SummaryCard
          label="Total Paid"
          value={formatMoney(totalPaid)}
          valueClass="text-emerald-400"
        />

        <SummaryCard
          label="Remaining"
          value={formatMoney(remaining)}
          valueClass={
            remaining > 0 ? "text-amber-400" : "text-emerald-400"
          }
        />

        <SummaryCard
          label="Progress"
          value={`${progress.toFixed(1)}%`}
        />
      </div>

      {/* Payment Progress */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-white">
            Payment Progress
          </p>

          <p className="text-sm text-slate-400">
            {formatMoney(totalPaid)} /{" "}
            {formatMoney(purchase.purchase_price)}
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Purchase Information */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">
          Purchase Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Purchase Type</p>

            <p className="mt-1 text-sm text-slate-200">
              {purchase.purchase_type === "financed"
                ? "Financed"
                : "Cash"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Purchase Date</p>

            <p className="mt-1 text-sm text-slate-200">
              {formatDate(purchase.purchase_date)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Status</p>

            <div className="mt-1">
              <StatusBadge status={purchase.status} />
            </div>
          </div>
        </div>

        {purchase.description && (
          <div className="mt-5 border-t border-slate-800 pt-5">
            <p className="text-xs text-slate-500">Description</p>

            <p className="mt-1 text-sm leading-6 text-slate-300">
              {purchase.description}
            </p>
          </div>
        )}
      </div>

      {/* Financing */}
      {purchase.purchase_type === "financed" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Financing Agreement
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {agreement
                  ? "Financing details for this purchase."
                  : "No financing agreement has been created yet."}
              </p>
            </div>

            {!agreement && purchase.status === "active" && (
              <button
                type="button"
                onClick={() => setShowFinancingModal(true)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                Set Up Financing
              </button>
            )}
          </div>

          {agreement && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Lender</p>

                <p className="mt-1 text-sm text-slate-200">
                  {agreement.lender_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Agreement Date</p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(agreement.agreement_date)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Deposit</p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatMoney(agreement.deposit_amount)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Financed Amount
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatMoney(agreement.financed_amount)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Total Payable</p>

                <p className="mt-1 text-sm text-slate-200">
                  {agreement.total_payable
                    ? formatMoney(agreement.total_payable)
                    : "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Expected Payment
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {agreement.expected_payment_amount
                    ? formatMoney(
                        agreement.expected_payment_amount
                      )
                    : "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Payment Frequency
                </p>

                <p className="mt-1 text-sm capitalize text-slate-200">
                  {agreement.payment_frequency || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  First Due Date
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(agreement.first_due_date)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Agreement Status
                </p>

                <p className="mt-1 text-sm capitalize text-slate-200">
                  {agreement.status}
                </p>
              </div>

              {agreement.custom_schedule_description && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs text-slate-500">
                    Custom Schedule
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {agreement.custom_schedule_description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Payment History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {payments.length} payment
              {payments.length === 1 ? "" : "s"} recorded
            </p>
          </div>

          {purchase.status === "active" && (
            <button
              type="button"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              + Add Payment
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">
              No payments have been recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reference
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {formatDate(payment.payment_date)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs capitalize text-slate-300">
                        {payment.payment_type?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {formatMoney(payment.amount)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-400">
                      {payment.reference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financing Modal */}
      {showFinancingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Set Up Financing
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {purchase.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFinancingModal(false)}
                className="text-2xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateFinancing}
              className="space-y-6 p-6"
            >
              {/* Basic Details */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Lender
                  </label>

                  <input
                    type="text"
                    name="lender_name"
                    value={financingForm.lender_name}
                    onChange={handleFinancingChange}
                    required
                    placeholder="e.g. ABC Bank"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Agreement Date
                  </label>

                  <input
                    type="date"
                    name="agreement_date"
                    value={financingForm.agreement_date}
                    onChange={handleFinancingChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Purchase Price
                  </label>

                  <input
                    type="text"
                    value={`KSh ${Number(
                      purchase.purchase_price
                    ).toLocaleString("en-KE")}`}
                    disabled
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Deposit
                  </label>

                  <input
                    type="number"
                    name="deposit_amount"
                    value={financingForm.deposit_amount}
                    onChange={handleFinancingChange}
                    min="0"
                    max={purchase.purchase_price}
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Calculated Financing */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Calculated financed amount
                  </span>

                  <span className="text-lg font-semibold text-emerald-400">
                    {formatMoney(
                      Number(purchase.purchase_price) -
                        Number(
                          financingForm.deposit_amount || 0
                        )
                    )}
                  </span>
                </div>
              </div>

              {/* Payment Expectations */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Total Payable
                  </label>

                  <input
                    type="number"
                    name="total_payable"
                    value={financingForm.total_payable}
                    onChange={handleFinancingChange}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Expected Term (months)
                  </label>

                  <input
                    type="number"
                    name="expected_term_months"
                    value={financingForm.expected_term_months}
                    onChange={handleFinancingChange}
                    min="1"
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Expected Payment
                  </label>

                  <input
                    type="number"
                    name="expected_payment_amount"
                    value={
                      financingForm.expected_payment_amount
                    }
                    onChange={handleFinancingChange}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Payment Frequency
                  </label>

                  <select
                    name="payment_frequency"
                    value={financingForm.payment_frequency}
                    onChange={handleFinancingChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    First Due Date
                  </label>

                  <input
                    type="date"
                    name="first_due_date"
                    value={financingForm.first_due_date}
                    onChange={handleFinancingChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Custom Schedule */}
              {financingForm.payment_frequency === "custom" && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Custom Schedule
                  </label>

                  <textarea
                    name="custom_schedule_description"
                    value={
                      financingForm.custom_schedule_description
                    }
                    onChange={handleFinancingChange}
                    rows="3"
                    placeholder="Describe the expected payment schedule..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setShowFinancingModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingFinancing}
                  className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingFinancing
                    ? "Saving..."
                    : "Create Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}