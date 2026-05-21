"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-stone-500">Checking sign-in...</span>;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("github")}
        className="rounded-sm border border-stone-300 bg-white px-3 py-1 text-sm hover:border-stone-600"
      >
        Sign in with GitHub
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-stone-600">
      <span>{session.user.email || session.user.name}</span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-sm border border-stone-300 bg-white px-3 py-1 text-sm hover:border-stone-600"
      >
        Sign out
      </button>
    </div>
  );
}