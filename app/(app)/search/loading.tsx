export default function SearchLoading() {
  return (
    <div>
      <div className="skeleton mt-2 h-7 w-24" />
      <div className="skeleton mt-5 h-12 w-full" />
      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="border border-line bg-snow">
            <div className="skeleton aspect-[4/5] w-full" />
            <div className="p-4">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton mt-3 h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
