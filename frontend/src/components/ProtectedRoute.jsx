import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function ProtectedRoute() {
  const {
    loading,
    isAuthenticated,
  } = useAuth();


  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">

          <h1 className="text-4xl font-bold tracking-tight">
            Mali<span className="text-emerald-400">Flow</span>
          </h1>

          <div className="mt-6 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          </div>

        </div>
      </main>
    );
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return <Outlet />;
}


export default ProtectedRoute;