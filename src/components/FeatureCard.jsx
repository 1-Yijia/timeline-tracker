import { useState } from 'react'
import { STAGES, STAGE_COLORS } from '../data/constants'
import { getActiveRangeLabel, hasTimelineError } from '../hooks/useTimeline'
import { Button } from './UI'

export function FeatureCard({ feature, displayStage, onEdit, onMove, onArchive, rowAccent }) {
  const [hovered, setHovered] = useState(false)
  const curIdx = STAGES.indexOf(displayStage)
  const accentColor = STAGE_COLORS[displayStage] || 'var(--text3)'
  const rangeLabel = getActiveRangeLabel(feature, displayStage)
  const showTimelineError = hasTimelineError(feature)
  const archived = Boolean(feature.archived)

  return (
    <div
      onClick={() => onEdit(feature.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 4,
        padding: '6px 8px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {showTimelineError && (
        <div
          title="Missing/invalid timeline (required for Scheduled+)"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: '#c23a3a',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 0 rgba(0,0,0,0.10)',
          }}
        >
          !
        </div>
      )}
      {/* Feature name */}
      <div style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--text)', lineHeight: 1.25, marginBottom: 3 }}>
        {feature.name}
      </div>

      {/* Links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {feature.prd && (
          <a
            href={feature.prd}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={linkStyle('var(--accent2)', 'transparent')}
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
            style={linkStyle('var(--accent2)', 'transparent')}
          >
            Jira ↗
          </a>
        )}
      </div>

      {/* Version chip */}
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

      {/* Active range label */}
      {rangeLabel && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', marginTop: 3, lineHeight: 1.35 }}>
          {rangeLabel}
        </div>
      )}

      {/* Hover actions */}
      {hovered && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: 6,
            width: '100%',
          }}
        >
          {curIdx > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(feature.id, -1)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              ← back
            </Button>
          )}
          {curIdx < STAGES.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(feature.id, 1)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              next →
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive?.(feature.id, !archived)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      )}
    </div>
  )
}

function linkStyle(color, borderColor) {
  return {
    fontFamily: 'var(--mono)', fontSize: 10,
    color, border: `1px solid ${borderColor}`,
    padding: '0px 0px', borderRadius: 0,
    textDecoration: 'none', display: 'inline-block',
    transition: 'background 0.12s',
  }
}
