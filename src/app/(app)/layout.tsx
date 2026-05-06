import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TopBar } from "@/components/app-shell/top-bar";

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
      <main className="container mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
