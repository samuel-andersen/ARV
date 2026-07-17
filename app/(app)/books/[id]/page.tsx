import { notFound } from "next/navigation";
import { getBookWithContent, getBookFamily } from "@/lib/data/books";
import { listRecipes } from "@/lib/data/recipes";
import { getCurrentUser } from "@/lib/auth/user";
import { buildBookPages, estimatePageCount } from "@/lib/book/layout";
import { BookBuilder } from "@/components/book/book-builder";

export default async function BookBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [book, recipes, user] = await Promise.all([
    getBookWithContent(id),
    listRecipes(),
    getCurrentUser(),
  ]);
  if (!book) notFound();

  const isOwner = !!user && user.id === book.owner_id;
  const family = await getBookFamily(id, book.owner_id);
  const ownerName = family.find((m) => m.isOwner)?.name ?? null;
  const contributorNames = family.filter((m) => m.accepted && !m.isOwner).map((m) => m.name ?? "");

  const pages = buildBookPages(
    book,
    user?.displayName ?? null,
    user?.avatarUrl ?? null,
    contributorNames,
  );
  const pageCount = estimatePageCount(pages);

  return (
    <BookBuilder
      book={book}
      availableRecipes={recipes}
      pages={pages}
      pageCount={pageCount}
      isOwner={isOwner}
      currentUserId={user?.id ?? null}
      family={family}
      ownerName={ownerName}
    />
  );
}
