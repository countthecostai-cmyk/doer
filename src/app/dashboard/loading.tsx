import { SkeletonBar, SkeletonList, SkeletonPage } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <SkeletonBar className="h-8 w-40" />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
              <SkeletonBar className="mb-2 h-3 w-16" />
              <SkeletonBar className="h-5 w-12" />
            </div>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="h-4 w-16" />
          </div>
          <SkeletonList rows={3} />
        </section>

        <div className="flex flex-wrap gap-3" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBar key={i} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
