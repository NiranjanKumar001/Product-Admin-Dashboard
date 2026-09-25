"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { getProductById, updateProduct, deleteProduct, Product } from "@/services/products";
import { AlertTriangleIcon, StarIcon, XIcon } from "@/components/Icons";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Product and gallery state
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Tab state: "general" | "reviews"
  const [activeTab, setActiveTab] = useState<"general" | "reviews">("general");

  // Interactive toggle state (matching screenshot "Visibility" card)
  const [isVisible, setIsVisible] = useState(true);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [saveSuccessNotice, setSaveSuccessNotice] = useState("");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Verify authentication on mount
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

  // 2. Fetch product details using the dynamic ID
  useEffect(() => {
    if (!isAuthenticated || !productId) {
      return;
    }

    const controller = new AbortController();

    async function loadProduct() {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage("");

      try {
        const data = await getProductById(productId, controller.signal);
        setProduct(data);

        // Populate initial form fields
        setEditTitle(data.title);
        setEditPrice(String(data.price));
        setEditCategory(data.category);
        setEditStock(String(data.stock));
        setEditDescription(data.description);
        setEditBrand(data.brand || "");

        // Set the initial gallery image to the first product image or thumbnail
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        } else if (data.thumbnail) {
          setSelectedImage(data.thumbnail);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage("Failed to load product details. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, productId]);

  function handleOpenEdit() {
    if (!product) return;
    setEditTitle(product.title);
    setEditPrice(String(product.price));
    setEditCategory(product.category);
    setEditStock(String(product.stock));
    setEditDescription(product.description);
    setEditBrand(product.brand || "");
    setEditError("");
    setIsEditModalOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    if (!editTitle.trim()) {
      setEditError("Product name cannot be empty.");
      return;
    }
    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditError("Please enter a valid price greater than 0.");
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      const updated = await updateProduct(product.id, {
        title: editTitle.trim(),
        price: parsedPrice,
        category: editCategory.trim(),
        stock: parseInt(editStock, 10) || 0,
        description: editDescription.trim(),
      });

      // Optimistic update of local UI
      setProduct({
        ...product,
        ...updated,
        title: editTitle.trim(),
        price: parsedPrice,
        category: editCategory.trim() || product.category,
        stock: parseInt(editStock, 10) || product.stock,
        description: editDescription.trim() || product.description,
        brand: editBrand.trim() || product.brand,
      });

      setIsEditModalOpen(false);
      setSaveSuccessNotice("Product updated successfully!");
      setTimeout(() => setSaveSuccessNotice(""), 3500);
    } catch {
      setEditError("Failed to update product. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!product) return;
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      router.push("/products");
    } catch {
      alert("Failed to delete product. Please try again.");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }

  // Authentication check loading
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1340px] mx-auto w-full space-y-6">
      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{saveSuccessNotice}</span>
          </div>
          <button type="button" onClick={() => setSaveSuccessNotice("")} className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/60" aria-label="Dismiss notice">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Bar (matching screenshot layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Back Arrow + Title + Metadata */}
        <div className="flex items-center gap-3.5">
          <Link
            href="/products"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors shrink-0"
            title="Back to Product List"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {product ? product.title : "Product Details"}
              </h1>
              {product && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  ID #{product.id}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Last updated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Right: Actions (Trash, Save Draft / Edit, Publish / Store button) */}
        {product && (
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Delete button (Red outline box) */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 shadow-xs transition-colors"
              title="Delete Product"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Edit / Save Draft button */}
            <button
              type="button"
              onClick={handleOpenEdit}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              Edit Details
            </button>

            {/* Back to Products / Store Link */}
            <Link
              href="/products"
              className="h-10 px-5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center"
            >
              All Products
            </Link>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center shadow-xs">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading product information...</p>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && isNotFound && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <AlertTriangleIcon className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Product Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">
            No product found with ID #{productId}. It may have been removed or never existed.
          </p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && !isNotFound && errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center text-rose-700">
          <p className="font-semibold text-sm">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center rounded-xl border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Product Content (2-Column Dribbble Layout matching Screenshot) */}
      {!isLoading && !isNotFound && product && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Media, Visibility, Preview, Related info (~40% / 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Media & Gallery Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Hero / Cover Image (Left or Main Display) */}
                <div className="sm:col-span-3 relative h-72 sm:h-80 w-full rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-center p-4 overflow-hidden group">
                  {selectedImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedImage}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No image available</span>
                  )}
                  {/* "Cover" badge like screenshot */}
                  <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs border border-slate-100">
                    Cover
                  </span>
                </div>

                {/* Vertical / Grid Thumbnail Column + Dashed Add Box */}
                <div className="sm:col-span-1 flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible">
                  {product.images && product.images.slice(0, 3).map((imgUrl, idx) => {
                    const isSelected = selectedImage === imgUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`h-20 w-20 sm:h-auto sm:w-full aspect-square rounded-xl bg-slate-50 p-1.5 flex items-center justify-center border transition-all ${
                          isSelected
                            ? "border-2 border-blue-600 ring-2 ring-blue-100 shadow-xs"
                            : "border-slate-200 opacity-80 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                      </button>
                    );
                  })}

                  {/* Dashed upload box with blue + icon (exact match to screenshot) */}
                  <div className="h-20 w-20 sm:h-auto sm:w-full aspect-square rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 flex items-center justify-center text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="Add Image">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Visibility Card (matching screenshot) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Visibility</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You can change the visibility of this product for customers
                  </p>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isVisible ? "bg-blue-600" : "bg-slate-200"
                  }`}
                  aria-pressed={isVisible}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isVisible ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                <span className={`h-2 w-2 rounded-full ${isVisible ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className={isVisible ? "text-emerald-700" : "text-slate-400"}>
                  {isVisible ? "Active & Visible in Store" : "Hidden from Catalog"}
                </span>
              </div>
            </div>

            {/* 3. Preview Card (matching screenshot) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800">Preview</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Want to see how your product will look like?
              </p>
              <button
                type="button"
                onClick={() => alert(`Previewing "${product.title}" in storefront mode.`)}
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
              >
                Preview
              </button>
            </div>

            {/* 4. Related Specs Card (matching "Related Items" in screenshot) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Product Specifications</h3>
                <span className="text-xs font-medium text-slate-400">Meta</span>
              </div>
              <div className="space-y-3 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-2 first:pt-0 text-xs">
                  <span className="text-slate-400 font-medium">SKU</span>
                  <span className="font-mono font-semibold text-slate-700">{product.sku || `PRD-${product.id}-DUMMY`}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-400 font-medium">Warranty</span>
                  <span className="font-medium text-slate-700">{product.warrantyInformation || "1 Year Standard"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-400 font-medium">Shipping</span>
                  <span className="font-medium text-slate-700">{product.shippingInformation || "Free within 3-5 days"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-400 font-medium">Return Policy</span>
                  <span className="font-medium text-slate-700">{product.returnPolicy || "30 days return window"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Details Card (~60% / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              {/* Card Header: Title, Subtitle, and Status Pill */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Product Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Key info to describe and display your product.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                  Status: {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              {/* Segmented Tab Switcher (General vs Reviews) */}
              <div className="mt-6 flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className={`flex-1 rounded-lg py-2 transition-all ${
                    activeTab === "general"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 rounded-lg py-2 transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "reviews"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Reviews
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                    {product.reviews?.length || 0}
                  </span>
                </button>
              </div>

              {/* TAB 1: General Details Form (Matching screenshot layout) */}
              {activeTab === "general" && (
                <div className="mt-6 space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900">
                      {product.title}
                    </div>
                  </div>

                  {/* Status & Brand Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Status <span className="text-rose-500">*</span>
                      </label>
                      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 font-medium">
                        <span>{product.stock > 10 ? "Available / In Stock" : "Limited Stock"}</span>
                        <span className="text-xs text-slate-400">▾</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Brand <span className="text-rose-500">*</span>
                      </label>
                      <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 font-medium">
                        {product.brand || "None"}
                      </div>
                    </div>
                  </div>

                  {/* Category & Subcategory Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 font-medium capitalize">
                        <span>{product.category || "None"}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Subcategory / Stock
                      </label>
                      <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 font-medium">
                        {product.stock} units available
                      </div>
                    </div>
                  </div>

                  {/* Price & Discount Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Price <span className="text-rose-500">*</span>
                      </label>
                      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900">
                        <span>${product.price.toFixed(2)}</span>
                        <span className="text-xs font-semibold text-slate-400">USD</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Discount
                      </label>
                      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
                        <span>{product.discountPercentage ? `${product.discountPercentage}%` : "0%"}</span>
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Description
                    </label>
                    <div className="mt-1.5 min-h-[120px] rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm leading-relaxed text-slate-700">
                      {product.description}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Customer Reviews */}
              {activeTab === "reviews" && (
                <div className="mt-6 space-y-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev, index) => {
                      const formattedDate = rev.date
                        ? new Date(rev.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "";
                      return (
                        <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">{rev.reviewerName}</span>
                            <span className="text-xs text-slate-400">{formattedDate}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[0, 1, 2, 3, 4].map((sIdx) => (
                                <StarIcon key={sIdx} className="w-3.5 h-3.5" filled={sIdx < rev.rating} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{rev.rating}/5</span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">{rev.comment}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      No reviews posted yet for this product.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal (matching the screenshot theme) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
                <p className="text-xs text-slate-400">Update key info and pricing</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Stock Count *</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-100 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Product</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <span className="font-semibold text-slate-700">&quot;{product.title}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
