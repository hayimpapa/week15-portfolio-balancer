const REPO_NAME = 'week15-portfolio-balancer'
const GITHUB_URL = `https://github.com/hayimpapa/${REPO_NAME}`
// Note: this repo has no PROMPTS.txt, so the "The Prompt" section is omitted.

function Card({ heading, children }) {
  return (
    <section className="card">
      <div className="card-body">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {heading}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-ink-700">{children}</div>
      </div>
    </section>
  )
}

export default function AboutThisBuild() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">About This Build</h1>
        <p className="mt-2 text-sm text-ink-500">
          Week 15 of{' '}
          <strong className="font-semibold text-ink-700">
            52 Apps in 52 Weeks Before I Turn 52
          </strong>{' '}
          by Hey I&apos;m Papa
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <Card heading="The Problem">
          Keeping an investment portfolio aligned with a target asset allocation is
          tedious. As prices drift you have to track each holding&apos;s current value,
          work out what percentage every asset class actually represents, compare that
          against your targets, and then decide where to put your next dollar. Most
          tools demand an account and a backend, or leave you wrestling with a
          spreadsheet. This app makes that whole loop quick, private, and
          backend-free.
        </Card>

        <Card heading="The App">
          Portfolio Rebalancer is a browser-only personal finance tool built with{' '}
          <strong className="font-semibold text-ink-900">React + Vite</strong>,{' '}
          <strong className="font-semibold text-ink-900">Tailwind CSS</strong>, and{' '}
          <strong className="font-semibold text-ink-900">Recharts</strong>. Upload a
          target-allocation CSV, add your holdings, and the app fetches live unit
          prices (pluggable Demo / Yahoo / Alpha Vantage / Finnhub providers with local
          caching), auto-classifies asset types, and produces color-coded rebalancing
          suggestions plus pie and bar charts. Everything runs client-side and persists
          to <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code>{' '}
          — no server required — and you can export a PDF or CSV snapshot.
        </Card>

        <Card heading="GitHub Repo">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.36 9.36 0 0112 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0022 12.25C22 6.58 17.52 2 12 2z" />
            </svg>
            View on GitHub
          </a>
        </Card>
      </div>
    </main>
  )
}
