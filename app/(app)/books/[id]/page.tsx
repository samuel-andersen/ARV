import { notFound } from "next/navigation";
import { getBookWithContent } from "@/lib/data/books";
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

  const pages = buildBookPages(book, user?.displayName ?? null);
  const pageCount = estimatePageCount(pages);

  return (
    <BookBuilder
      book={book}
      availableRecipes={recipes}
      pages={pages}
      pageCount={pageCount}
    />
  );
}
