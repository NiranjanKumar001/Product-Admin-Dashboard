import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1340px] mx-auto w-full space-y-6">
      {/* Welcome Banner Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              SaaS Admin Suite v2.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome to ProductAdmin
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              An all-in-one e-commerce catalog dashboard for managing product inventory, live pricing, specifications, and customer feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Open Catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row (matching modern Dribbble dashboard stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Items</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              📦
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">194+</div>
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <span>↑ 12%</span>
            <span className="text-slate-400 font-normal">from last cycle</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              🏷️
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">24</div>
          <p className="text-xs text-slate-400 font-medium">Beauty, Tech, Groceries & more</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Rating</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              ⭐
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">4.8 / 5.0</div>
          <p className="text-xs text-emerald-600 font-medium">Verified customer reviews</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Store Health</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              🛡️
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">99.8%</div>
          <p className="text-xs text-slate-400 font-medium">All mock endpoints active</p>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-3">
              🛍️
            </div>
            <h3 className="text-base font-bold text-slate-900">Interactive Product Catalog</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Explore dynamic product listings with instant search, category filtering, price/rating sorting, pagination, and quick CRUD modal editing.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Explore Catalog &rarr;
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-3">
              ✨
            </div>
            <h3 className="text-base font-bold text-slate-900">Modern Dribbble Aesthetic</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Carefully designed with soft slate canvases, rounded-2xl cards, product cover image highlights, interactive visibility toggles, and clean forms.
            </p>
          </div>
          <Link
            href="/products/1"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View Sample Product Page &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
