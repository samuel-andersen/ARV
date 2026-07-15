import { getPendingInvites } from "@/lib/data/books";
import { getCurrentUser } from "@/lib/auth/user";
import { acceptInvite } from "@/lib/actions/books";
import { Eyebrow } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function InvitesPage() {
  const user = await getCurrentUser();
  const invites = user?.email ? await getPendingInvites(user.email) : [];

  return (
    <div className="max-w-2xl">
      <Eyebrow>Invites</Eyebrow>
      <h1 className="mt-3 text-3xl font-light text-ink">Books you&apos;re invited to</h1>

      {invites.length === 0 ? (
        <div className="mt-12 border border-line p-12 text-center">
          <p className="font-light text-stone">No pending invites right now.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col">
          {invites.map((inv) => {
            const accept = acceptInvite.bind(null, inv.book_id);
            return (
              <li
                key={inv.book_id}
                className="flex items-center justify-between border-b border-line py-5"
              >
                <div>
                  <h2 className="text-lg font-light text-ink">{inv.book_title}</h2>
                  <p className="mt-1 text-sm font-light text-stone">
                    You can add your own recipes to this book.
                  </p>
                </div>
                <form action={accept}>
                  <Button type="submit">Accept</Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
