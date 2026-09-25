"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, Product } from "@/services/products";

export default function ProductsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // State for products, loading, and error handling
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        const data = await getProducts();
        setProducts(data.products);
      } catch {
        setErrorMessage("Failed to load products. Please try again.");
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadProducts();
  }, [isAuthenticated]);

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
