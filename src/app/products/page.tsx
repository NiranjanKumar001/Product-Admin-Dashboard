"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if the user has an authentication token in localStorage
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    // If no token is found, redirect to the login page
    if (!token) {
      router.push("/login");
      return;
    }

    // If token exists, allow access to the products page
    const timer = setTimeout(() => {
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  // While checking if a token exists, display a simple loading message
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Checking authentication...
        </p>
      </div>
    );
  }

  // Prevent showing protected content if authentication failed
  if (!isAuthenticated) {
    return null;
  }

  function handleLogout() {
    // Remove saved authentication data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to the login page
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Products
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage your store inventory and view product details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          Logout
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Product Table Placeholder
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The product list, filters, search, and pagination will be built here in future steps.
        </p>
      </div>
    </div>
  );
}
