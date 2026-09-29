import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(form);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block text-4xl font-bold tracking-tight"
          >
            Mali<span className="text-emerald-400">Flow</span>
          </Link>

          <p className="mt-3 text-slate-400">
            Welcome back. Let's manage your money.
          </p>
        </div>


        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:p-8">

          <h1 className="text-2xl font-semibold">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter your credentials to continue.
          </p>


          {error && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                placeholder="you@example.com"
              />
            </div>


            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Enter your password"
              />
            </div>


            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>

          </form>


          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              Create one
            </Link>
          </div>

        </div>


        <p className="mt-6 text-center text-xs text-slate-600">
          Your financial data belongs to you.
        </p>

      </div>
    </main>
  );
}


export default LoginPage;