import { useEffect, useState } from "react";

import {
  contributeToInvestment,
  createInvestment,
  getInvestmentTransactions,
  getInvestments,
  updateInvestment,
  updateInvestmentValuation,
  withdrawFromInvestment,
} from "../services/investment_service";


function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-KE", {
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


function getGainLoss(investment) {
  return (
    Number(investment.current_value || 0) -
    Number(investment.current_invested_capital || 0)
  );
}


function getLifetimeStats(investment, transactions) {
  const lifetimeContributions = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "contribution"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const lifetimeWithdrawals = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "withdrawal"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const realizedProfit = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "withdrawal"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.profit_component || 0),
      0
    );

  const currentGainLoss = getGainLoss(investment);

  const lifetimeProfit =
    realizedProfit + currentGainLoss;

  return {
    lifetimeContributions,
    lifetimeWithdrawals,
    realizedProfit,
    currentGainLoss,
    lifetimeProfit,
  };
}


function transactionLabel(type) {
  switch (type) {
    case "contribution":
      return "Contribution";

    case "valuation":
      return "Valuation";

    case "withdrawal":
      return "Withdrawal";

    default:
      return type;
  }
}


function transactionAmount(transaction) {
  if (transaction.transaction_type === "valuation") {
    return Number(transaction.amount || 0);
  }

  return Number(transaction.amount || 0);
}


export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [selectedInvestment, setSelectedInvestment] =
    useState(null);

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [form, setForm] = useState({
    name: "",
    investment_type: "mmf",
    principal_amount: "",
    investment_date: new Date()
      .toISOString()
      .split("T")[0],
    maturity_date: "",
    description: "",
  });

  const [amount, setAmount] = useState("");

  const [valuation, setValuation] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    investment_type: "mmf",
    maturity_date: "",
    description: "",
  });


  async function loadInvestments() {
    try {
      setError("");

      const data = await getInvestments();

      setInvestments(data);

      if (
        selectedInvestment &&
        !data.some(
          (investment) =>
            investment.id === selectedInvestment.id
        )
      ) {
        setSelectedInvestment(null);
      }
    } catch (err) {
      setError(
        err.message || "Failed to load investments."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadInvestments();
  }, []);


  async function loadTransactions(investment) {
    try {
      const data =
        await getInvestmentTransactions(
          investment.id
        );

      setSelectedInvestment(investment);
      setTransactions(data);
    } catch (err) {
      setError(
        err.message || "Failed to load investment history."
      );
    }
  }


  function closeModals() {
    setShowCreate(false);
    setShowContribute(false);
    setShowValuation(false);
    setShowWithdraw(false);
    setShowEdit(false);
    setShowHistory(false);

    setAmount("");
    setValuation("");
  }


  function openContribute(investment) {
    setSelectedInvestment(investment);
    setAmount("");
    setShowContribute(true);
  }


  function openValuation(investment) {
    setSelectedInvestment(investment);
    setValuation(
      Number(investment.current_value || 0).toFixed(2)
    );
    setShowValuation(true);
  }


  function openWithdraw(investment) {
    setSelectedInvestment(investment);
    setAmount("");
    setShowWithdraw(true);
  }


  function openEdit(investment) {
    setSelectedInvestment(investment);

    setEditForm({
      name: investment.name || "",
      investment_type:
        investment.investment_type || "mmf",
      maturity_date:
        investment.maturity_date || "",
      description:
        investment.description || "",
    });

    setShowEdit(true);
  }


  async function handleCreate(event) {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");

      await createInvestment({
        ...form,
        maturity_date:
          form.maturity_date || null,
        description:
          form.description || null,
      });

      setForm({
        name: "",
        investment_type: "mmf",
        principal_amount: "",
        investment_date: new Date()
          .toISOString()
          .split("T")[0],
        maturity_date: "",
        description: "",
      });

      closeModals();
      await loadInvestments();
    } catch (err) {
      setError(
        err.message || "Failed to create investment."
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleContribution(event) {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");

      await contributeToInvestment(
        selectedInvestment.id,
        Number(amount)
      );

      closeModals();
      await loadInvestments();
    } catch (err) {
      setError(
        err.message ||
          "Failed to add investment contribution."
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleValuation(event) {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");

      await updateInvestmentValuation(
        selectedInvestment.id,
        Number(valuation)
      );

      closeModals();
      await loadInvestments();
    } catch (err) {
      setError(
        err.message ||
          "Failed to update investment valuation."
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleWithdraw(event) {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");

      await withdrawFromInvestment(
        selectedInvestment.id,
        Number(amount)
      );

      closeModals();
      await loadInvestments();
    } catch (err) {
      setError(
        err.message ||
          "Failed to withdraw from investment."
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleEdit(event) {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");

      await updateInvestment(
        selectedInvestment.id,
        {
          ...editForm,
          maturity_date:
            editForm.maturity_date || null,
          description:
            editForm.description || null,
        }
      );

      closeModals();
      await loadInvestments();
    } catch (err) {
      setError(
        err.message || "Failed to update investment."
      );
    } finally {
      setActionLoading(false);
    }
  }


  async function handleHistory(investment) {
    try {
      setError("");

      await loadTransactions(investment);

      setShowHistory(true);
    } catch {
      // loadTransactions already handles the error.
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


  const totalCurrentValue = investments.reduce(
    (total, investment) =>
      total + Number(investment.current_value || 0),
    0
  );

  const totalInvestedCapital = investments.reduce(
    (total, investment) =>
      total +
      Number(
        investment.current_invested_capital || 0
      ),
    0
  );

  const totalGainLoss =
    totalCurrentValue - totalInvestedCapital;


  return (
    <div className="space-y-5">

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}


      {/* Summary */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          label="Current Value"
          value={`KSh ${formatMoney(
            totalCurrentValue
          )}`}
        />

        <SummaryCard
          label="Invested Capital"
          value={`KSh ${formatMoney(
            totalInvestedCapital
          )}`}
        />

        <SummaryCard
          label="Gain / Loss"
          value={`KSh ${formatMoney(
            totalGainLoss
          )}`}
          valueClass={
            totalGainLoss >= 0
              ? "text-emerald-400"
              : "text-red-400"
          }
        />

        <SummaryCard
          label="Investment Accounts"
          value={investments.length}
        />

      </section>


      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-lg font-semibold text-white">
            Investments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage investment accounts, contributions,
            valuations and withdrawals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          Add Investment
        </button>

      </section>


      {/* Investments */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">
            Investment Accounts
          </h2>
        </div>


        {investments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No investment accounts yet.
          </div>
        ) : (

          <div className="divide-y divide-slate-800">

            {investments.map((investment) => {
              const gainLoss =
                getGainLoss(investment);

              return (
                <div
                  key={investment.id}
                  className="px-4 py-4"
                >

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-medium text-white">
                          {investment.name}
                        </h3>

                        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                          {investment.investment_type.toUpperCase()}
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Started{" "}
                        {formatDate(
                          investment.investment_date
                        )}
                      </p>

                    </div>


                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">

                      <Metric
                        label="Value"
                        value={`KSh ${formatMoney(
                          investment.current_value
                        )}`}
                      />

                      <Metric
                        label="Capital"
                        value={`KSh ${formatMoney(
                          investment.current_invested_capital
                        )}`}
                      />

                      <Metric
                        label="Gain / Loss"
                        value={`KSh ${formatMoney(
                          gainLoss
                        )}`}
                        valueClass={
                          gainLoss >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      />

                      <Metric
                        label="Initial"
                        value={`KSh ${formatMoney(
                          investment.original_investment
                        )}`}
                      />

                    </div>


                    <div className="flex flex-wrap gap-2">

                      <ActionButton
                        onClick={() =>
                          openContribute(
                            investment
                          )
                        }
                      >
                        Contribute
                      </ActionButton>

                      <ActionButton
                        onClick={() =>
                          openValuation(
                            investment
                          )
                        }
                      >
                        Value
                      </ActionButton>

                      <ActionButton
                        onClick={() =>
                          openWithdraw(
                            investment
                          )
                        }
                      >
                        Withdraw
                      </ActionButton>

                      <ActionButton
                        onClick={() =>
                          openEdit(investment)
                        }
                      >
                        Edit
                      </ActionButton>

                      <ActionButton
                        onClick={() =>
                          handleHistory(
                            investment
                          )
                        }
                      >
                        History
                      </ActionButton>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>


      {/* Create */}
      {showCreate && (
        <Modal
          title="Add Investment"
          onClose={closeModals}
        >
          <form
            onSubmit={handleCreate}
            className="space-y-4"
          >

            <Input
              label="Investment Name"
              value={form.name}
              onChange={(value) =>
                setForm({
                  ...form,
                  name: value,
                })
              }
              required
            />

            <Select
              label="Investment Type"
              value={form.investment_type}
              onChange={(value) =>
                setForm({
                  ...form,
                  investment_type: value,
                })
              }
              options={[
                ["stock", "Stock"],
                ["bond", "Bond"],
                ["mmf", "MMF"],
                ["sacco", "SACCO"],
                ["crypto", "Crypto"],
                ["business", "Business"],
                ["real_estate", "Real Estate"],
                ["other", "Other"],
              ]}
            />

            <Input
              label="Initial Contribution"
              type="number"
              min="0.01"
              step="0.01"
              value={form.principal_amount}
              onChange={(value) =>
                setForm({
                  ...form,
                  principal_amount: value,
                })
              }
              required
            />

            <Input
              label="Investment Date"
              type="date"
              value={form.investment_date}
              onChange={(value) =>
                setForm({
                  ...form,
                  investment_date: value,
                })
              }
              required
            />

            <Input
              label="Maturity Date"
              type="date"
              value={form.maturity_date}
              onChange={(value) =>
                setForm({
                  ...form,
                  maturity_date: value,
                })
              }
            />

            <Textarea
              label="Description"
              value={form.description}
              onChange={(value) =>
                setForm({
                  ...form,
                  description: value,
                })
              }
            />

            <ModalActions
              onCancel={closeModals}
              loading={actionLoading}
              submitText="Create Investment"
            />

          </form>
        </Modal>
      )}


      {/* Contribution */}
      {showContribute && selectedInvestment && (
        <Modal
          title={`Contribute to ${selectedInvestment.name}`}
          onClose={closeModals}
        >
          <form
            onSubmit={handleContribution}
            className="space-y-4"
          >

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm">
              <p className="text-slate-500">
                Current Value
              </p>

              <p className="mt-1 font-medium text-white">
                KSh{" "}
                {formatMoney(
                  selectedInvestment.current_value
                )}
              </p>
            </div>

            <Input
              label="Contribution Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={setAmount}
              required
            />

            <ModalActions
              onCancel={closeModals}
              loading={actionLoading}
              submitText="Add Contribution"
            />

          </form>
        </Modal>
      )}


      {/* Valuation */}
      {showValuation && selectedInvestment && (
        <Modal
          title={`Update ${selectedInvestment.name} Value`}
          onClose={closeModals}
        >
          <form
            onSubmit={handleValuation}
            className="space-y-4"
          >

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Current Value
                </span>

                <span className="text-white">
                  KSh{" "}
                  {formatMoney(
                    selectedInvestment.current_value
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-slate-500">
                  Invested Capital
                </span>

                <span className="text-white">
                  KSh{" "}
                  {formatMoney(
                    selectedInvestment.current_invested_capital
                  )}
                </span>
              </div>

            </div>

            <Input
              label="New Current Value"
              type="number"
              min="0"
              step="0.01"
              value={valuation}
              onChange={setValuation}
              required
            />

            <p className="text-xs text-slate-500">
              This changes the investment valuation only.
              It does not move money in or out of Available
              Funds.
            </p>

            <ModalActions
              onCancel={closeModals}
              loading={actionLoading}
              submitText="Update Value"
            />

          </form>
        </Modal>
      )}


      {/* Withdrawal */}
      {showWithdraw && selectedInvestment && (
        <Modal
          title={`Withdraw from ${selectedInvestment.name}`}
          onClose={closeModals}
        >
          <form
            onSubmit={handleWithdraw}
            className="space-y-4"
          >

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Current Value
                </span>

                <span className="text-white">
                  KSh{" "}
                  {formatMoney(
                    selectedInvestment.current_value
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-slate-500">
                  Invested Capital
                </span>

                <span className="text-white">
                  KSh{" "}
                  {formatMoney(
                    selectedInvestment.current_invested_capital
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-slate-500">
                  Current Gain
                </span>

                <span
                  className={
                    getGainLoss(
                      selectedInvestment
                    ) >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                >
                  KSh{" "}
                  {formatMoney(
                    getGainLoss(
                      selectedInvestment
                    )
                  )}
                </span>
              </div>

            </div>

            <Input
              label="Withdrawal Amount"
              type="number"
              min="0.01"
              max={selectedInvestment.current_value}
              step="0.01"
              value={amount}
              onChange={setAmount}
              required
            />

            <p className="text-xs text-slate-500">
              Withdrawals consume current profit first,
              then invested capital.
            </p>

            <ModalActions
              onCancel={closeModals}
              loading={actionLoading}
              submitText="Withdraw Funds"
            />

          </form>
        </Modal>
      )}


      {/* Edit */}
      {showEdit && selectedInvestment && (
        <Modal
          title={`Edit ${selectedInvestment.name}`}
          onClose={closeModals}
        >
          <form
            onSubmit={handleEdit}
            className="space-y-4"
          >

            <Input
              label="Investment Name"
              value={editForm.name}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  name: value,
                })
              }
              required
            />

            <Select
              label="Investment Type"
              value={editForm.investment_type}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  investment_type: value,
                })
              }
              options={[
                ["stock", "Stock"],
                ["bond", "Bond"],
                ["mmf", "MMF"],
                ["sacco", "SACCO"],
                ["crypto", "Crypto"],
                ["business", "Business"],
                ["real_estate", "Real Estate"],
                ["other", "Other"],
              ]}
            />

            <Input
              label="Maturity Date"
              type="date"
              value={editForm.maturity_date}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  maturity_date: value,
                })
              }
            />

            <Textarea
              label="Description"
              value={editForm.description}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  description: value,
                })
              }
            />

            <ModalActions
              onCancel={closeModals}
              loading={actionLoading}
              submitText="Save Changes"
            />

          </form>
        </Modal>
      )}


      {/* History */}
      {showHistory && selectedInvestment && (
        <Modal
          title={`${selectedInvestment.name} History`}
          onClose={closeModals}
          wide
        >

          <div className="grid gap-3 sm:grid-cols-3">

            <SummaryCard
              label="Current Value"
              value={`KSh ${formatMoney(
                selectedInvestment.current_value
              )}`}
            />

            <SummaryCard
              label="Current Capital"
              value={`KSh ${formatMoney(
                selectedInvestment.current_invested_capital
              )}`}
            />

            <SummaryCard
              label="Current Gain / Loss"
              value={`KSh ${formatMoney(
                getGainLoss(
                  selectedInvestment
                )
              )}`}
              valueClass={
                getGainLoss(
                  selectedInvestment
                ) >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            />

          </div>


          {transactions.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              {(() => {
                const stats =
                  getLifetimeStats(
                    selectedInvestment,
                    transactions
                  );

                return (
                  <>
                    <HistoryStat
                      label="Lifetime Contributions"
                      value={stats.lifetimeContributions}
                    />

                    <HistoryStat
                      label="Lifetime Withdrawals"
                      value={stats.lifetimeWithdrawals}
                    />

                    <HistoryStat
                      label="Lifetime Profit"
                      value={stats.lifetimeProfit}
                      valueClass={
                        stats.lifetimeProfit >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    />
                  </>
                );
              })()}

            </div>
          )}


          <div className="mt-5 overflow-x-auto">

            {transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No transactions found.
              </p>
            ) : (
              <table className="w-full min-w-[760px] text-left text-sm">

                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500">

                    <th className="px-3 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Type
                    </th>

                    <th className="px-3 py-3 text-right font-medium">
                      Amount
                    </th>

                    <th className="px-3 py-3 text-right font-medium">
                      Capital
                    </th>

                    <th className="px-3 py-3 text-right font-medium">
                      Profit
                    </th>

                    <th className="px-3 py-3 text-right font-medium">
                      Value After
                    </th>

                    <th className="px-3 py-3 text-right font-medium">
                      Capital After
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {transactions.map(
                    (transaction) => {

                      const amount =
                        transactionAmount(
                          transaction
                        );

                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-slate-800/70 last:border-0"
                        >

                          <td className="px-3 py-3 text-slate-400">
                            {new Date(
                              transaction.occurred_at
                            ).toLocaleDateString(
                              "en-KE",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>

                          <td className="px-3 py-3 text-white">
                            {transactionLabel(
                              transaction.transaction_type
                            )}
                          </td>

                          <td
                            className={`px-3 py-3 text-right ${
                              transaction.transaction_type ===
                              "valuation"
                                ? amount >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                                : "text-white"
                            }`}
                          >
                            {transaction.transaction_type ===
                            "valuation"
                              ? amount >= 0
                                ? "+"
                                : ""
                              : ""}

                            KSh{" "}
                            {formatMoney(
                              amount
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-slate-400">
                            KSh{" "}
                            {formatMoney(
                              transaction.capital_component
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-emerald-400">
                            KSh{" "}
                            {formatMoney(
                              transaction.profit_component
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-white">
                            KSh{" "}
                            {formatMoney(
                              transaction.value_after
                            )}
                          </td>

                          <td className="px-3 py-3 text-right text-slate-400">
                            KSh{" "}
                            {formatMoney(
                              transaction.capital_after
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>
            )}

          </div>

        </Modal>
      )}

    </div>
  );
}


function SummaryCard({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3.5">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}


function Metric({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-medium ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}


function HistoryStat({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-medium ${valueClass}`}
      >
        KSh {formatMoney(value)}
      </p>

    </div>
  );
}


function ActionButton({
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
    >
      {children}
    </button>
  );
}


function Modal({
  title,
  onClose,
  children,
  wide = false,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

      <div
        className={`w-full ${
          wide ? "max-w-6xl" : "max-w-lg"
        } max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900`}
      >

        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">

          <h2 className="text-sm font-semibold text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>

        </div>

        <div className="p-4">
          {children}
        </div>

      </div>

    </div>
  );
}


function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
  required = false,
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        min={min}
        max={max}
        step={step}
        required={required}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
      />

    </label>
  );
}


function Select({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
      >

        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}

      </select>

    </label>
  );
}


function Textarea({
  label,
  value,
  onChange,
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs text-slate-400">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
      />

    </label>
  );
}


function ModalActions({
  onCancel,
  loading,
  submitText,
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : submitText}
      </button>

    </div>
  );
}