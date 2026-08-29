import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Start doing tasks</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Create an account, then apply to become a Doer to start browsing and claiming tasks.
      </p>
      <AuthForm mode="sign-up" action={signUp} />
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-neutral-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
