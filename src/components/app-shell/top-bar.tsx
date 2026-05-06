"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

type TopBarProps = {
  userEmail: string;
  userName: string | null;
  userRole: "admin" | "learner";
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lehrkurs", label: "Lehrkurs" },
  { href: "/verse", label: "Verse" },
  { href: "/uebungen", label: "Übungen" },
];

export function TopBar({ userEmail, userName, userRole }: TopBarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link
          href="/dashboard"
          className="font-serif text-lg font-semibold tracking-tight"
        >
          Bib-Inside
        </Link>

        <nav className="flex flex-1 items-center gap-1 text-sm">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <UserMenu email={userEmail} name={userName} role={userRole} />
      </div>
    </header>
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
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-64 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
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
                className="block rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
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
