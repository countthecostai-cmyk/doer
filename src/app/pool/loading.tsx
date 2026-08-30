import { SkeletonList, SkeletonPage } from "@/components/Skeleton";

export default function PoolLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Job pool</h1>
          <p className="text-sm text-neutral-500">
            Every open task, oldest first. Tap one to see details and accept it.
          </p>
        </div>
        <SkeletonList rows={5} />
      </div>
    </SkeletonPage>
  );
}
