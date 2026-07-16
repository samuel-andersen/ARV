export default function RecipeLoading() {
  return (
    <article className="-mx-5 bg-snow sm:mx-0 sm:border sm:border-line">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-col gap-5 px-5 py-6 sm:px-8">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-16 w-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" />
          ))}
        </div>
      </div>
    </article>
  );
}
