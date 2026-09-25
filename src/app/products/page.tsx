"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, Product } from "@/services/products";

export default function ProductsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Products and status state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

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

  useEffect(() => {
    // Only fetch products after the user has been authenticated
    if (!isAuthenticated) {
      return;
    }

    async function loadProducts() {
      setIsLoadingProducts(true);
      setErrorMessage("");

      try {
        // Calculate how many items to skip based on current page and limit
        const calculatedSkip = (page - 1) * limit;
        const data = await getProducts(limit, calculatedSkip);
        setProducts(data.products);
        setTotal(data.total);
      } catch {
        setErrorMessage("Failed to load products. Please try again.");
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadProducts();
  }, [isAuthenticated, page, limit]);

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

  // Pagination navigation helpers
  let totalPages = Math.ceil(total / limit);
  if (totalPages < 1) {
    totalPages = 1;
  }

  function handlePrevPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1); // Return to page 1 when page size changes
  }

  // Calculate "Showing X–Y of Z" values
  const currentSkip = (page - 1) * limit;
  let startItem = 0;
  let endItem = 0;

  if (total > 0) {
    startItem = currentSkip + 1;
    endItem = currentSkip + products.length;
    if (endItem > total) {
      endItem = total;
    }
  }

  // Determine what to display using normal if statements
  let content = null;

  if (isLoadingProducts) {
    content = (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Loading products...
      </div>
    );
  } else if (errorMessage) {
    content = (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
        {errorMessage}
      </div>
    );
  } else {
    content = (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-12 w-12 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {product.title}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    ${product.price}
                  </td>
                  <td className="px-6 py-4">
                    ⭐ {product.rating}
                  </td>
                  <td className="px-6 py-4">
                    {product.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        <div className="flex flex-col gap-4 border-t border-zinc-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              Showing {startItem}–{endItem} of {total}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="limit-select" className="text-xs text-zinc-500 dark:text-zinc-400">
                Rows per page:
              </label>
              <select
                id="limit-select"
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page <= 1 || isLoadingProducts}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages || isLoadingProducts}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

      {content}
    </div>
  );
}
