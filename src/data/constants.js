export const STAGES = [
  'pipeline', 'frf', 'prd', 'scheduled',
  'dev', 'test', 'uat', 'live', 'live-testing', 'greyscale',
]

export const STAGE_LABELS = {
  pipeline:      'Pipeline',
  frf:           'FRF',
  prd:           'PRD',
  scheduled:     'Scheduled',
  dev:           'Dev',
  test:          'Test',
  uat:           'UAT',
  live:          'Live',
  'live-testing':'Live Testing',
  greyscale:     'Greyscale',
}

// Stages that require a date-based timeline input
export const TIMED_STAGES = ['scheduled', 'dev', 'test', 'uat', 'live', 'live-testing', 'greyscale']

// Stage accent colours (matches CSS vars)
export const STAGE_COLORS = {
  pipeline:      'var(--text3)',
  frf:           'var(--text3)',
  prd:           'var(--text3)',
  scheduled:     'var(--amber)',
  dev:           'var(--accent)',
  test:          'var(--purple)',
  uat:           'var(--green)',
  live:          'var(--green)',
  'live-testing':'var(--amber)',
  greyscale:     'var(--text3)',
}

export const DEFAULT_ROWS = [
  { product: 'BCL',          market: 'ID'            },
  { product: 'BCL',          market: 'BR'            },
  { product: 'BCL',          market: 'Cross Market'  },
  { product: 'SPL',          market: 'BR'            },
  { product: 'SPL',          market: 'Cross Market'  },
  { product: 'Vehicle Loan', market: 'ID'            },
]

export const DEFAULT_FEATURES = [
  { id: 'f1',  product: 'BCL',          market: 'ID',           name: 'First Loan Phase 2',          prd: '', jira: '', stage: 'pipeline',  version: '',            timeline: {} },
  { id: 'f2',  product: 'BCL',          market: 'ID',           name: 'Early Full Repayment',         prd: '', jira: '', stage: 'pipeline',  version: '',            timeline: {} },
  { id: 'f3',  product: 'BCL',          market: 'ID',           name: 'UI Optimisation',              prd: '', jira: '', stage: 'frf',       version: '',            timeline: {} },
  { id: 'f4',  product: 'BCL',          market: 'ID',           name: 'Discount Subsidy Track',       prd: '', jira: '', stage: 'prd',       version: '',            timeline: {} },
  { id: 'f5',  product: 'BCL',          market: 'ID',           name: 'SPL Cash Advance',             prd: '', jira: '', stage: 'prd',       version: '',            timeline: {} },
  { id: 'f6',  product: 'BCL',          market: 'ID',           name: 'esign',                        prd: '', jira: '', stage: 'live',      version: 'v202605.1.0', timeline: {} },
  { id: 'f7',  product: 'BCL',          market: 'BR',           name: 'Maree Separate App',           prd: '', jira: '', stage: 'scheduled', version: 'v202605.2.0', timeline: { dev: '2026.04.06-2026.04.17' } },
  { id: 'f8',  product: 'BCL',          market: 'Cross Market', name: 'Risk Real Time Limit Adj.',    prd: '', jira: '', stage: 'pipeline',  version: '',            timeline: {} },
  { id: 'f9',  product: 'BCL',          market: 'Cross Market', name: 'Account Freeze',               prd: '', jira: '', stage: 'scheduled', version: 'v202605.3.0', timeline: { dev: '2026.04.09-2026.04.23' } },
  { id: 'f10', product: 'BCL',          market: 'Cross Market', name: 'Income Doc',                   prd: '', jira: '', stage: 'live',      version: 'v202605.4.0', timeline: {} },
  { id: 'f11', product: 'BCL',          market: 'Cross Market', name: 'Referral Program',             prd: '', jira: '', stage: 'live',      version: 'v202605.5.0', timeline: {} },
  { id: 'f12', product: 'SPL',          market: 'BR',           name: 'In-app Discount',              prd: '', jira: '', stage: 'scheduled', version: 'v202606.1.5', timeline: { dev: '2026.04.27-2026.05.29', test: '2026.06.01-2026.06.19', uat: '2026.06.15-2026.06.24', live: '2026.06.25-2026.06.25' } },
  { id: 'f13', product: 'SPL',          market: 'Cross Market', name: 'BCL Cross Sell on SPL',        prd: '', jira: '', stage: 'scheduled', version: 'v202606.2.0', timeline: { dev: '2026.04.20-2026.05.13' } },
  { id: 'f14', product: 'Vehicle Loan', market: 'ID',           name: 'User Flow Enhancement',        prd: '', jira: '', stage: 'scheduled', version: 'v202605.6.0', timeline: { dev: '2026.04.01-2026.04.29' } },
]
