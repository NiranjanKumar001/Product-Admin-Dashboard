"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { getProductById, Product } from "@/services/products";

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

        // Check if DummyJSON returned a 404 Not Found error
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

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  // While checking authentication, show a loading message
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Checking authentication...</p>
      </div>
    );
  }

  // Prevent showing content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation & Header Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            &larr; Back to Products
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            Logout
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Loading product details...
          </div>
        ) : null}

        {/* Product Not Found State */}
        {!isLoading && isNotFound ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl dark:bg-zinc-800">
              🔍
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Product Not Found</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              The product with ID <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{productId}&quot;</span> could not be found or has been removed.
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Return to Product List
              </Link>
            </div>
          </div>
        ) : null}

        {/* Generic Error State */}
        {!isLoading && !isNotFound && errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/40">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMessage}</p>
            <div className="mt-4">
              <Link
                href="/products"
                className="inline-flex rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-zinc-800"
              >
                &larr; Back to Products
              </Link>
            </div>
          </div>
        ) : null}

        {/* Product Details Content */}
        {!isLoading && !isNotFound && product ? (
          <div className="space-y-8">
            {/* Top Section: Gallery & Details Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Left Column: Image Gallery */}
                <div className="space-y-4">
                  {/* Main Display Image */}
                  <div className="flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                    {selectedImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedImage}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-zinc-400">No image available</span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {product.images && product.images.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.images.map((imgUrl, index) => {
                        const isCurrent = selectedImage === imgUrl;
                        let ringClass = "border border-zinc-200 dark:border-zinc-700 opacity-70 hover:opacity-100";
                        if (isCurrent) {
                          ringClass = "border-2 border-zinc-900 dark:border-zinc-100 opacity-100 shadow-sm";
                        }

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedImage(imgUrl)}
                            className={`h-16 w-16 overflow-hidden rounded-lg bg-zinc-100 p-1 transition-all dark:bg-zinc-800 ${ringClass}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`${product.title} thumbnail ${index + 1}`}
                              className="h-full w-full object-contain"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* Right Column: Product Metadata & Info */}
                <div className="flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Category & Brand Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {product.category}
                      </span>
                      {product.brand ? (
                        <span className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                          Brand: {product.brand}
                        </span>
                      ) : null}
                    </div>

                    {/* Product Title */}
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
                      {product.title}
                    </h1>

                    {/* Rating & Stock */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center font-medium text-amber-600 dark:text-amber-400">
                        ⭐ {product.rating} / 5
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Stock: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{product.stock} units</span>
                      </span>
                      {product.availabilityStatus ? (
                        <>
                          <span className="text-zinc-400">•</span>
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {product.availabilityStatus}
                          </span>
                        </>
                      ) : null}
                    </div>

                    {/* Price and Discount */}
                    <div className="flex items-baseline gap-3 pt-2">
                      <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.discountPercentage ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {product.discountPercentage}% OFF
                        </span>
                      ) : null}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 pt-2">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Description
                      </h2>
                      <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Extra Meta Info (Warranty, Shipping, Return) */}
                  <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    {product.warrantyInformation ? (
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">Warranty:</span>{" "}
                        {product.warrantyInformation}
                      </div>
                    ) : null}
                    {product.shippingInformation ? (
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">Shipping:</span>{" "}
                        {product.shippingInformation}
                      </div>
                    ) : null}
                    {product.returnPolicy ? (
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">Return Policy:</span>{" "}
                        {product.returnPolicy}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Customer Reviews */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Customer Reviews ({product.reviews && product.reviews.length > 0 ? product.reviews.length : 0})
              </h2>

              {product.reviews && product.reviews.length > 0 ? (
                <div className="mt-6 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {product.reviews.map((review, idx) => {
                    const formattedDate = review.date
                      ? new Date(review.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "";

                    return (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {review.reviewerName}
                          </span>
                          <span className="text-xs text-zinc-400">{formattedDate}</span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-amber-500">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(Math.max(0, 5 - review.rating))}
                          <span className="ml-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                          {review.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  No reviews available for this product yet.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
