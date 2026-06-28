"use client";

import { useActionState } from "react";
import { authenticate, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink/70">ایمیل</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="rounded-md border border-hairline bg-transparent px-3 py-2 text-ink outline-none focus:border-ring"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink/70">گذرواژه</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-hairline bg-transparent px-3 py-2 text-ink outline-none focus:border-ring"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-primary px-4 py-2 font-medium text-bg transition-opacity disabled:opacity-60"
      >
        {pending ? "در حال ورود…" : "ورود"}
      </button>
    </form>
  );
}
