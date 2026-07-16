import { getPendingInvites } from "@/lib/data/books";
import { getCurrentUser } from "@/lib/auth/user";
import { acceptInvite } from "@/lib/actions/books";
import { Button } from "@/components/ui/button";

export default async function InvitesPage() {
  const user = await getCurrentUser();
  const invites = user?.email ? await getPendingInvites(user.email) : [];

  return (
    <div className="max-w-2xl">
      <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
        Invitasjoner
      </span>
      <h1 className="serif mt-2 text-[27px] font-light text-ink">Bøker du er invitert til</h1>

      {invites.length === 0 ? (
        <div className="mt-10 border border-line bg-snow p-12 text-center">
          <p className="font-light text-stone">Ingen invitasjoner akkurat nå.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col border-t border-line">
          {invites.map((inv) => {
            const accept = acceptInvite.bind(null, inv.book_id);
            return (
              <li
                key={inv.book_id}
                className="flex items-center justify-between border-b border-line py-5"
              >
                <div>
                  <h2 className="serif text-[18px] font-normal text-ink">{inv.book_title}</h2>
                  <p className="mt-1 text-sm font-light text-stone">
                    Du kan legge til dine egne oppskrifter i denne boken.
                  </p>
                </div>
                <form action={accept}>
                  <Button type="submit">Godta</Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
