import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 text-center"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
        404
      </span>
      <h1 className="serif mt-3 text-[28px] font-normal text-ink">Siden finnes ikke.</h1>
      <p className="mt-3 font-light text-stone">
        Kanskje den ble flyttet, eller aldri fantes. La oss finne veien tilbake.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          href="/library"
          className="tap bg-gran px-6 py-3 text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
        >
          Til biblioteket
        </Link>
      </div>
    </main>
  );
}
