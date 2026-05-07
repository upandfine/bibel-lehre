"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

type TopBarProps = {
  userEmail: string;
  userName: string | null;
  userRole: "admin" | "learner";
};

type NavItem = { href: string; label: string };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lehrkurs", label: "Lehrkurs" },
  { href: "/verse", label: "Verse" },
  { href: "/uebungen", label: "Übungen" },
];

export function TopBar({ userEmail, userName, userRole }: TopBarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:gap-6 sm:px-4">
        {/* Mobile: Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/dashboard"
          className="font-serif text-lg font-semibold tracking-tight"
        >
          Bib-Inside
        </Link>

        {/* Desktop-Nav */}
        <nav className="hidden flex-1 items-center gap-1 text-sm sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                isActive(item.href)
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer auf Mobile: pusht UserMenu nach rechts */}
        <div className="flex-1 sm:hidden" />

        <UserMenu email={userEmail} name={userName} role={userRole} />
      </div>

      {mobileOpen && (
        <MobileDrawer
          items={navItems}
          isActive={isActive}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}

function MobileDrawer({
  items,
  isActive,
  onClose,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Body-Scroll sperren, solange Drawer offen ist
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet von links. bg-white als Tailwind-Default ohne CSS-Variable — die
          shadcn-Token bg-card / bg-background haben sich in dieser Konstellation
          nicht zuverlässig opak gerendert. */}
      <div
        className="relative h-full w-72 max-w-[85%] bg-white shadow-2xl"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-serif text-lg font-semibold tracking-tight">
            Bib-Inside
          </span>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Menü schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col p-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "rounded-md px-3 py-3 text-base transition-colors",
                isActive(item.href)
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function UserMenu({
  email,
  name,
  role,
}: {
  email: string;
  name: string | null;
  role: "admin" | "learner";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = name?.split(" ")[0] ?? email.split("@")[0];
  const initial = label.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:px-2.5"
      >
        {/* Mobile: nur Initiale als Avatar; Desktop: Name + Chevron */}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground sm:hidden">
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{label}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 sm:inline" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-60 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{email}</p>
            <p className="text-xs text-muted-foreground">
              Rolle: <span className="font-medium">{role}</span>
            </p>
          </div>
          {role === "admin" && (
            <>
              <div className="my-1 h-px bg-border" />
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-2 py-2 text-sm hover:bg-accent"
              >
                Admin-Bereich
              </Link>
            </>
          )}
          <div className="my-1 h-px bg-border" />
          <div className="px-2 py-1">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
