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

    // Prevent duplicate requests if already loading
    if (isLoading) {
      return;
    }

    // Reset previous error message before validating
    setErrorMessage("");

    // Validation rule 1: Username cannot be blank
    if (username.trim() === "") {
      setErrorMessage("Please enter your username.");
      return;
    }

    // Validation rule 2: Password cannot be blank
    if (password.trim() === "") {
      setErrorMessage("Please enter your password.");
      return;
    }

    // Set loading state to true
    setIsLoading(true);

    try {
      // Call the separated API service
      const authData = await loginUser({
        username: username.trim(),
        password: password,
      });

      // Temporarily store authentication information in localStorage
      const token = authData.accessToken || authData.token;
      if (token) {
        localStorage.setItem("accessToken", token);
      }
      localStorage.setItem("user", JSON.stringify(authData));

      // Redirect user to the products page
      router.push("/products");
    } catch (error: any) {
      // Extract error message from server response if available
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Invalid credentials or network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }


  // Determine button label using simple if statement
  let buttonLabel = "Sign in";
  if (isLoading) {
    buttonLabel = "Signing in...";
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <span className="text-xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your credentials to access the admin dashboard
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 dark:disabled:bg-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 dark:disabled:bg-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {buttonLabel}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            DummyJSON Test Credentials:
          </p>
          <p className="mt-1">
            Username: <code className="font-mono font-semibold">emilys</code>
          </p>
          <p>
            Password: <code className="font-mono font-semibold">emilyspass</code>
          </p>
        </div>
      </div>
    </div>
  );
}

