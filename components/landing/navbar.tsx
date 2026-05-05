"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { isAuthenticated, isHydrated, user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    signOut();
    router.push("/");
  };

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "?";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent backdrop-blur-xl bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/trieduc-logo.png"
            alt="TRIEduc"
            width={1075}
            height={274}
            priority
            className="h-7 w-auto dark:invert"
          />
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="#como-funciona"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Como funciona
          </a>
          <a
            href="#metodologia"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Metodologia
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {!isHydrated ? (
            <div className="h-8 w-20 rounded-lg bg-muted/60 animate-pulse" />
          ) : isAuthenticated ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium"
              >
                <Link href="/gestor">
                  <span className="sm:hidden">Gestor</span>
                  <span className="hidden sm:inline">Área do Gestor</span>
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-lg h-8 px-2.5 sm:px-4 text-xs font-medium"
              >
                <Link href="/teste">
                  <span className="sm:hidden">Teste</span>
                  <span className="hidden sm:inline">Iniciar Teste</span>
                </Link>
              </Button>
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-label="Menu da conta"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card hover:border-border hover:bg-muted/40 transition-colors"
                >
                  <span className="text-[10px] font-semibold text-primary">
                    {initials}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/60 bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2.5 border-b border-border/60">
                      <p className="text-xs font-medium truncate">{user?.nome}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-lg h-8 px-3 text-xs font-medium"
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-lg h-8 px-4 text-xs font-medium"
              >
                <Link href="/teste">Iniciar Teste</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
