import { SkeletonBar, SkeletonCard, SkeletonPage } from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-neutral-500">Your application status, verification, and details.</p>
        </div>

        <SkeletonBar className="h-9 w-full rounded-lg" />

        <div className="space-y-2" aria-hidden="true">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-11 w-full rounded-lg" />
          <SkeletonBar className="h-11 w-full rounded-lg" />
        </div>

        <div>
          <SkeletonBar className="mb-2 h-4 w-28" />
          <SkeletonCard />
        </div>
      </div>
    </SkeletonPage>
  );
}
