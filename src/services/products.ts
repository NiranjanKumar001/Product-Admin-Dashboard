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

