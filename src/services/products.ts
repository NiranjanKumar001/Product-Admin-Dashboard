import api from "@/lib/api";

// Simple interface representing a product
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock: number;
  brand?: string;
  thumbnail: string;
}

// Interface representing the paginated response from /products
export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

// 1. Get a paginated list of products from DummyJSON
export async function getProducts(
  limit = 10,
  skip = 0,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const response = await api.get("/products", {
    params: {
      limit: limit,
      skip: skip,
    },
    signal: signal,
  });
  return response.data;
}

// 2. Get a single product by ID from DummyJSON
export async function getProductById(
  id: number | string,
  signal?: AbortSignal
): Promise<Product> {
  const response = await api.get(`/products/${id}`, {
    signal: signal,
  });
  return response.data;
}

// 3. Search products by query string with limit and skip from DummyJSON
export async function searchProducts(
  query: string,
  limit = 10,
  skip = 0,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const response = await api.get("/products/search", {
    params: {
      q: query,
      limit: limit,
      skip: skip,
    },
    signal: signal,
  });
  return response.data;
}

// Interface representing a product category
export interface ProductCategory {
  slug: string;
  name: string;
}

// 4. Get all available product categories from DummyJSON
export async function getCategories(): Promise<ProductCategory[]> {
  const response = await api.get("/products/categories");
  return response.data.map((cat: string | ProductCategory) => {
    if (typeof cat === "string") {
      return { slug: cat, name: cat };
    }
    return { slug: cat.slug, name: cat.name };
  });
}

// 5. Get products filtered by category from DummyJSON
export async function getProductsByCategory(
  category: string,
  limit = 10,
  skip = 0,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const response = await api.get(`/products/category/${category}`, {
    params: {
      limit: limit,
      skip: skip,
    },
    signal: signal,
  });
  return response.data;
}


