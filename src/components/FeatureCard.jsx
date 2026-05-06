import { useState } from 'react'
import { getActiveRangeLabel } from '../hooks/useTimeline'
import { ConfirmModal, InfoModal, FolderIcon } from './UI'

export function FeatureCard({ feature, displayStage, onDelete, onArchive }) {
  const [hovered, setHovered] = useState(false)
  const [confirm, setConfirm] = useState(null) // null | 'delete' | 'archive'
  const [showInfo, setShowInfo] = useState(false)
  const rangeLabel = getActiveRangeLabel(feature, displayStage)
  const archived = Boolean(feature.archived)

  const confirmConfig = {
    delete: {
      title: 'Delete feature?',
      message: `"${feature.name}" will be permanently removed. If it came from Google Sheets, it won't reappear on the next sync.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
      onConfirm: () => onDelete(feature.id),
    },
    archive: {
      title: archived ? 'Unarchive feature?' : 'Archive feature?',
      message: archived
        ? `"${feature.name}" will be moved back to the main board.`
        : `"${feature.name}" will be hidden from the main board. You can restore it from the Archive view.`,
      confirmLabel: archived ? 'Unarchive' : 'Archive',
      confirmVariant: 'ghost',
      onConfirm: () => onArchive(feature.id, !archived),
    },
  }

  return (
    <>
      {confirm && (
        <ConfirmModal
          open
          onClose={() => setConfirm(null)}
          onConfirm={() => { confirmConfig[confirm].onConfirm(); setConfirm(null) }}
          title={confirmConfig[confirm].title}
          message={confirmConfig[confirm].message}
          confirmLabel={confirmConfig[confirm].confirmLabel}
          confirmVariant={confirmConfig[confirm].confirmVariant}
        />
      )}
      <InfoModal
        open={showInfo}
        onClose={() => setShowInfo(false)}
        message="Stage and timeline changes can only be made in the Google Sheet. Sync after updating."
      />

      {/* Outer wrapper captures hover — overlay lives inside so mouse never leaves */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setShowInfo(true)}
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        {/* Card content */}
        <div style={{
          background: 'var(--surface)',
          border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
          borderRadius: 4,
          padding: '6px 8px',
          transition: 'border-color 0.15s',
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--text)', lineHeight: 1.25, marginBottom: 3 }}>
            {feature.name}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {feature.prd && (
              <a
                href={feature.prd}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={linkStyle}
              >
                PRD ↗
              </a>
            )}
            {feature.jira && (
              <a
                href={feature.jira}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={linkStyle}
              >
                Jira ↗
              </a>
            )}
          </div>

          {feature.version && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              color: 'var(--amber)',
              background: '#f5a62315',
              border: '1px solid #f5a62330',
              padding: '1px 6px', borderRadius: 3,
              marginTop: 3, display: 'inline-block',
            }}>
              {feature.version}
            </div>
          )}

          {rangeLabel && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', marginTop: 3, lineHeight: 1.35 }}>
              {rangeLabel}
            </div>
          )}
        </div>

        {/* Semi-transparent overlay with action buttons — inside wrapper, no mouseLeave gap */}
        {hovered && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              background: 'rgba(0,0,0,0.78)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              zIndex: 10,
            }}
          >
            <button
              onClick={() => setConfirm('archive')}
              title={archived ? 'Unarchive' : 'Archive'}
              style={actionBtn(false)}
            >
              <FolderIcon size={12} />
            </button>
            <button
              onClick={() => setConfirm('delete')}
              title="Delete"
              style={actionBtn(true)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function actionBtn(isDanger) {
  return {
    background: 'var(--bg)',
    border: `1px solid ${isDanger ? '#c23a3a55' : 'var(--border2)'}`,
    borderRadius: 4,
    color: isDanger ? 'var(--red)' : 'var(--text2)',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '5px 10px',
    lineHeight: 1,
    fontFamily: 'var(--mono)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }
}

const linkStyle = {
  fontFamily: 'var(--mono)', fontSize: 10,
  color: 'var(--accent2)',
  textDecoration: 'none', display: 'inline-block',
}
