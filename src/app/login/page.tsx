"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage("");

    if (username.trim() === "") {
      setErrorMessage("Please enter your username.");
      return;
    }

    if (password.trim() === "") {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const authData = await loginUser({
        username: username.trim(),
        password: password,
      });

      const token = authData.accessToken || authData.token;
      if (token) {
        localStorage.setItem("accessToken", token);
      }
      localStorage.setItem("user", JSON.stringify(authData));

      router.push("/products");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Invalid credentials or network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickFill() {
    setUsername("emilys");
    setPassword("emilyspass");
    setErrorMessage("");
  }

  let buttonLabel = "Sign In";
  if (isLoading) {
    buttonLabel = "Signing In...";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-xl shadow-slate-200/50 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <svg
              className="w-8 h-8 fill-none stroke-current stroke-[2.5]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 8a4 4 0 0 1-4 4H7" />
              <path d="M7 4h5a4 4 0 0 1 4 4 4 4 0 0 1-4 4H7v8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Enter your admin credentials to access the catalog
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-700 font-medium animate-in fade-in">
            {errorMessage}
          </div>
        ) : null}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              disabled={isLoading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. emilys"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {buttonLabel}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Demo Admin Account</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Quick Auto-Fill
            </button>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>User: <code className="font-mono font-semibold text-slate-800">emilys</code></span>
            <span>Pass: <code className="font-mono font-semibold text-slate-800">emilyspass</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
