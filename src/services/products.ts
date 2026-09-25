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
export async function getProducts(limit = 10, skip = 0): Promise<ProductsResponse> {
  const response = await api.get("/products", {
    params: {
      limit: limit,
      skip: skip,
    },
  });
  return response.data;
}

// 2. Get a single product by ID from DummyJSON
export async function getProductById(id: number | string): Promise<Product> {
  const response = await api.get(`/products/${id}`);
  return response.data;
}
