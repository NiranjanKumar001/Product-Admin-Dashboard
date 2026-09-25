import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome to Product Admin Dashboard
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          A simple dashboard for managing products, tracking inventory, and viewing details.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/products"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Products
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Admin Login
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Product Management
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            View product list, edit item details, and manage inventory statuses.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Secure Access
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Log in with administrator credentials to access management tools.
          </p>
        </div>
      </div>
    </div>
  );
}
