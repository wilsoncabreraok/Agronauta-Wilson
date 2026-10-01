const WORKSPACE_VIEW_VALUES = {
  FIELDS: 'fields',
  ACTIVITY: 'activity',
  GEOMETRY: 'geometry',
  MANAGEMENT: 'management',
  LIVESTOCK: 'livestock',
  AGRONOMY: 'agronomy',
  PLANNING: 'planning',
  EVIDENCE: 'evidence',
  INTELLIGENCE: 'intelligence',
  COPILOT: 'copilot',
} as const

export type OperationalWorkspaceView =
  (typeof WORKSPACE_VIEW_VALUES)[keyof typeof WORKSPACE_VIEW_VALUES]

export const OPERATIONAL_WORKSPACE_VIEWS = [
  { key: WORKSPACE_VIEW_VALUES.FIELDS, label: 'Campos', anchor: 'agronautas-intake' },
  { key: WORKSPACE_VIEW_VALUES.LIVESTOCK, label: 'Hacienda', anchor: 'agronautas-livestock' },
  { key: WORKSPACE_VIEW_VALUES.AGRONOMY, label: 'Agronomia', anchor: 'agronautas-agronomy' },
  { key: WORKSPACE_VIEW_VALUES.COPILOT, label: 'Copilot', anchor: 'agronautas-copilot' }
] as const

export const DEMO_WORKSPACE_VIEWS = OPERATIONAL_WORKSPACE_VIEWS

export function buildWorkspaceHref(
  view: OperationalWorkspaceView,
  fieldId?: string | null,
  basePath = '/agronautas'
): string {
  if (view === 'agronomy') basePath = '/demo'
  const params = new URLSearchParams({ view })
  if (fieldId) params.set('fieldId', fieldId)
  return `${basePath}?${params.toString()}`
}
