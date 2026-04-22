"use client";

// No backend in this standalone project, so no providers are needed.
// This file is kept so the layout tree matches the main monorepo,
// making it a single-spot to drop in tRPC / QueryClient later.

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
