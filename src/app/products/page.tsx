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
  updateProduct,
  deleteProduct,
  Product,
  ProductCategory,
} from "@/services/products";

// Helper function to calculate which page numbers should be visible
function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  const pages: (number | string)[] = [];
  pages.push(1);

  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }

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

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }

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

  // Add/Edit Product modal & form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    setEditingProduct(null);
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

  function handleOpenEditModal(product: Product) {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormPrice(String(product.price));
    setFormCategory(product.category);
    setFormStock(String(product.stock));
    setFormDescription(product.description || "");
    setFormErrors({});
    setFormApiError("");
    setIsAddModalOpen(true);
  }

  function handleCloseAddModal() {
    if (!isSubmitting) {
      setIsAddModalOpen(false);
      resetForm();
    }
  }

  // Delete Product confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteApiError, setDeleteApiError] = useState("");

  // Retry trigger for reload without full browser reload
  const [retryTrigger, setRetryTrigger] = useState(0);

  function handleRetry() {
    setRetryTrigger((prev) => prev + 1);
  }

  function handleOpenDeleteModal(product: Product) {
    setProductToDelete(product);
    setDeleteApiError("");
  }

  function handleCloseDeleteModal() {
    if (!isDeleting) {
      setProductToDelete(null);
      setDeleteApiError("");
    }
  }

  async function handleConfirmDelete() {
    if (!productToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteApiError("");

    try {
      await deleteProduct(productToDelete.id);

      // Remove product from local UI state
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));

      setSuccessNotice(
        `Product "${productToDelete.title}" deleted successfully! (DummyJSON mock simulation)`
      );
      setProductToDelete(null);
    } catch {
      setDeleteApiError("Failed to delete product. Please check your network and try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAddProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormApiError("");

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

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Edit existing product via PUT /products/:id
        const updated = await updateProduct(editingProduct.id, {
          title: formTitle.trim(),
          price: parsedPrice,
          category: formCategory.trim(),
          stock: parsedStock,
          description: formDescription.trim(),
        });

        // Update local UI state
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === editingProduct.id) {
              return {
                ...p,
                ...updated,
                title: formTitle.trim(),
                price: parsedPrice,
                category: formCategory.trim(),
                stock: parsedStock,
                description: formDescription.trim(),
              };
            }
            return p;
          })
        );

        setSuccessNotice(
          `Product "${formTitle.trim()}" updated successfully! (DummyJSON mock simulation)`
        );
      } else {
        // Add new product via POST /products/add
        const newProduct = await addProduct({
          title: formTitle.trim(),
          price: parsedPrice,
          category: formCategory.trim(),
          stock: parsedStock,
          description: formDescription.trim(),
        });

        setProducts((prev) => [newProduct, ...prev]);
        setTotal((prev) => prev + 1);

        setSuccessNotice(
          `Product "${newProduct.title}" added successfully! (DummyJSON mock simulation)`
        );
      }

      setIsAddModalOpen(false);
      resetForm();
    } catch {
      setFormApiError(
        editingProduct
          ? "Failed to update product. Please check your network and try again."
          : "Failed to add product. Please check your network and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // URL state reading with safe defaults
  const pageParam = searchParams.get("page");
  let parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    parsedPage = 1;
  }
  const page = parsedPage;

  const limitParam = searchParams.get("limit");
  let parsedLimit = limitParam ? parseInt(limitParam, 10) : 10;
  if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
    parsedLimit = 10;
  }
  const limit = parsedLimit;

  const searchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "";
  const sortField = searchParams.get("sort") || "";
  const sortOrder = searchParams.get("order") === "desc" ? "desc" : "asc";

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchInput(searchQuery);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function updateUrl(
    newPage: number,
    newLimit: number,
    newSearch: string,
    newCategory: string,
    newSort: string,
    newOrder: string
  ) {
    const params = new URLSearchParams();
    if (newSearch) {
      params.set("q", newSearch);
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

  // Debounce search input
  useEffect(() => {
    if (searchInput.trim() === searchQuery) {
      return;
    }

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
      params.set("page", "1");
      params.set("limit", String(limit));

      router.push(`/products?${params.toString()}`);
    }, 450);

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

  // Fetch products
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      setIsLoadingProducts(true);
      setErrorMessage("");

      try {
        const calculatedSkip = (page - 1) * limit;
        let data;

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
          data = await searchProducts(
            searchQuery.trim(),
            limit,
            calculatedSkip,
            sortField || undefined,
            sortField ? sortOrder : undefined,
            controller.signal
          );
        } else {
          data = await getProducts(
            limit,
            calculatedSkip,
            sortField || undefined,
            sortField ? sortOrder : undefined,
            controller.signal
          );
        }

        let fetchedProducts = data.products;
        if (selectedCategory && selectedCategory !== "all" && sortField) {
          fetchedProducts = [...fetchedProducts].sort((a, b) => {
            let valA: string | number = "";
            let valB: string | number = "";

            if (sortField === "price") {
              valA = a.price;
              valB = b.price;
            } else if (sortField === "rating") {
              valA = a.rating ?? 0;
              valB = b.rating ?? 0;
            } else if (sortField === "title") {
              valA = a.title.toLowerCase();
              valB = b.title.toLowerCase();
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
          });
        }

        setProducts(fetchedProducts);
        setTotal(data.total);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }
        setErrorMessage("Failed to load products. Please check your connection and try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, page, limit, searchQuery, selectedCategory, sortField, sortOrder, retryTrigger]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateUrl(1, limit, searchInput.trim(), selectedCategory, sortField, sortOrder);
  }

  function handleClearSearch() {
    setSearchInput("");
    updateUrl(1, limit, "", selectedCategory, sortField, sortOrder);
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCategory = e.target.value;
    updateUrl(1, limit, searchQuery, newCategory, sortField, sortOrder);
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSort = e.target.value;
    updateUrl(1, limit, searchQuery, selectedCategory, newSort, sortOrder);
  }

  function handleOrderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newOrder = e.target.value;
    updateUrl(1, limit, searchQuery, selectedCategory, sortField, newOrder);
  }

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
    updateUrl(1, newLimit, searchQuery, selectedCategory, sortField, sortOrder);
  }

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

  const visiblePages = getVisiblePages(page, totalPages);

  let emptyMessage = "No products found.";
  if (searchQuery) {
    emptyMessage = `No products found matching "${searchQuery}". Try searching with different keywords.`;
  } else if (selectedCategory && selectedCategory !== "all") {
    emptyMessage = `No products found in category "${selectedCategory}".`;
  }

  let content = null;

  if (isLoadingProducts) {
    content = (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-xs">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-500">
          {searchQuery ? "Searching products..." : "Loading products catalog..."}
        </p>
      </div>
    );
  } else if (errorMessage) {
    content = (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center text-sm text-rose-700 shadow-xs">
        <p className="font-semibold">{errorMessage}</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-50"
          >
            ↻ Retry
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-right min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-11 w-11 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/products/${product.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-1"
                          >
                            {product.title}
                          </Link>
                          {product.brand && (
                            <span className="text-xs text-slate-400 font-medium">{product.brand}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                        ⭐ {product.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            product.stock > 10
                              ? "bg-emerald-500"
                              : product.stock > 0
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span className="text-slate-700">{product.stock} units</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(product)}
                          className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs hover:bg-blue-100/60 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(product)}
                          className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-100/60 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {products.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              {emptyMessage}
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover bg-slate-50 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-semibold text-sm text-slate-900 hover:text-blue-600 line-clamp-1"
                    >
                      {product.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="capitalize font-medium text-slate-600">{product.category}</span>
                      <span>•</span>
                      <span>⭐ {product.rating}</span>
                      <span>•</span>
                      <span>Stock: {product.stock}</span>
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-slate-900">
                      ${product.price.toFixed(2)} USD
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(product)}
                    className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs hover:bg-blue-100/60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(product)}
                    className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-100/60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className="border-t border-slate-100 bg-slate-50/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>
              Showing <span className="font-semibold text-slate-800">{startItem}</span>–<span className="font-semibold text-slate-800">{endItem}</span> of <span className="font-semibold text-slate-800">{total}</span> items
            </span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1 || isLoadingProducts}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              Previous
            </button>

            {visiblePages.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <span key={`${item}-${index}`} className="px-2 text-xs text-slate-400">
                    …
                  </span>
                );
              }

              const isCurrent = item === page;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={isLoadingProducts}
                  onClick={() => updateUrl(item, limit, searchQuery, selectedCategory, sortField, sortOrder)}
                  className={`h-8 w-8 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= totalPages || isLoadingProducts}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1340px] mx-auto w-full space-y-6">
      {/* Top Header: Title, Subtitle, and Primary "+ Add New Product" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Product Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage your store items, live inventory, and product pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successNotice}</span>
          </div>
          <button type="button" onClick={() => setSuccessNotice("")} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar Controls Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products by title or keyword..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
              >
                Clear
              </button>
            )}
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                id="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none shadow-2xs capitalize"
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
            <div className="flex items-center gap-1.5">
              <select
                id="sort-select"
                value={sortField}
                onChange={handleSortChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none shadow-2xs"
              >
                <option value="">Sort: Default</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="title">Title</option>
              </select>
            </div>

            {/* Sort Order Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                id="order-select"
                value={sortOrder}
                onChange={handleOrderChange}
                disabled={!sortField}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <option value="asc">Ascending ↑</option>
                <option value="desc">Descending ↓</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notice when Category overrides Search */}
        {selectedCategory && searchQuery && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
            Filtering by category <span className="font-bold capitalize">&quot;{selectedCategory}&quot;</span>. (Category takes priority over search query &quot;{searchQuery}&quot; per DummyJSON mock specs.)
          </div>
        )}
      </div>

      {/* Main Table / Cards Content */}
      {content}

      {/* Add / Edit Product Modal (matching screenshot aesthetic) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-slate-400">
                  Key info to describe and display your product.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {formApiError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {formApiError}
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Natural Glow Face Moisturizer"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 capitalize"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 text-xs text-rose-500">{formErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Price ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 29.99"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-xs text-rose-500">{formErrors.price}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Stock Units <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="e.g. 100"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {formErrors.stock && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.stock}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Write a short description highlighting key benefits and features"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.description}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Save Draft / Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {isSubmitting ? "Publishing..." : editingProduct ? "Save Changes" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-100 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{productToDelete.title}&quot;</span>?
            </p>
            {deleteApiError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                {deleteApiError}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
