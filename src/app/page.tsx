"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (token) {
      router.replace("/products");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa]">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
    </div>
  );
}
