export default function BooksLoading() {
  return (
    <div>
      <div className="skeleton h-3 w-16" />
      <div className="skeleton mt-4 h-8 w-40" />
      <ul className="mt-8 flex flex-col">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-center justify-between border-b border-line py-5">
            <div className="flex-1">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton mt-2 h-3 w-1/3" />
            </div>
            <div className="skeleton h-3 w-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}
