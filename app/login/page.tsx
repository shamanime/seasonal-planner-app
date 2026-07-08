import { sendMagicLink } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; next?: string }> }) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 pb-16">
      <section className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-card backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">Passwordless sign in</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold">Check your email, then start planning.</h1>
        <p className="mt-4 leading-7 text-ink/70">Enter your email and Supabase Auth will send a magic link.</p>
        {params.sent ? <p className="mt-5 rounded-2xl bg-skywash px-4 py-3 text-sm font-bold">Magic link sent. Open it on this device.</p> : null}
        {params.error ? <p className="mt-5 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-800">{params.error}</p> : null}
        <form action={sendMagicLink} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
          <label className="block text-sm font-bold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-leaf/30 focus:ring-4"
          />
          <button type="submit" className="w-full rounded-2xl bg-ink px-5 py-3 font-bold text-white hover:bg-black">
            Send magic link
          </button>
        </form>
      </section>
    </main>
  );
}
