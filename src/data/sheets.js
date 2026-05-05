const SHEET_ID = '145vorVJHV8MrvwusdOfsZmqx5pqGZHRhGMEQqKs1RHQ'
const GID = '1455044719'

export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`

const STAGE_MAP = {
  pipeline: 'pipeline',
  frf: 'frf',
  prd: 'prd',
  scheduled: 'scheduled',
  dev: 'dev',
  qa: 'test',
  test: 'test',
  uat: 'uat',
  live: 'live',
  'live-testing': 'live-testing',
  greyscale: 'greyscale',
}

function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  result.push(cur.trim())
  return result
}

function normalizeRange(s) {
  if (!s) return ''
  // Sheet may use slashes (2026/04/20) or dots (2026.04.20) — normalise to dots
  return s.replace(/\//g, '.')
}

export function parseSheetCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return { rows: [], features: [] }

  const features = []
  const seenRowKeys = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const id = cols[0]
    if (!id || !id.trim()) continue

    const product    = cols[1]  || ''
    const market     = cols[2]  || ''
    const name       = cols[3]  || ''
    const prd        = cols[4]  || ''
    const jira       = cols[5]  || ''
    const rawStage   = cols[6]  || 'pipeline'
    const version    = cols[7]  || ''
    const devRange   = normalizeRange(cols[8]  || '')
    const qaRange    = normalizeRange(cols[9]  || '')
    const uatRange   = normalizeRange(cols[10] || '')
    const liveRange  = normalizeRange(cols[11] || '')

    const stage = STAGE_MAP[rawStage.toLowerCase()] ?? 'pipeline'

    const timeline = {}
    if (devRange)  timeline.dev  = devRange
    if (qaRange)   timeline.test = qaRange
    if (uatRange)  timeline.uat  = uatRange
    if (liveRange) timeline.live = liveRange

    features.push({
      id: `fs${id.trim()}`,
      product,
      market,
      name,
      prd,
      jira,
      stage,
      version,
      timeline,
      createdAt: Date.now(),
      archived: false,
    })

    const key = `${product}||${market}`
    if (!seenRowKeys.includes(key)) seenRowKeys.push(key)
  }

  const rows = seenRowKeys.map(k => {
    const [product, market] = k.split('||')
    return { product, market }
  })

  return { rows, features }
}

const DELETED_KEY = 'timeline-tracker-deleted-sheet-ids'

function getDeletedSheetIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]') } catch { return [] }
}

export function recordSheetDeletion(featureId) {
  if (!featureId?.startsWith('fs')) return
  try {
    const ids = getDeletedSheetIds()
    if (!ids.includes(featureId)) {
      localStorage.setItem(DELETED_KEY, JSON.stringify([...ids, featureId]))
    }
  } catch {}
}

export async function initFromSheets() {
  const res = await fetch(SHEET_CSV_URL)
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`)
  const text = await res.text()
  const { rows, features } = parseSheetCSV(text)
  const deleted = getDeletedSheetIds()
  return { rows, features: features.filter(f => !deleted.includes(f.id)) }
}
