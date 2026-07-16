export default function LibraryLoading() {
  return (
    <div>
      <div className="skeleton mt-2 h-8 w-64" />
      <div className="skeleton mt-3 h-4 w-72" />
      <div className="skeleton mt-6 h-[52px] w-full" />
      <div className="skeleton mt-3 h-[46px] w-full" />
      {/* Featured */}
      <div className="mt-6 border border-line bg-snow">
        <div className="skeleton aspect-[16/10] w-full" />
        <div className="p-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-3 h-5 w-2/3" />
        </div>
      </div>
      {/* Feed grid */}
      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
