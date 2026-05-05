import { useState, useCallback } from 'react'
import { STAGES, DEFAULT_ROWS, DEFAULT_FEATURES } from '../data/constants'

const STORAGE_KEY = 'timeline-tracker-v3'
const REQUIRED_TIMELINE_STAGES = ['dev', 'test', 'uat', 'live']

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateState(JSON.parse(raw))
  } catch {}
  return migrateState({ rows: DEFAULT_ROWS, features: DEFAULT_FEATURES })
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function migrateState(state) {
  const now = Date.now()
  const rows = Array.isArray(state?.rows) ? state.rows : DEFAULT_ROWS
  const features = Array.isArray(state?.features) ? state.features : DEFAULT_FEATURES

  return {
    rows,
    features: features.map(f => {
      const createdAt = typeof f.createdAt === 'number'
        ? f.createdAt
        : inferCreatedAtFromId(f.id) ?? now
      return { ...f, createdAt, archived: Boolean(f.archived) }
    }),
  }
}

function inferCreatedAtFromId(id) {
  if (!id) return null
  const m = String(id).match(/^f(\d{10,})$/) // f<epoch-ms>
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

// ── Date helpers ────────────────────────────────────────────────
export function parseTrackerDate(s) {
  // Expects "YYYY.MM.DD"
  if (!s) return null
  const [y, m, d] = s.split('.')
  const dt = new Date(+y, +m - 1, +d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

function parseRange(rangeStr) {
  if (!rangeStr) return null
  const [start, end] = rangeStr.split('-')
  return { start: parseTrackerDate(start), end: parseTrackerDate(end) }
}

export function isTimelineRequired(stage) {
  return STAGES.indexOf(stage) >= STAGES.indexOf('scheduled')
}

export function validateRequiredTimeline(timeline) {
  const errors = []
  const t = timeline || {}

  for (const s of REQUIRED_TIMELINE_STAGES) {
    const r = parseRange(t[s])
    if (!r || !r.start || !r.end) {
      errors.push(`${s} is required`)
      continue
    }
    if (r.start > r.end) errors.push(`${s} start must be <= end`)
  }

  return { ok: errors.length === 0, errors }
}

export function hasTimelineError(feature) {
  if (!isTimelineRequired(feature?.stage)) return false
  return !validateRequiredTimeline(feature?.timeline).ok
}

/**
 * Given a feature and today's Date, return the effective display stage.
 * Timeline entries drive auto-progression for timed stages.
 * Manual stage is the floor — we only advance forward, never backward.
 */
export function computeDisplayStage(feature, today) {
  const { stage, timeline } = feature
  if (!timeline || Object.keys(timeline).length === 0) return stage

  const timedOrder = ['dev', 'test', 'uat', 'live', 'live-testing', 'greyscale']
  let derived = stage
  let lastProvidedStage = null
  let lastProvidedRange = null

  for (const s of timedOrder) {
    if (!timeline[s]) continue
    const range = parseRange(timeline[s])
    if (!range || !range.start || !range.end) continue
    lastProvidedStage = s
    lastProvidedRange = range

    // If we're inside the window, that's the display stage
    if (today >= range.start && today <= range.end) derived = s

    // If we've passed the start, we should be at least here (unless another later window is active)
    if (today > range.start && STAGES.indexOf(derived) < STAGES.indexOf(s)) derived = s
  }

  // If we only have earlier stages filled and we're already past the end of the last provided window,
  // advance to the next timed stage (e.g. Dev ends → show Test) even if that next window isn't filled.
  if (lastProvidedStage && lastProvidedRange && today > lastProvidedRange.end) {
    const nextIdx = timedOrder.indexOf(lastProvidedStage) + 1
    const nextStage = timedOrder[nextIdx]
    if (nextStage) derived = nextStage
  }

  const derivedIdx = STAGES.indexOf(derived)
  const manualIdx  = STAGES.indexOf(stage)
  return derivedIdx >= manualIdx ? derived : stage
}

/**
 * Return the date-range string for the active stage, formatted for display.
 * e.g. "Dev: 2026.04.27 – 2026.05.29"
 */
export function getActiveRangeLabel(feature, displayStage) {
  const range = feature.timeline?.[displayStage]
  if (!range) return null
  const [start, end] = range.split('-')
  return `${displayStage.charAt(0).toUpperCase() + displayStage.slice(1)}: ${start} – ${end}`
}

// ── Parse timeline textarea ─────────────────────────────────────
export function parseTimelineText(text) {
  const result = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^(\S+)\s+(\d{4}\.\d{2}\.\d{2}-\d{4}\.\d{2}\.\d{2})$/)
    if (match) result[match[1].toLowerCase()] = match[2]
  }
  return result
}

export function timelineToText(timeline) {
  return Object.entries(timeline || {})
    .map(([s, r]) => `${s} ${r}`)
    .join('\n')
}

// ── Hook ────────────────────────────────────────────────────────
export function useTimeline() {
  const [state, setState] = useState(loadFromStorage)

  const commit = useCallback((next) => {
    setState(next)
    save(next)
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all unique products / markets for autocomplete
  const products = [...new Set(state.rows.map(r => r.product))]
  const markets  = [...new Set(state.rows.map(r => r.market))]

  // Features visible in a given cell
  const featuresAt = useCallback((product, market, stage) => {
    return state.features.filter(f =>
      f.product === product &&
      f.market  === market  &&
      computeDisplayStage(f, today) === stage
    )
  }, [state.features, today])

  // Add or update feature
  const upsertFeature = useCallback((data) => {
    const { id, product, market } = data
    let next = { ...state }

    // Ensure row exists
    if (!next.rows.some(r => r.product === product && r.market === market)) {
      next.rows = [...next.rows, { product, market }]
    }

    if (id) {
      next.features = next.features.map(f => {
        if (f.id !== id) return f
        return { ...f, ...data, createdAt: typeof f.createdAt === 'number' ? f.createdAt : Date.now() }
      })
    } else {
      const createdAt = Date.now()
      next.features = [...next.features, { id: `f${createdAt}`, createdAt, archived: false, ...data }]
    }

    commit(next)
  }, [state, commit])

  const deleteFeature = useCallback((id) => {
    commit({ ...state, features: state.features.filter(f => f.id !== id) })
  }, [state, commit])

  const setArchived = useCallback((id, archived) => {
    commit({
      ...state,
      features: state.features.map(f => f.id === id ? { ...f, archived: Boolean(archived) } : f),
    })
  }, [state, commit])

  const moveFeature = useCallback((id, dir) => {
    const f = state.features.find(x => x.id === id)
    if (!f) return
    const cur = computeDisplayStage(f, today)
    const idx = STAGES.indexOf(cur)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= STAGES.length) return
    const next = { ...f, stage: STAGES[newIdx] }
    commit({ ...state, features: state.features.map(x => x.id === id ? next : x) })
  }, [state, commit, today])

  const addRow = useCallback((product, market) => {
    if (state.rows.some(r => r.product === product && r.market === market)) return
    commit({ ...state, rows: [...state.rows, { product, market }] })
  }, [state, commit])

  return {
    rows: state.rows,
    features: state.features,
    today,
    products,
    markets,
    featuresAt,
    upsertFeature,
    deleteFeature,
    setArchived,
    moveFeature,
    addRow,
  }
}
