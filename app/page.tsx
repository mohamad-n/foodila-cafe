import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">منوی کافه</h1>
      <p className="text-ink/60">Café Menu SaaS</p>
      <Link
        href="/login"
        className="rounded-md border border-hairline px-4 py-2 text-sm text-ink/80 hover:border-primary hover:text-ink"
      >
        ورود به پنل مدیریت
      </Link>
    </main>
  );
}
