import { TopBar } from "@/components/app-shell/top-bar";
import { requireUser } from "@/lib/session";

// Alle authentifizierten Routen sind per Definition dynamisch (Cookies, Session,
// DB-Zugriff). Verhindert dass Next zur Build-Zeit eine DB-Verbindung versucht.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <>
      <TopBar
        userEmail={user.email ?? ""}
        userName={user.name ?? null}
        userRole={user.role}
      />
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        {children}
      </main>
    </>
  );
}
