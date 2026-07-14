"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthBrowserClient } from "@/lib/supabase/browser";

const inputClass =
  "mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-base";
const labelClass = "block text-sm font-semibold";

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const supabase = createAuthBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: (form.get("email") as string) ?? "",
      password: (form.get("password") as string) ?? "",
    });

    if (signInError) {
      setError("Credentials not recognised.");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded border border-red-700 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-ink px-4 py-3 text-base font-bold text-page disabled:opacity-50"
      >
        {submitting ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
