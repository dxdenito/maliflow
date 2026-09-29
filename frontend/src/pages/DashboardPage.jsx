import { useAuth } from "../context/AuthContext";


function DashboardPage() {
  const {
    user,
    logout,
  } = useAuth();


  async function handleLogout() {
    await logout();
  }


  return (
    <div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name}
          </h1>

          <p className="mt-2 text-slate-400">
            Here's what's happening with your money.
          </p>
        </div>


        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-400 hover:text-red-400"
        >
          Logout
        </button>
      </div>


      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Available Funds
          </p>

          <p className="mt-2 text-2xl font-bold">
            KSh 0.00
          </p>
        </div>


        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Savings
          </p>

          <p className="mt-2 text-2xl font-bold">
            KSh 0.00
          </p>
        </div>


        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Investments
          </p>

          <p className="mt-2 text-2xl font-bold">
            KSh 0.00
          </p>
        </div>


        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Obligations
          </p>

          <p className="mt-2 text-2xl font-bold">
            KSh 0.00
          </p>
        </div>

      </div>

    </div>
  );
}


export default DashboardPage;