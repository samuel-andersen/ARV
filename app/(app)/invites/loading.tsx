export default function InvitesLoading() {
  return (
    <div className="max-w-2xl">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-3 h-7 w-64" />
      <ul className="mt-8 flex flex-col border-t border-line">
        {Array.from({ length: 2 }).map((_, i) => (
          <li key={i} className="flex items-center justify-between border-b border-line py-5">
            <div className="flex-1">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton mt-2 h-3 w-56" />
            </div>
            <div className="skeleton h-11 w-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}
