// Tiny localStorage helpers with namespacing and safe JSON handling.

const PREFIX = 'portfolio-rebalancer:'

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Ignore quota / private-mode errors — persistence is best-effort.
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}
