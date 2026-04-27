import { Suspense } from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white">
          <p className="text-sm">Loading…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
