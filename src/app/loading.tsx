export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 py-10" aria-busy="true" aria-live="polite">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-ink-100" />
      <div className="h-4 w-80 animate-pulse rounded bg-ink-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-ink-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-ink-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-ink-100" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-ink-100" />
      <p className="text-center text-xs text-ink-400">Carregando…</p>
    </div>
  );
}
