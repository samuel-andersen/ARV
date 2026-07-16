export const metadata = { title: "Frakoblet" };

export default function OfflinePage() {
  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 text-center"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-stone">
        Frakoblet
      </span>
      <h1 className="serif mt-3 text-[28px] font-normal text-ink">Ingen forbindelse.</h1>
      <p className="mt-3 font-light text-stone">
        Arv trenger nett for å hente oppskriftene dine. Prøv igjen når du er tilbake på nettet.
      </p>
    </main>
  );
}
