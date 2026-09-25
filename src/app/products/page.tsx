export default function ProductsPage() {
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
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Product Table Placeholder
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The product list, filters, search, and pagination will be built here in future steps.
        </p>
      </div>
    </div>
  );
}
