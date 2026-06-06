# Portfolio Rebalancer

A lightweight, browser-only personal finance tool that helps you align your
investment portfolio with a target asset allocation and gives clear, actionable
rebalancing advice.

Built with **React + Vite**, **Tailwind CSS**, and **Recharts**. No backend
required — everything runs in the browser and persists to `localStorage`.

## Features

- **Target allocation upload (CSV)** — upload `asset_type,percentage` columns.
  Percentages may be written as `80`, `0.8`, or `80%`; they are normalized and
  validated to sum to 100% (±0.1% tolerance). Displayed as a table with visual
  weight bars. Clear and re-upload at any time.
- **Current holdings** — add assets one by one (name, quantity, ticker, asset
  type). Each row shows the current unit price and total value, with a running
  total portfolio value. Edit or delete any holding; everything recalculates in
  real time.
- **Live price fetching** — pluggable price providers (Demo / Yahoo Finance /
  Alpha Vantage / Finnhub) with 10-minute local caching, loading states, and
  graceful fallback to the last known price or manual entry.
- **Asset-type auto-classification** — suggests the best matching asset type
  from your CSV using ticker dictionaries and keyword matching (e.g.
  `VAS` / "Australian" → *Australian Shares*). Always overridable via dropdown.
- **Rebalancing suggestions** — current vs target % per asset type with
  color-coded variance (green ≤2%, amber ≤5%, red >5%), plus a headline "invest
  $X in Y next" recommendation targeting the most underweight asset type.
- **Visualizations** — a current-allocation pie chart and a current-vs-target
  bar chart, both updating live.
- **Export** — download a PDF snapshot (holdings, suggestions, charts) or export
  holdings as CSV.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
npm test         # run unit tests (Vitest)
npm run lint     # run ESLint
```

Open the dev server URL, then:

1. Upload a target-allocation CSV (a sample is downloadable from the upload card).
2. Add your holdings. The app suggests an asset type and fetches a unit price.
3. Review the rebalancing table, charts, and the "next investment" suggestion.
4. Export a PDF or CSV snapshot when you're done.

## CSV format

```csv
asset_type,percentage
Australian Shares,40%
International Shares,30%
US Shares,15%
Bonds,10%
Cash,5%
```

Header aliases are accepted (e.g. `asset`/`category`/`class` for the type,
`target`/`weight`/`allocation` for the percentage).

## Price providers

Configure the provider in the **Settings** panel (gear icon):

| Provider        | API key | Notes                                                        |
| --------------- | ------- | ------------------------------------------------------------ |
| Demo            | No      | Deterministic offline prices — zero setup, great for trying it. |
| Yahoo Finance   | No      | Routed via a public CORS proxy; can be flaky/rate-limited.   |
| Alpha Vantage   | Yes     | Free key, ~25 requests/day. Reliable + CORS-friendly.        |
| Finnhub         | Yes     | Free key. Reliable + CORS-friendly.                          |

If a fetch fails the app keeps the last known price (flagged as stale) and you
can always type a price in manually by clicking the ✎ next to it.

## Tech notes

- State persists to `localStorage` (`portfolio-rebalancer:*` keys).
- Core logic (CSV parsing, classification, rebalancing math) lives in `src/lib/`
  and is covered by unit tests in `src/lib/core.test.js`.
- The PDF toolchain is lazy-loaded so it doesn't bloat the initial bundle.

> Prices are indicative and may be delayed. This tool is for personal planning
> only and is not financial advice.
