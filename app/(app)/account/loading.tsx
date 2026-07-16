export default function AccountLoading() {
  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 pt-2">
        <div className="skeleton h-14 w-14 shrink-0" />
        <div className="flex-1">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton mt-2 h-3 w-56" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-px border-y border-line bg-line">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-papir py-5">
            <div className="skeleton mx-auto h-5 w-8" />
            <div className="skeleton mx-auto mt-2 h-2 w-14" />
          </div>
        ))}
      </div>
      <div className="skeleton mt-6 h-16 w-full" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
