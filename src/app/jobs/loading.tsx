import { SkeletonBar, SkeletonList, SkeletonPage } from "@/components/Skeleton";

export default function MyJobsLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">My jobs</h1>
          <p className="text-sm text-neutral-500">Tasks you&apos;ve claimed, active and past.</p>
        </div>

        <section>
          <SkeletonBar className="mb-3 h-5 w-20" />
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
