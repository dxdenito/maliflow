import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function SplashPage() {
  const navigate = useNavigate();

  const {
    loading,
    isAuthenticated,
  } = useAuth();


  useEffect(() => {
    if (loading) {
      return;
    }

    if (isAuthenticated) {
      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

    navigate("/login", {
      replace: true,
    });
  }, [
    loading,
    isAuthenticated,
    navigate,
  ]);


  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">

        <h1 className="text-5xl font-bold tracking-tight">
          Mali<span className="text-emerald-400">Flow</span>
        </h1>

        <p className="mt-4 text-slate-400">
          Take control of your money.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
        </div>

      </div>
    </main>
  );
}


export default SplashPage;