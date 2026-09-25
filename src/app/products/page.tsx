"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, Product } from "@/services/products";

// Helper function to calculate which page numbers should be visible
function getVisiblePages(currentPage: number, totalPages: number) {
  // If there are 7 or fewer pages, show all page numbers
  if (totalPages <= 7) {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  const pages: (number | string)[] = [];

  // Always show the first page
  pages.push(1);

  // If current page is further in, show an ellipsis
  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }

  // Calculate the window of numbers around the current page
  let start = currentPage - 1;
  let end = currentPage + 1;

  if (start < 2) {
    start = 2;
    end = 4;
  }

  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = totalPages - 3;
  }

  for (let i = start; i <= end; i++) {
    if (i > 1 && i < totalPages) {
      pages.push(i);
    }
  }

  // If there are more pages before the last page, show an ellipsis
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }

  // Always show the last page
  pages.push(totalPages);

  return pages;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Products and status state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [total, setTotal] = useState(0);

  // 1. Read and safely parse 'page' from the URL
  const rawPage = searchParams.get("page");
  let page = Number(rawPage);

  // If page is not a number, 0, or negative, fall back to page 1
  if (!rawPage || Number.isNaN(page) || page < 1) {
    page = 1;
  }

  // 2. Read and safely parse 'limit' from the URL
  const rawLimit = searchParams.get("limit");
  let limit = Number(rawLimit);

  // Only permit 10, 20, or 50. Fall back to 10 for any other value.
  if (limit !== 10 && limit !== 20 && limit !== 50) {
    limit = 10;
  }

  // Verify authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  // Fetch products whenever auth is confirmed or URL parameters (page/limit) change
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    async function loadProducts() {
      setIsLoadingProducts(true);
      setErrorMessage("");

      try {
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

  // While checking authentication, show a simple loading message
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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  // Helper function to update page and limit query parameters in the URL
  function updateUrl(newPage: number, newLimit: number) {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    params.set("limit", String(newLimit));
    router.push(`/products?${params.toString()}`);
  }

  // Calculate total pages safely
  let totalPages = Math.ceil(total / limit);
  if (totalPages < 1) {
    totalPages = 1;
  }

  function handlePrevPage() {
    if (page > 1) {
      updateUrl(page - 1, limit);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      updateUrl(page + 1, limit);
    }
  }

  function handleLimitChange(newLimit: number) {
    // When the page size changes, always go back to page 1
    updateUrl(1, newLimit);
  }

  // Calculate "Showing X–Y of Z" values safely
  const currentSkip = (page - 1) * limit;
  let startItem = 0;
  let endItem = 0;

  if (total > 0 && products.length > 0) {
    startItem = currentSkip + 1;
    endItem = currentSkip + products.length;
    if (endItem > total) {
      endItem = total;
    }
  }

  // Get visible page buttons list
  const visiblePages = getVisiblePages(page, totalPages);

  // Determine table content using normal if statements
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No products found for this page.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
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
                ))
              )}
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

          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1 || isLoadingProducts}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Previous
            </button>

            {visiblePages.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = item === page;
              let buttonStyle =
                "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";

              if (isCurrent) {
                buttonStyle =
                  "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900";
              }

              return (
                <button
                  key={item}
                  type="button"
                  disabled={isLoadingProducts}
                  onClick={() => updateUrl(item, limit)}
                  className={buttonStyle}
                >
                  {item}
                </button>
              );
            })}

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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading products...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
