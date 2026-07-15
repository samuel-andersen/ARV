import { ImportFlow } from "@/components/import/import-flow";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string }>;
}) {
  const { url, text } = await searchParams;
  // Share-target may deliver the link in `url` or embedded in `text`.
  const shared = url ?? extractUrl(text);
  return <ImportFlow initialUrl={shared} />;
}

function extractUrl(text?: string): string | undefined {
  if (!text) return undefined;
  const m = text.match(/https?:\/\/\S+/);
  return m?.[0];
}
