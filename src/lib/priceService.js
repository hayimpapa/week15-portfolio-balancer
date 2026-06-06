// Asset price fetching with caching, multiple providers, and graceful fallback.
//
// Because this is a no-backend, browser-only app, "real" price providers have
// trade-offs:
//   - Yahoo Finance: no API key, but needs a CORS proxy from the browser.
//   - Alpha Vantage / Finnhub: reliable + CORS-friendly, but require a free key.
//   - Demo: deterministic pseudo-prices so the app is fully usable offline.
//
// The provider + optional key are configured in Settings and stored locally.
// All providers fall back to the cache (last known price) on failure, and the
// UI always allows manual price entry.

import { loadJSON, saveJSON } from './storage.js'

const CACHE_KEY = 'price-cache'
const CONFIG_KEY = 'price-config'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export const PROVIDERS = {
  demo: { label: 'Demo (offline, deterministic prices)', needsKey: false },
  yahoo: { label: 'Yahoo Finance (via public CORS proxy)', needsKey: false },
  alphavantage: { label: 'Alpha Vantage (free API key)', needsKey: true },
  finnhub: { label: 'Finnhub (free API key)', needsKey: true },
}

export function getConfig() {
  return loadJSON(CONFIG_KEY, { provider: 'demo', apiKey: '' })
}

export function setConfig(config) {
  saveJSON(CONFIG_KEY, config)
}

function readCache() {
  return loadJSON(CACHE_KEY, {})
}

function writeCache(cache) {
  saveJSON(CACHE_KEY, cache)
}

export function getCachedPrice(ticker) {
  if (!ticker) return null
  const cache = readCache()
  return cache[ticker.toUpperCase()] || null
}

function setCachedPrice(ticker, price) {
  const cache = readCache()
  cache[ticker.toUpperCase()] = { price, fetchedAt: Date.now() }
  writeCache(cache)
}

export function clearPriceCache() {
  writeCache({})
}

// --- Deterministic demo pricing -------------------------------------------

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function demoPrice(ticker) {
  const key = (ticker || 'CASH').toUpperCase()
  if (key.includes('CASH')) return 1
  const h = hashString(key)
  // Spread demo prices across a realistic $5 - $505 range, 2 decimals.
  const base = 5 + (h % 50000) / 100
  return Math.round(base * 100) / 100
}

// --- Provider fetchers ------------------------------------------------------

async function fetchYahoo(ticker) {
  // Yahoo's quote endpoint blocks browser CORS, so we route through a public
  // proxy. This can be rate-limited/flaky; failures fall back to cache/manual.
  const target = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo proxy responded ${res.status}`)
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  const price = result?.meta?.regularMarketPrice
  if (typeof price !== 'number') throw new Error('No price in Yahoo response')
  return price
}

async function fetchAlphaVantage(ticker, apiKey) {
  if (!apiKey) throw new Error('Alpha Vantage API key required')
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    ticker,
  )}&apikey=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Alpha Vantage responded ${res.status}`)
  const data = await res.json()
  if (data?.Note) throw new Error('Alpha Vantage rate limit reached')
  const price = Number(data?.['Global Quote']?.['05. price'])
  if (Number.isNaN(price) || price === 0) throw new Error('No price in Alpha Vantage response')
  return price
}

async function fetchFinnhub(ticker, apiKey) {
  if (!apiKey) throw new Error('Finnhub API key required')
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(
    apiKey,
  )}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Finnhub responded ${res.status}`)
  const data = await res.json()
  const price = Number(data?.c)
  if (Number.isNaN(price) || price === 0) throw new Error('No price in Finnhub response')
  return price
}

/**
 * Fetch the current unit price for a ticker.
 *
 * @param {string} ticker
 * @param {object} [opts]
 * @param {boolean} [opts.force]  bypass the cache TTL
 * @returns {Promise<{ price:number, fetchedAt:number, source:string, stale?:boolean, error?:string }>}
 */
export async function fetchPrice(ticker, opts = {}) {
  const symbol = (ticker || '').trim().toUpperCase()
  if (!symbol) {
    return { price: null, error: 'No ticker provided', source: 'none' }
  }

  // Serve fresh cache hits.
  const cached = getCachedPrice(symbol)
  if (!opts.force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, source: 'cache' }
  }

  const { provider, apiKey } = getConfig()

  try {
    let price
    switch (provider) {
      case 'yahoo':
        price = await fetchYahoo(symbol)
        break
      case 'alphavantage':
        price = await fetchAlphaVantage(symbol, apiKey)
        break
      case 'finnhub':
        price = await fetchFinnhub(symbol, apiKey)
        break
      case 'demo':
      default:
        price = demoPrice(symbol)
        break
    }
    setCachedPrice(symbol, price)
    return { price, fetchedAt: Date.now(), source: provider }
  } catch (err) {
    // Graceful degradation: return last known price if we have one.
    if (cached) {
      return { ...cached, source: 'cache', stale: true, error: err.message }
    }
    return { price: null, error: err.message, source: provider }
  }
}
