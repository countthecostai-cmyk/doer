import { SkeletonBar, SkeletonList, SkeletonPage } from "@/components/Skeleton";

export default function EarningsLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">Earnings</h1>
          <p className="text-sm text-neutral-500">Includes 100% of tips on top of your task payout.</p>
        </div>

        <section className="grid grid-cols-2 gap-3" aria-hidden="true">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <SkeletonBar className="mb-2 h-3 w-16" />
            <SkeletonBar className="h-6 w-20" />
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <SkeletonBar className="mb-2 h-3 w-16" />
            <SkeletonBar className="h-6 w-20" />
          </div>
        </section>

        <section>
          <SkeletonBar className="mb-3 h-5 w-32" />
          <SkeletonList rows={3} />
        </section>

        <section>
          <SkeletonBar className="mb-3 h-5 w-24" />
          <SkeletonList rows={2} />
        </section>
      </div>
    </SkeletonPage>
  );
}
