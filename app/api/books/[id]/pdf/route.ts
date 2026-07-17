import { renderToBuffer } from "@react-pdf/renderer";
import { getBookWithContent, getBookFamily } from "@/lib/data/books";
import { getCurrentUser } from "@/lib/auth/user";
import { buildBookPages } from "@/lib/book/layout";
import { registerPrintFonts } from "@/lib/pdf/fonts";
import { BookDocument } from "@/lib/pdf/editorial";

// react-pdf needs Node APIs (fontkit, fs) — never the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const book = await getBookWithContent(id);
  if (!book) {
    return new Response("Not found", { status: 404 });
  }

  registerPrintFonts();
  const family = await getBookFamily(id, book.owner_id);
  const contributorNames = family.filter((m) => m.accepted && !m.isOwner).map((m) => m.name ?? "");
  const pages = buildBookPages(book, user.displayName, user.avatarUrl, contributorNames);
  // react-pdf requires the ROOT element to be a <Document>, so we call the
  // builder to get the element rather than wrapping it in a component.
  const element = BookDocument({ pages, title: book.title }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  const filename = `${book.title.replace(/[^\w\-]+/g, "-").toLowerCase() || "arv-book"}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
