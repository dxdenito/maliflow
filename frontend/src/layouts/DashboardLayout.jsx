import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Dashboard", path: "/dashboard", available: true },
  { label: "Income", path: "/income", available: true },
  { label: "Expenses", path: "/expenses", available: false },
  { label: "Budgets", path: "/budgets", available: false },
  { label: "Savings", path: "/savings", available: false },
  { label: "Investments", path: "/investments", available: false },
  { label: "Obligations", path: "/obligations", available: false },
];

function DashboardLayout() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="text-lg font-bold tracking-tight">
            Mali<span className="text-emerald-400">Flow</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:border-slate-700 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden w-56 shrink-0 border-r border-slate-800 lg:block">
          <nav className="sticky top-14 space-y-1 p-3">
            {navigation.map((item) => {
              if (!item.available) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-600"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wide">
                      Soon
                    </span>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-emerald-500/10 font-medium text-emerald-400"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;