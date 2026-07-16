export default function BookLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="skeleton h-3 w-28" />
          <div className="skeleton mt-3 h-8 w-52" />
        </div>
        <div className="skeleton h-11 w-44" />
      </div>
      <div className="skeleton h-9 w-full" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
        <div className="skeleton hidden h-[70vh] w-full lg:block" />
      </div>
    </div>
  );
}
