import { Skeleton } from "@/components/ui/skeleton";

export default function VendorsLoading() {
  return (
    <div dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      {/* Search/Filter bar */}
      <div className="mb-4 flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
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
