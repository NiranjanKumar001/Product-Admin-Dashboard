"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // Ignore parse errors
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Close profile popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setProfilePopoverOpen(false);
      }
    }
    if (profilePopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profilePopoverOpen]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  // Hide sidebar entirely on login page for clean presentation
  if (pathname === "/login") {
    return null;
  }

  const isProductsActive = pathname.startsWith("/products");
  const isHomeActive = pathname === "/";

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Emily Johnson";

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <span className="font-semibold text-slate-800 text-base">ProductAdmin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-slate-900/40 backdrop-blur-sm z-30">
          <div className="bg-white border-b border-slate-200 p-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                isHomeActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                isProductsActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Products
            </Link>

            {/* Mobile Profile & Logout */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-slate-200">
                  {user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.image} alt={user.username || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                      {user?.firstName ? user.firstName[0] : "E"}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{fullName}</div>
                  <div className="text-[10px] text-slate-400">@{user?.username || "emilys"}</div>
                </div>
              </div>

              {/* Mobile Dedicated Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sleek Icon Sidebar */}
      <aside className="hidden md:flex flex-col items-center justify-between w-20 py-6 bg-white border-r border-slate-200/80 shrink-0 select-none relative z-30">
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo Mark */}
          <Link
            href="/products"
            className="group relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-transform hover:scale-105"
            title="ProductAdmin"
          >
            <svg
              className="w-6 h-6 fill-none stroke-current stroke-[2.5]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 8a4 4 0 0 1-4 4H7" />
              <path d="M7 4h5a4 4 0 0 1 4 4 4 4 0 0 1-4 4H7v8" />
            </svg>
          </Link>

          {/* Navigation Icons Dock */}
          <nav className="flex flex-col items-center gap-3 w-full px-3">
            {/* Dashboard / Home (House icon matching reference) */}
            <Link
              href="/products"
              title="Dashboard Overview"
              className="flex items-center justify-center h-11 w-11 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>

            {/* Products / Store (Active highlighted storefront icon) */}
            <Link
              href="/products"
              title="Products"
              className={`flex items-center justify-center h-11 w-11 rounded-xl transition-colors ${
                isProductsActive
                  ? "bg-blue-50 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </Link>

            {/* Orders */}
            <button
              type="button"
              title="Orders"
              className="flex items-center justify-center h-11 w-11 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </button>

            {/* Analytics */}
            <button
              type="button"
              title="Analytics"
              className="flex items-center justify-center h-11 w-11 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </button>

            {/* Warehouse / Inventory */}
            <button
              type="button"
              title="Inventory"
              className="flex items-center justify-center h-11 w-11 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </button>

            {/* Settings */}
            <button
              type="button"
              title="Settings"
              className="flex items-center justify-center h-11 w-11 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </nav>
        </div>

        {/* Bottom Actions: User Avatar & Dedicated Logout Icon */}
        <div className="flex flex-col items-center gap-3 w-full relative" ref={popoverRef}>
          {/* User Profile Avatar (Clicking opens profile card, does NOT log out!) */}
          <button
            type="button"
            onClick={() => setProfilePopoverOpen(!profilePopoverOpen)}
            title={`View profile for ${fullName}`}
            className="relative flex items-center justify-center h-10 w-10 rounded-full overflow-hidden ring-2 ring-slate-200 hover:ring-blue-500 transition-all cursor-pointer focus:outline-none"
          >
            {user?.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.image} alt={user.username || "User"} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs">
                {user?.firstName ? user.firstName[0] : "E"}
              </div>
            )}
            {/* Active online dot */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {/* Dedicated Logout Icon Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center justify-center h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            aria-label="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          {/* Floating Profile Popover (Opened by clicking profile avatar) */}
          {profilePopoverOpen && (
            <div className="fixed left-20 bottom-6 w-72 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-slate-100 shrink-0">
                  {user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.image} alt={user.username || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName ? user.firstName[0] : "E"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{fullName}</div>
                  <div className="text-xs text-slate-400 font-medium truncate">@{user?.username || "emilys"}</div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Administrator
                  </div>
                </div>
              </div>

              <div className="pt-3 space-y-1">
                <div className="text-[11px] text-slate-400 px-1 pb-1">
                  Signed in as <span className="font-semibold text-slate-600">{user?.email || "emily.johnson@x.dummyjson.com"}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100/70 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
