export default function RecipeLoading() {
  return (
    <article className="paper-sheet mx-auto max-w-3xl p-6 sm:p-10">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-4 h-10 w-4/5" />
      <div className="skeleton mt-4 h-4 w-2/3" />
      <div className="skeleton mt-8 h-11 w-40" />
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-5 w-full" />
          ))}
        </div>
      </div>
    </article>
  );
}
