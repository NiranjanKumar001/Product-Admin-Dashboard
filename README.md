# Product Admin Dashboard

A responsive, production-ready Product Admin Dashboard built with Next.js (App Router), TypeScript, and Tailwind CSS. The application connects to the [DummyJSON API](https://dummyjson.com) to provide a complete e-commerce product management experience with authentication, search, category filtering, sorting, pagination, dynamic product detail views, and full CRUD operations.

---

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Backend API**: [DummyJSON](https://dummyjson.com)

---

## 📦 Setup & Installation

### Prerequisites
- Node.js 18.17+ or later
- npm or pnpm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/NiranjanKumar001/Product-Admin-Dashboard.git
cd Product-Admin-Dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
npm start
```

---

## 🔐 Authentication & DummyJSON Credentials

The application uses DummyJSON's mock authentication endpoint (`POST https://dummyjson.com/auth/login`).

Use the default test credentials provided by DummyJSON:
- **Username**: `emilys`
- **Password**: `emilyspass`

Upon successful login, JWT tokens are securely stored in client `localStorage` and automatically attached via an Axios request interceptor to subsequent API requests. Routes are protected so unauthenticated visits redirect to `/login`.

---

## ✨ Features Completed

1. **Authentication & Route Protection**
   - Clean login page with credential validation.
   - Protected `/products` and `/products/[id]` routes with automatic redirection to `/login` when unauthenticated.
   - Session logout button that clears local tokens.

2. **Responsive Product Catalog**
   - **Desktop View**: Rich data table with image, title, category, price, rating, stock, and actions.
   - **Mobile View**: Responsive card layout optimized for smaller touchscreens (`hidden md:block` / `block md:hidden`).

3. **URL State Synchronization**
   - All filter parameters (`page`, `limit`, `q`, `category`, `sort`, `order`) are stored in the URL.
   - Refreshing or sharing a URL preserves the exact user view.
   - Robust edge-case sanitization: invalid inputs (`?page=abc`, `?page=-5`, `?limit=hello`) safely fall back to valid defaults without crashing.

4. **Debounced Search & Race Condition Prevention**
   - Search input is debounced (450ms) to prevent hammering the server on every keystroke.
   - Network race conditions are mitigated using `AbortController` and Axios cancellation tokens, ensuring older, slower responses never overwrite newer search results.

5. **Category Filtering**
   - Categories are dynamically loaded from `GET /products/categories`.
   - Selecting a category fetches products via `GET /products/category/:slug` and resets to page 1.
   - Includes a clear notice banner handling the DummyJSON limitation that text search and category filtering cannot be queried simultaneously.

6. **Server-Side Sorting**
   - Supports sorting by **Price**, **Rating**, and **Title** in both **Ascending** and **Descending** order.
   - Uses server-side sorting (`sortBy` and `order` parameters) so entire datasets are sorted before pagination limits are applied.

7. **Numbered Pagination & Limit Controls**
   - Page size options (10, 20, 50).
   - Smart numbered pagination buttons with ellipsis windowing (`1 ... 4 5 6 ... 20`).
   - Accurate record range indicator (`Showing 1–10 of 194`).

8. **Dynamic Product Details Page (`/products/[id]`)**
   - Interactive multi-image gallery with selectable thumbnails.
   - Full product metadata: title, description, price, discount badge, stock status, warranty, and shipping details.
   - Customer review cards with star ratings, reviewer names, comments, and formatted dates.
   - Graceful 404 "Product Not Found" handling for nonexistent IDs (e.g. `/products/999999`).

9. **Full Product CRUD Operations**
   - **Add Product**: Modal form with strict field validation (positive price, non-negative stock, required title/category/description) and double-submit locking.
   - **Edit Product**: Pre-fills existing product data, validates inputs, and updates table row in-place upon `PUT /products/:id` success.
   - **Delete Product**: Confirmation modal preventing accidental deletions, calls `DELETE /products/:id`, and removes the item from the local table.

10. **Loading, Empty, & Error Recovery States**
    - Contextual loading indicators ("Searching products...", "Loading products...", "Saving...", "Deleting...").
    - Explicit empty states for zero search results, empty categories, and general empty lists.
    - Inline error handling with a **"Retry"** button that re-fetches products without reloading the browser.

---

## ⚠️ Known Limitation: Mock API Persistence

**DummyJSON is a mock prototyping API**:
- Calling `POST /products/add`, `PUT /products/:id`, or `DELETE /products/:id` returns simulated HTTP 200/201 responses with mock IDs.
- DummyJSON does **not** permanently persist these modifications to its server database.
- To provide a realistic dashboard experience, our application immediately updates its local React state so added, edited, or deleted products visibly update in the UI during your active session.

---

## 🛠️ Problem Faced & Solution

### **Problem: Search Race Conditions with Fast Typing**
When a user types rapidly into a search bar (e.g. typing `"phone"`, then immediately changing to `"laptop"`), multiple asynchronous HTTP requests are dispatched. If the network or server responds to the older `"phone"` request *after* the newer `"laptop"` request completes, the stale results overwrite the fresh results, displaying incorrect products to the user.

### **Solution: AbortController with Axios Cancellation**
We implemented an `AbortController` inside the `useEffect` responsible for loading products:
```typescript
const controller = new AbortController();

// Pass controller.signal to our Axios service
const data = await searchProducts(searchQuery, limit, skip, sort, order, controller.signal);

// Cleanup function aborts pending request if query/page changes
return () => {
  controller.abort();
};
```
When Axios throws a cancelled error (`axios.isCancel(err)`), the catch block ignores the abortion so no false error banners are shown, and only the newest search query updates the state.

---

## 🤖 AI Assistance Disclosure

AI pair programming assistance was utilized during development for:
- Accelerating boilerplate setup and TypeScript interface definitions.
- Writing thorough regression tests and documentation.
