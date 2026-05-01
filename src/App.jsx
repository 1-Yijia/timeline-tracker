import { useEffect, useMemo, useState } from 'react'
import { STAGES, STAGE_LABELS } from './data/constants'
import { useTimeline, computeDisplayStage } from './hooks/useTimeline'
import { FeatureCard } from './components/FeatureCard'
import { FeatureModal } from './components/FeatureModal'
import { AddRowModal } from './components/AddRowModal'
import { Button, Input } from './components/UI'
import { ThemeModal, PASTEL_PALETTE } from './components/ThemeModal'

const COL_PRODUCT = 70
const COL_MARKET = 74
const THEME_KEY = 'timeline-tracker-theme-v1'
const STAGE_COL_MIN = 74
const STAGE_COL_MAX = 140
const EXTRA_STAGES = ['live-testing', 'greyscale']
const BOARD_STAGES = STAGES.filter(s => !EXTRA_STAGES.includes(s))

export default function App() {
  const {
    rows, features, today, products, markets,
    upsertFeature, deleteFeature, setArchived, moveFeature, addRow,
  } = useTimeline()

  const [featureModal, setFeatureModal] = useState({ open: false, data: null })
  const [rowModal, setRowModal] = useState(false)
  const [themeModal, setThemeModal] = useState(false)
  const [stageColWidth, setStageColWidth] = useState(STAGE_COL_MAX)
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'archived'
  const [archiveQuery, setArchiveQuery] = useState('')
  const [archiveSort, setArchiveSort] = useState('desc') // 'asc' | 'desc'

  const [themeByRowKey, setThemeByRowKey] = useState(() => {
    try { return JSON.parse(localStorage.getItem(THEME_KEY) || '{}') } catch { return {} }
  })

  const uniqueRowKeys = useMemo(() => {
    const seen = new Set()
    for (const r of rows) seen.add(rowKey(r.product, r.market))
    return [...seen]
  }, [rows])

  // Ensure every (product, market) has a colour assignment
  useEffect(() => {
    setThemeByRowKey(prev => {
      let changed = false
      const next = { ...prev }
      uniqueRowKeys.forEach((k, idx) => {
        if (next[k]) return
        next[k] = PASTEL_PALETTE[idx % PASTEL_PALETTE.length].id
        changed = true
      })
      return changed ? next : prev
    })
  }, [uniqueRowKeys])

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, JSON.stringify(themeByRowKey)) } catch { /* ignore */ }
  }, [themeByRowKey])

  // Fit all stage columns into the viewport (no horizontal scrolling)
  useEffect(() => {
    function recompute() {
      const available = window.innerWidth - (COL_PRODUCT + COL_MARKET)
      const w = Math.floor(available / BOARD_STAGES.length)
      const clamped = Math.max(STAGE_COL_MIN, Math.min(STAGE_COL_MAX, w))
      setStageColWidth(clamped)
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  // Open edit modal for an existing feature
  function openEdit(id) {
    const f = features.find(x => x.id === id)
    if (f) setFeatureModal({ open: true, data: f })
  }

  // Open add modal pre-filled with product/market/stage context
  function openAdd(product, market, stage) {
    setFeatureModal({
      open: true,
      data: { product: product || '', market: market || '', stage: stage || 'pipeline' },
    })
  }

  const todayLabel = today.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  // Track which product we last rendered for visual grouping
  let lastProduct = null
  const showArchived = activeTab === 'archived'

  function featuresAtView(product, market, stage) {
    return features.filter(f =>
      f.product === product &&
      f.market === market &&
      Boolean(f.archived) === showArchived &&
      computeDisplayStage(f, today) === stage
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        gap: 16,
        flex: '0 0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontSize: 14, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Timeline
          </span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            color: 'var(--text2)',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            padding: '4px 10px', borderRadius: 20,
          }}>
            {todayLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant={activeTab === 'archived' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(activeTab === 'archived' ? 'active' : 'archived')}
          >
            Archive
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setThemeModal(true)}>Theme</Button>
          <Button variant="ghost" size="sm" onClick={() => setRowModal(true)}>+ Row</Button>
          <Button variant="primary" size="sm" onClick={() => openAdd(null, null, null)}>+ Feature</Button>
        </div>
      </header>

      {showArchived ? (
        <ArchiveView
          features={features.filter(f => Boolean(f.archived))}
          query={archiveQuery}
          setQuery={setArchiveQuery}
          sortDir={archiveSort}
          setSortDir={setArchiveSort}
          onOpen={openEdit}
        />
      ) : (
        <div style={{ padding: '0 0 24px', overflowY: 'auto', overflowX: 'hidden', flex: '1 1 auto', background: 'var(--bg)' }}>
          <table style={{
            borderCollapse: 'separate', borderSpacing: 0,
            width: '100%',
            tableLayout: 'fixed',
          }}>
            <thead>
              <tr>
                <th style={thStyle({ width: COL_PRODUCT, left: 0 })}>Product</th>
                <th style={thStyle({ width: COL_MARKET, left: COL_PRODUCT })}>Market</th>
                {BOARD_STAGES.map(s => (
                  <th key={s} style={thStyle({ width: stageColWidth })}>
                    {STAGE_LABELS[s]}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, ri) => {
                const showProduct = row.product !== lastProduct
                lastProduct = row.product

                const rowColors = getRowColors(row.product, row.market, themeByRowKey)

                return (
                  <tr key={`${row.product}-${row.market}-${ri}`}>
                    {/* Product cell */}
                    <td style={{ ...tdLabel, left: 0, zIndex: 40, ...rowColors.labelCell }}>
                      {showProduct && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.15 }}>
                          {row.product}
                        </span>
                      )}
                    </td>

                    {/* Market cell */}
                    <td style={{ ...tdLabel, left: COL_PRODUCT, zIndex: 40, borderRight: '1px solid var(--border2)', ...rowColors.labelCell }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.15 }}>
                        {row.market}
                      </span>
                    </td>

                    {/* Stage cells */}
                  {BOARD_STAGES.map(stage => {
                      const cellFeatures = featuresAtView(row.product, row.market, stage)
                      return (
                        <td key={stage} style={tdCell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {cellFeatures.map(f => (
                              <FeatureCard
                                key={f.id}
                                feature={f}
                                displayStage={computeDisplayStage(f, today)}
                                onEdit={openEdit}
                                onMove={moveFeature}
                                onArchive={setArchived}
                                rowAccent={rowColors.accent}
                              />
                            ))}
                            {/* Add button */}
                            <AddButton onClick={() => openAdd(row.product, row.market, stage)} />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>

        {/* Post-live stages (outside main window) */}
        <div style={{ padding: '12px 0 0' }}>
          <div style={{
            padding: '0 0 8px',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text3)',
          }}>
            Post-live
          </div>
          <table style={{
            borderCollapse: 'separate', borderSpacing: 0,
            width: '100%',
            tableLayout: 'fixed',
          }}>
            <thead>
              <tr>
                <th style={thStyle({ width: COL_PRODUCT, left: 0 })}>Product</th>
                <th style={thStyle({ width: COL_MARKET, left: COL_PRODUCT })}>Market</th>
                {EXTRA_STAGES.map(s => (
                  <th key={s} style={thStyle({ width: stageColWidth })}>
                    {STAGE_LABELS[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const rowColors = getRowColors(row.product, row.market, themeByRowKey)
                return (
                  <tr key={`post-${row.product}-${row.market}-${ri}`}>
                    <td style={{ ...tdLabel, left: 0, zIndex: 40, ...rowColors.labelCell }} />
                    <td style={{ ...tdLabel, left: COL_PRODUCT, zIndex: 40, borderRight: '1px solid var(--border2)', ...rowColors.labelCell }} />
                    {EXTRA_STAGES.map(stage => {
                      const cellFeatures = featuresAtView(row.product, row.market, stage)
                      return (
                        <td key={stage} style={tdCell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {cellFeatures.map(f => (
                              <FeatureCard
                                key={f.id}
                                feature={f}
                                displayStage={computeDisplayStage(f, today)}
                                onEdit={openEdit}
                                onMove={moveFeature}
                                onArchive={setArchived}
                                rowAccent={rowColors.accent}
                              />
                            ))}
                            <AddButton onClick={() => openAdd(row.product, row.market, stage)} />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <FeatureModal
        open={featureModal.open}
        onClose={() => setFeatureModal({ open: false, data: null })}
        initialData={featureModal.data}
        products={products}
        markets={markets}
        onSave={upsertFeature}
        onDelete={deleteFeature}
      />

      <AddRowModal
        open={rowModal}
        onClose={() => setRowModal(false)}
        products={products}
        onSave={addRow}
      />

      <ThemeModal
        open={themeModal}
        onClose={() => setThemeModal(false)}
        rows={rows}
        themeByRowKey={themeByRowKey}
        setThemeByRowKey={setThemeByRowKey}
      />
    </div>
  )
}

function ArchiveView({ features, query, setQuery, sortDir, setSortDir, onOpen }) {
  const q = (query || '').trim().toLowerCase()
  const filtered = features
    .filter(f => (f?.name || '').toLowerCase().includes(q))
    .sort((a, b) => {
      const av = typeof a.createdAt === 'number' ? a.createdAt : 0
      const bv = typeof b.createdAt === 'number' ? b.createdAt : 0
      return sortDir === 'asc' ? (av - bv) : (bv - av)
    })

  return (
    <div style={{ padding: '14px 28px 24px', overflowY: 'auto', overflowX: 'hidden', flex: '1 1 auto', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search archived features by name…"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
        >
          Date {sortDir === 'desc' ? '↓' : '↑'}
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 860 }}>
          <thead>
            <tr>
              <th style={archiveTh}>Feature</th>
              <th style={archiveTh}>Product</th>
              <th style={archiveTh}>Market</th>
              <th style={archiveTh}>PRD</th>
              <th style={archiveTh}>Jira</th>
              <th style={{ ...archiveTh, textAlign: 'right' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr
                key={f.id}
                onClick={() => onOpen?.(f.id)}
                style={{ cursor: 'pointer' }}
              >
                <td style={archiveTdStrong}>{f.name}</td>
                <td style={archiveTd}>{f.product}</td>
                <td style={archiveTd}>{f.market}</td>
                <td style={archiveTd}>
                  {f.prd ? (
                    <a
                      href={f.prd}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={archiveLink}
                    >
                      Open ↗
                    </a>
                  ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                </td>
                <td style={archiveTd}>
                  {f.jira ? (
                    <a
                      href={f.jira}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={archiveLink}
                    >
                      Open ↗
                    </a>
                  ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                </td>
                <td style={{ ...archiveTd, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>
                  {formatCreatedAt(f.createdAt)}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...archiveTd, padding: '18px 12px', color: 'var(--text3)' }}>
                  No archived features found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCreatedAt(ms) {
  if (typeof ms !== 'number') return '—'
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const archiveTh = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text3)',
  padding: '10px 12px',
  borderBottom: '1px solid var(--grid-v)',
  borderRight: '1px solid var(--grid-v)',
  textAlign: 'left',
  background: 'var(--header)',
  position: 'sticky',
  top: 0,
  zIndex: 2,
}

const archiveTd = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--grid-h)',
  borderRight: '1px solid var(--grid-v)',
  color: 'var(--text2)',
  background: 'var(--surface)',
}

const archiveTdStrong = {
  ...archiveTd,
  color: 'var(--text)',
  fontWeight: 700,
}

const archiveLink = {
  color: 'var(--accent2)',
  textDecoration: 'none',
  fontFamily: 'var(--mono)',
  fontSize: 11,
}

// ── Styles ──────────────────────────────────────────────────────
function thStyle({ width, left } ) {
  const isStickyCol = typeof left === 'number'
  return {
    fontFamily: 'var(--mono)',
    fontSize: 10, fontWeight: 500,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--text3)',
    padding: '8px 10px',
    textAlign: 'left',
    borderBottom: '1px solid var(--grid-v)',
    borderRight: '1px solid var(--grid-v)',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    background: 'var(--header)',
    zIndex: isStickyCol ? 90 : 80,
    width, minWidth: width,
    ...(isStickyCol ? { left } : {}),
  }
}

const tdLabel = {
  verticalAlign: 'top',
  padding: '8px 10px',
  borderBottom: '1px solid var(--grid-h)',
  borderRight: '1px solid var(--grid-v)',
  background: 'var(--surface)',
  position: 'sticky',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  hyphens: 'auto',
  minWidth: 0,
}

const tdCell = {
  verticalAlign: 'top',
  padding: '6px 6px',
  borderBottom: '1px solid var(--grid-h)',
  borderRight: '1px solid var(--grid-v)',
  background: 'var(--bg)',
  minWidth: 0,
}

function AddButton({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--mono)', fontSize: 10,
        color: hovered ? 'var(--text2)' : 'var(--text3)',
        background: 'none',
        border: hovered ? `1px dashed var(--text3)` : '0px solid transparent',
        borderRadius: 5, padding: '5px 8px',
        cursor: 'pointer', width: '100%',
        transition: 'all 0.15s',
        opacity: hovered ? 1 : 0,
        maxHeight: hovered ? 28 : 0,
        paddingTop: hovered ? 5 : 0,
        paddingBottom: hovered ? 5 : 0,
        marginTop: hovered ? 2 : 0,
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> add
    </button>
  )
}

function rowKey(product, market) {
  return `${product}||${market}`
}

function hexToHsl(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function getRowColors(product, market, themeByRowKey) {
  return {
    labelCell: {
      background: 'var(--surface2)',
      borderRight: '1px solid var(--border)',
    },
    accent: 'transparent',
  }
}
