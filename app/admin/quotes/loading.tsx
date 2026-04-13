import { Skeleton } from "@/components/ui/skeleton";

export default function QuotesLoading() {
  return (
    <div dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-white">
        <div className="border-b border-brand-dark/10 px-5 py-3">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-brand-dark/5 px-5 py-4">
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
