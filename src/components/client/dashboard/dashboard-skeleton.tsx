import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dashboard layout (hero → energy flow → performance). */
export function DashboardSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-5 pb-6 lg:gap-6"
      role="status"
      aria-label="Chargement du tableau de bord"
    >
      <div className="rounded-2xl border border-line bg-white p-5 shadow-joya-sm sm:p-7">
        <Skeleton className="h-4 w-36 rounded-pill" />
        <Skeleton className="mt-4 h-8 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-48" />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-36 rounded-pill" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-joya-sm">
        <div className="flex items-end justify-between gap-3 border-b border-line px-5 py-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 min-[901px]:grid-cols-[1.6fr_1fr]">
          <Skeleton className="aspect-[1024/742] rounded-xl" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="min-h-[5.5rem] flex-1 rounded-xl bg-success-soft" />
            <Skeleton className="min-h-[5.5rem] flex-1 rounded-xl bg-coral-wash" />
            <Skeleton className="min-h-[5.5rem] flex-1 rounded-xl bg-blue-soft" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-joya-sm">
        <div className="border-b border-line px-5 py-4">
          <Skeleton className="h-3 w-24 rounded-pill" />
          <Skeleton className="mt-2 h-5 w-40" />
        </div>
        <div className="space-y-8 p-5 sm:p-6">
          {[4, 4, 3].map((count, row) => (
            <div key={row}>
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-[12px]" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div
                className={cn(
                  "grid grid-cols-1 gap-3 xs:grid-cols-2",
                  count === 4 ? "lg:grid-cols-4" : "sm:grid-cols-3",
                )}
              >
                {Array.from({ length: count }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
