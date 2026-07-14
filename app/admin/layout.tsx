import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

// The proxy guards everything under /admin, so this layout can assume a
// curator. The login page renders inside it too; the nav is harmless there.

export const metadata = { title: "Curation — OM-Eat" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-xl items-center gap-5 px-4 py-3 text-sm font-semibold">
          <span className="font-mono font-bold">Curation</span>
          <Link href="/admin" className="underline">
            Queue
          </Link>
          <Link href="/admin/finds" className="underline">
            Finds
          </Link>
          <span className="ml-auto">
            <SignOutButton />
          </span>
        </nav>
      </header>
      {children}
    </div>
  );
}
