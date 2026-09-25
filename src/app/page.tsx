export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Product Admin Dashboard
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Initial project setup complete with Next.js, TypeScript, Tailwind CSS, and Axios.
        </p>
      </div>
    </main>
  );
}

