"use client";

import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { AuthButtons } from "@/components/auth-buttons";

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <nav className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Figure Graph
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/dances"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dances
              </Link>
              <Link
                href="/routines"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Routines
              </Link>
              <AuthButtons />
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </Providers>
  );
}

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    return <LayoutContent>{children}</LayoutContent>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <LayoutContent>{children}</LayoutContent>
    </ClerkProvider>
  );
}
