"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 text-center"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
        Noe stoppet opp
      </span>
      <h1 className="serif mt-3 text-[28px] font-normal text-ink">Beklager — det gikk galt.</h1>
      <p className="mt-3 font-light text-stone">
        En uventet feil oppsto. Prøv igjen — skjer det på nytt, gi beskjed.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="tap bg-gran px-6 py-3 text-[13px] font-medium text-snow transition-opacity hover:opacity-85"
        >
          Prøv igjen
        </button>
        <a
          href="/library"
          className="tap border border-line px-6 py-3 text-[13px] font-medium text-gran transition-colors hover:border-gran"
        >
          Til biblioteket
        </a>
      </div>
    </main>
  );
}
