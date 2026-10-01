import { useEffect, useState } from "react";

import { getFinancialPosition } from "../services/financial_position_service";
import { getIncome } from "../services/income_service";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  const [position, setPosition] = useState(null);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [positionData, incomeData] = await Promise.all([
        getFinancialPosition(),
        getIncome(),
      ]);

      setPosition(positionData);
      setIncome(incomeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  const recentIncome = income.slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here's where your money currently stands.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PositionCard
          label="Available Funds"
          value={position.available_funds}
          accent="emerald"
        />

        <PositionCard
          label="Total In"
          value={position.total_in}
        />

        <PositionCard
          label="Total Out"
          value={position.total_out}
        />

        <PositionCard
          label="Net Movement"
          value={position.net_movement}
          accent={position.net_movement >= 0 ? "emerald" : "red"}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Recent Income</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Latest money received
              </p>
            </div>
          </div>

          {recentIncome.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No income recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentIncome.map((item) => {
                const early = item.received_date < item.intended_period;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.source}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(item.received_date)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-emerald-400">
                        + KSh {formatMoney(item.amount)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {early ? "Reserved" : "Available"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold">Financial Snapshot</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Current position
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            <SnapshotRow
              label="Money available"
              value={position.available_funds}
            />

            <SnapshotRow
              label="Money received"
              value={position.total_in}
            />

            <SnapshotRow
              label="Money moved out"
              value={position.total_out}
            />

            <SnapshotRow
              label="Net movement"
              value={position.net_movement}
              emphasize
            />
          </div>
        </section>
      </div>
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

function SnapshotRow({ label, value, emphasize }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span className="text-sm text-slate-400">{label}</span>

      <span
        className={`text-sm font-medium ${
          emphasize ? "text-emerald-400" : "text-white"
        }`}
      >
        KSh {formatMoney(value)}
      </span>
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
  });
}

export default DashboardPage;