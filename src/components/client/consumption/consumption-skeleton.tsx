export function ConsumptionSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-4 pb-8 max-lg:bg-cream lg:gap-5">
      <div className="h-14 rounded-xl bg-slate-200/60" />
      <div className="h-28 rounded-xl bg-white shadow-sm" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 rounded-xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-white shadow-sm" />
    </div>
  );
}
