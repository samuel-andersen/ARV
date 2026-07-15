import { requireUser } from "@/lib/auth/user";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell email={user.email}>{children}</AppShell>;
}
