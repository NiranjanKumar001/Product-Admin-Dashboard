import api from "@/lib/api";

// Interface representing a product customer review
export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail?: string;
}

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
  sku?: string;
  thumbnail: string;
  images?: string[];
  reviews?: Review[];
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  returnPolicy?: string;
}

// Interface representing the paginated response from /products
export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

// 1. Get a paginated list of products from DummyJSON with optional sorting
export async function getProducts(
  limit = 10,
  skip = 0,
  sortBy?: string,
  order?: string,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const params: Record<string, string | number> = {
    limit: limit,
    skip: skip,
  };

  if (sortBy) {
    params.sortBy = sortBy;
    params.order = order || "asc";
  }

  const response = await api.get("/products", {
    params: params,
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

// 3. Search products by query string with limit, skip, and optional sorting from DummyJSON
export async function searchProducts(
  query: string,
  limit = 10,
  skip = 0,
  sortBy?: string,
  order?: string,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const params: Record<string, string | number> = {
    q: query,
    limit: limit,
    skip: skip,
  };

  if (sortBy) {
    params.sortBy = sortBy;
    params.order = order || "asc";
  }

  const response = await api.get("/products/search", {
    params: params,
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

// 5. Get products filtered by category with optional sorting from DummyJSON
export async function getProductsByCategory(
  category: string,
  limit = 10,
  skip = 0,
  sortBy?: string,
  order?: string,
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const params: Record<string, string | number> = {
    limit: limit,
    skip: skip,
  };

  if (sortBy) {
    params.sortBy = sortBy;
    params.order = order || "asc";
  }

  const response = await api.get(`/products/category/${category}`, {
    params: params,
    signal: signal,
  });
  return response.data;
}

// Interface for creating a new product
export interface NewProductData {
  title: string;
  price: number;
  category: string;
  stock: number;
  description: string;
}

// 6. Add a new product via DummyJSON API (POST /products/add)
export async function addProduct(productData: NewProductData): Promise<Product> {
  const response = await api.post("/products/add", productData);
  return response.data;
}

// Interface for updating an existing product
export interface UpdateProductData {
  title?: string;
  price?: number;
  category?: string;
  stock?: number;
  description?: string;
}

// 7. Update an existing product via DummyJSON API (PUT /products/:id)
export async function updateProduct(
  id: number | string,
  productData: UpdateProductData
): Promise<Product> {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
}

// 8. Delete a product via DummyJSON API (DELETE /products/:id)
export async function deleteProduct(
  id: number | string
): Promise<{ id: number; isDeleted: boolean }> {
  const response = await api.delete(`/products/${id}`);
  return response.data;
}


