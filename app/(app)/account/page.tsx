import { getCurrentUser } from "@/lib/auth/user";
import { signOut } from "@/lib/actions/auth";
import { Eyebrow } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-xl">
      <Eyebrow>You</Eyebrow>
      <h1 className="mt-3 text-3xl font-light text-ink">
        {user?.displayName ?? "Your account"}
      </h1>

      <dl className="mt-8 flex flex-col">
        <div className="flex items-center justify-between border-b border-line py-4">
          <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone">Email</dt>
          <dd className="font-light text-ink">{user?.email ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between border-b border-line py-4">
          <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone">Plan</dt>
          <dd className="flex items-center gap-2">
            <span className="font-light capitalize text-ink">{user?.plan ?? "free"}</span>
            {user?.plan !== "pro" && (
              <span className="bg-salvie px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.22em] text-gran">
                Upgrade
              </span>
            )}
          </dd>
        </div>
      </dl>

      <form action={signOut} className="mt-10">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </div>
  );
}
