export function MonitoringSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 pb-6 lg:gap-5">
      <div className="space-y-2">
        <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-64 max-w-full joya-skeleton" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-joya-sm">
        <div className="h-14 animate-pulse border-b border-slate-100 bg-slate-100/80" />
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-36 joya-skeleton rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:gap-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="min-h-[18rem] joya-skeleton rounded-xl sm:min-h-[22rem] lg:min-h-[26rem]" />
          <div className="min-h-[18rem] joya-skeleton rounded-xl sm:min-h-[22rem] lg:min-h-[26rem]" />
        </div>
        <div className="min-h-[18rem] joya-skeleton rounded-xl sm:min-h-[22rem] lg:min-h-[26rem]" />
      </div>
    </div>
  );
}
