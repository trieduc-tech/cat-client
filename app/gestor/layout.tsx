import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/landing/navbar";
import { GestorFiltersProvider } from "@/components/gestor/filters-context";
import { SectionNav } from "@/components/gestor/section-nav";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <GestorFiltersProvider>
        <Navbar />
        <div className="min-h-svh pt-14">
          {/* sticky tab bar */}
          <div className="sticky top-14 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2">
              <SectionNav />
            </div>
          </div>
          <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
        </div>
      </GestorFiltersProvider>
    </AuthGuard>
  );
}
