import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TopBar } from "@/components/app-shell/top-bar";

// Alle authentifizierten Routen sind per Definition dynamisch (Cookies, Session,
// DB-Zugriff). Verhindert dass Next zur Build-Zeit eine DB-Verbindung versucht.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <>
      <TopBar
        userEmail={session.user.email ?? ""}
        userName={session.user.name ?? null}
        userRole={session.user.role}
      />
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        {children}
      </main>
    </>
  );
}
