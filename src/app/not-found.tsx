import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-1)] p-6">
      <h1 className="text-6xl font-bold text-[var(--brand-red)]">404</h1>
      <p className="mt-2 text-lg text-[var(--text-1)]">This page could not be found.</p>
      <Link
        href="/"
        className="mt-6 rounded-[10px] bg-[var(--brand-red)] px-4 py-2 font-medium text-white hover:bg-[#c40012]"
      >
        Go to home
      </Link>
    </div>
  );
}
