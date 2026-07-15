export default function LibraryLoading() {
  return (
    <div>
      <div className="skeleton h-3 w-20" />
      <div className="skeleton mt-4 h-8 w-48" />
      <div className="skeleton mt-8 h-11 w-full max-w-sm" />
      <ul className="mt-8 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="bg-snow p-5">
            <div className="skeleton h-3 w-14" />
            <div className="skeleton mt-4 h-5 w-3/4" />
            <div className="skeleton mt-2 h-4 w-full" />
            <div className="skeleton mt-4 h-3 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
