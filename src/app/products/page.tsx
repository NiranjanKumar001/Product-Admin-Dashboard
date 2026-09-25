"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  getProducts,
  searchProducts,
  getCategories,
  getProductsByCategory,
  addProduct,
  Product,
  ProductCategory,
} from "@/services/products";

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

  // Categories list state
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Add Product modal & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    price?: string;
    category?: string;
    stock?: string;
    description?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formApiError, setFormApiError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  function resetForm() {
    setFormTitle("");
    setFormPrice("");
    setFormCategory("");
    setFormStock("");
    setFormDescription("");
    setFormErrors({});
    setFormApiError("");
  }

  function handleOpenAddModal() {
    resetForm();
    setIsAddModalOpen(true);
  }

  function handleCloseAddModal() {
    if (!isSubmitting) {
      setIsAddModalOpen(false);
      resetForm();
    }
  }

  async function handleAddProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormApiError("");

    // Validate fields with simple if statements
    const errors: {
      title?: string;
      price?: string;
      category?: string;
      stock?: string;
      description?: string;
    } = {};

    if (!formTitle.trim()) {
      errors.title = "Title is required.";
    }

    const parsedPrice = Number(formPrice);
    if (!formPrice.trim()) {
      errors.price = "Price is required.";
    } else if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.price = "Price must be a valid positive number.";
    }

    if (!formCategory.trim()) {
      errors.category = "Category is required.";
    }

    const parsedStock = Number(formStock);
    if (!formStock.trim()) {
      errors.stock = "Stock is required.";
    } else if (Number.isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      errors.stock = "Stock must be a valid non-negative integer.";
    }

    if (!formDescription.trim()) {
      errors.description = "Description is required.";
    }

    setFormErrors(errors);

    // Stop if validation fails
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newProduct = await addProduct({
        title: formTitle.trim(),
        price: parsedPrice,
        category: formCategory.trim(),
        stock: parsedStock,
        description: formDescription.trim(),
      });

      const productToAdd: Product = {
        id: newProduct.id,
        title: newProduct.title || formTitle.trim(),
        price: newProduct.price !== undefined ? newProduct.price : parsedPrice,
        category: newProduct.category || formCategory.trim(),
        stock: newProduct.stock !== undefined ? newProduct.stock : parsedStock,
        description: newProduct.description || formDescription.trim(),
        rating: 5.0,
        thumbnail:
          newProduct.thumbnail ||
          "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",
      };

      // Update local UI state so the new product immediately appears in the list
      setProducts((prev) => [productToAdd, ...prev]);
      setTotal((prev) => prev + 1);

      setSuccessNotice(
        `Product "${productToAdd.title}" added successfully! (Assigned ID: ${productToAdd.id}). Note: DummyJSON is a mock API, changes are simulated in-memory.`
      );
      setIsAddModalOpen(false);
      resetForm();
    } catch {
      setFormApiError("Failed to add product. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 1. Read category from URL
  const selectedCategory = searchParams.get("category") || "";

  // 2. Read search query 'q' from URL
  const searchQuery = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  // Sync search input when URL changes (e.g. back/forward navigation or clear)
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setSearchInput(searchQuery);
  }

  // 3. Read and safely parse 'page' from the URL
  const rawPage = searchParams.get("page");
  let page = Number(rawPage);

  // If page is not a number, 0, or negative, fall back to page 1
  if (!rawPage || Number.isNaN(page) || page < 1) {
    page = 1;
  }

  // 4. Read and safely parse 'limit' from the URL
  const rawLimit = searchParams.get("limit");
  let limit = Number(rawLimit);

  // Only permit 10, 20, or 50. Fall back to 10 for any other value.
  if (limit !== 10 && limit !== 20 && limit !== 50) {
    limit = 10;
  }

  // 5. Read and safely parse 'sort' and 'order' from the URL
  const rawSort = searchParams.get("sort") || "";
  let sortField = "";
  if (rawSort === "price" || rawSort === "rating" || rawSort === "title") {
    sortField = rawSort;
  }

  const rawOrder = searchParams.get("order") || "asc";
  let sortOrder = "asc";
  if (rawOrder === "desc") {
    sortOrder = "desc";
  }

  // Helper function to update search query, category, sort, order, page, and limit in the URL
  function updateUrl(
    newPage: number,
    newLimit: number,
    newQuery: string = searchQuery,
    newCategory: string = selectedCategory,
    newSort: string = sortField,
    newOrder: string = sortOrder
  ) {
    const params = new URLSearchParams();
    if (newQuery) {
      params.set("q", newQuery);
    }
    if (newCategory) {
      params.set("category", newCategory);
    }
    if (newSort) {
      params.set("sort", newSort);
      params.set("order", newOrder);
    }
    params.set("page", String(newPage));
    params.set("limit", String(newLimit));
    router.push(`/products?${params.toString()}`);
  }

  // Debounce search input: wait 450ms after user stops typing before updating the URL
  useEffect(() => {
    // If the current input matches what is already in the URL, do nothing
    if (searchInput.trim() === searchQuery) {
      return;
    }

    // Wait 450ms after the user stops typing
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const trimmed = searchInput.trim();

      if (trimmed) {
        params.set("q", trimmed);
      }
      if (selectedCategory) {
        params.set("category", selectedCategory);
      }
      if (sortField) {
        params.set("sort", sortField);
        params.set("order", sortOrder);
      }
      // When the search query changes, always reset to page 1
      params.set("page", "1");
      params.set("limit", String(limit));

      router.push(`/products?${params.toString()}`);
    }, 450);

    // Cleanup: cancel the previous timer if the user types again within 450ms
    return () => {
      clearTimeout(timer);
    };
  }, [searchInput, searchQuery, selectedCategory, sortField, sortOrder, limit, router]);

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

  // Load available categories on mount once authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch {
        // Leave categories empty on error
      }
    }

    loadCategories();
  }, [isAuthenticated]);

  // Fetch products whenever auth is confirmed or URL parameters (category/search/page/limit) change
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Create an AbortController to cancel this request if a new filter or page change occurs
    const controller = new AbortController();

    async function loadProducts() {
      setIsLoadingProducts(true);
      setErrorMessage("");

      try {
        const calculatedSkip = (page - 1) * limit;
        let data;

        // Selection Behavior for Category + Search:
        // 1. If a category is selected, category filtering takes priority.
        if (selectedCategory && selectedCategory !== "all") {
          data = await getProductsByCategory(
            selectedCategory,
            limit,
            calculatedSkip,
            sortField || undefined,
            sortField ? sortOrder : undefined,
            controller.signal
          );
        } else if (searchQuery.trim() !== "") {
          // 2. If no category is selected and a search query is present, search products
          data = await searchProducts(
            searchQuery.trim(),
            limit,
            calculatedSkip,
            sortField || undefined,
            sortField ? sortOrder : undefined,
            controller.signal
          );
        } else {
          // 3. Otherwise, fetch standard paginated products
          data = await getProducts(
            limit,
            calculatedSkip,
            sortField || undefined,
            sortField ? sortOrder : undefined,
            controller.signal
          );
        }

        setProducts(data.products);
        setTotal(data.total);
      } catch (err) {
        // If the previous request was deliberately cancelled by us, do not show an error message
        if (axios.isCancel(err)) {
          return;
        }

        setErrorMessage("Failed to load products. Please try again.");
      } finally {
        // Only clear loading state if this request was not aborted by a newer one
        if (!controller.signal.aborted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProducts();

    // Cleanup: cancel the pending request when dependencies change
    return () => {
      controller.abort();
    };
  }, [isAuthenticated, page, limit, searchQuery, selectedCategory, sortField, sortOrder]);

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

  // Search submission and clear handlers
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    // When search changes, always go back to page 1
    updateUrl(1, limit, searchInput.trim(), selectedCategory, sortField, sortOrder);
  }

  function handleClearSearch() {
    setSearchInput("");
    updateUrl(1, limit, "", selectedCategory, sortField, sortOrder);
  }

  // Category change handler
  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCategory = e.target.value;
    // When category changes, always go back to page 1
    updateUrl(1, limit, searchQuery, newCategory, sortField, sortOrder);
  }

  // Sort field and order handlers
  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSort = e.target.value;
    // When sorting field changes, reset to page 1
    updateUrl(1, limit, searchQuery, selectedCategory, newSort, sortOrder);
  }

  function handleOrderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newOrder = e.target.value;
    // When sort order changes, reset to page 1
    updateUrl(1, limit, searchQuery, selectedCategory, sortField, newOrder);
  }

  // Calculate total pages safely
  let totalPages = Math.ceil(total / limit);
  if (totalPages < 1) {
    totalPages = 1;
  }

  function handlePrevPage() {
    if (page > 1) {
      updateUrl(page - 1, limit, searchQuery, selectedCategory, sortField, sortOrder);
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      updateUrl(page + 1, limit, searchQuery, selectedCategory, sortField, sortOrder);
    }
  }

  function handleLimitChange(newLimit: number) {
    // When the page size changes, always go back to page 1
    updateUrl(1, newLimit, searchQuery, selectedCategory, sortField, sortOrder);
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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    No products found.
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
                      <Link
                        href={`/products/${product.id}`}
                        className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {product.title}
                      </Link>
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
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/products/${product.id}`}
                        className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        View
                      </Link>
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
                  onClick={() => updateUrl(item, limit, searchQuery, selectedCategory, sortField, sortOrder)}
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add Product
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span>{successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice("")}
            className="ml-4 text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Search and Category Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by title..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Search
          </button>
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Clear
            </button>
          ) : null}
        </form>

        {/* Category and Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="category-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Category:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Field Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortField}
              onChange={handleSortChange}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Default</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="title">Title</option>
            </select>
          </div>

          {/* Sort Order Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="order-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Order:
            </label>
            <select
              id="order-select"
              value={sortOrder}
              onChange={handleOrderChange}
              disabled={!sortField}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Informational badge when both category and search query are present */}
      {selectedCategory && searchQuery ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Showing category: <span className="font-semibold capitalize">{selectedCategory}</span>.
          (Category filter takes priority over the search term &quot;{searchQuery}&quot; due to API limitations.)
        </div>
      ) : null}

      {content}

      {/* Add Product Modal */}
      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Add New Product
              </h2>
              <button
                type="button"
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {formApiError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formApiError}
              </div>
            ) : null}

            <form onSubmit={handleAddProductSubmit} className="mt-4 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="add-title" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Title *
                </label>
                <input
                  id="add-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {formErrors.title ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.title}</p>
                ) : null}
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="add-price" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Price ($) *
                  </label>
                  <input
                    id="add-price"
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 29.99"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  {formErrors.price ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.price}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="add-stock" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Stock Units *
                  </label>
                  <input
                    id="add-stock"
                    type="number"
                    step="1"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  {formErrors.stock ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.stock}</p>
                  ) : null}
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="add-category" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Category *
                </label>
                <select
                  id="add-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formErrors.category ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.category}</p>
                ) : null}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="add-description" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description *
                </label>
                <textarea
                  id="add-description"
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide a detailed description of the product..."
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {formErrors.description ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.description}</p>
                ) : null}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
