import { cn } from "@/lib/utils";

/** Brand-tinted shimmer placeholder (disabled under reduced motion). */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("joya-skeleton", className)} {...props} />;
}

export { Skeleton };
