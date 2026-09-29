import { Outlet } from "react-router-dom";


function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          <div className="text-xl font-bold tracking-tight">
            Mali<span className="text-emerald-400">Flow</span>
          </div>

          <div className="text-sm text-slate-400">
            Dashboard
          </div>

        </div>
      </header>


      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}


export default DashboardLayout;