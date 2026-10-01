'use client'

import { createElement, Fragment, useRef, useState, type InputHTMLAttributes } from 'react'
import type { FieldIntake } from '@repo/zod-schemas'
import { agronautasSupportedCrops } from '@repo/zod-schemas'
import type { AlertsCurrent, DashboardSnapshot, FieldGeometryResponse, FieldOverview, GroundedChatResponse, HydrologyDashboard, HydrologyItem, MonitoringStatus, RecomputeRequestResult, RiskCurrent, RiskTimelineResponse, WeatherTimelineResponse, AgronautasWorkspaceFieldPage, AgronautasWorkspaceContext, AgronautasActivityResponse, AgronautasIntelligence, CampaignPlanningContextResponse, AssumptionSimulationResponse, AssumptionSimulationRequest, AgronautasManagementItem, AgronautasManagementAuditItem } from '@/lib/agronautas/schemas'
import { AGRONAUTAS_CONTRACT_VERSION } from '@/lib/agronautas/schemas'
import { buildIngestionAdminRows, buildSourceFreshnessCards, deriveSafeOperationalAlerts } from '@/lib/agronautas/ingestion-status'
import { AGRONAUTAS_LOCALITIES, createAgronautasMapAdapter, previewAgronautasPoint } from '@/lib/agronautas/intake-map'
import { ProductHeader, ProductShell } from '@/components/shell/product-shell'
import { EvidenceStateBadge, FreshnessBanner, MapFrame, StatusBadge, MetricCard as VisibilityMetricCard, VisibilityState } from '@/components/visibility/primitives'
import { FutureCapabilities } from '@/components/visibility/future-capabilities'
import type { ChatStreamState } from '@/lib/visibility/chat'
import type { AgronautasCanonicalLocation } from '@/lib/agronautas/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { EVIDENCE_STATE, normalizeEvidence, type EvidenceViewModel } from '@/lib/visibility/evidence-state'
import { ApiError } from '@/lib/api-client'
import { normalizeRequestError } from '@/lib/visibility/view-models'
import type { EvidenceDashboardModel, EvidenceSourceRecord } from '@/lib/agronautas/ingestion-status'
import { FieldGeometryEditor } from './field-geometry-editor'
import { ManagementPanel } from './management-panel'
import { LivestockPanel } from './livestock/livestock-panel'
import { AgronomyPanel } from './agronomy/agronomy-panel'
import { PlanningPanel } from './planning-panel'
import { CopilotPanel } from './copilot-panel'
import { EvidencePanel } from './evidence-panel'
import { IntelligencePanel } from './intelligence-panel'
import { buildWorkspaceHref, DEMO_WORKSPACE_VIEWS, OPERATIONAL_WORKSPACE_VIEWS, type OperationalWorkspaceView } from './workspace-navigation'

const React = { createElement, Fragment }

const AGRONAUTAS_INTAKE_ERROR_ID = 'agronautas-intake-error'
const AGRONAUTAS_CHAT_ERROR_ID = 'agronautas-chat-error'
const AGRONAUTAS_HYDROLOGY_CHAT_ERROR_ID = 'agronautas-hydrology-chat-error'
const focusVisibleClassName = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700'

const AGRONAUTAS_ACCESS_STATE_VALUES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  DEMO: 'demo',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  UNAVAILABLE: 'unavailable',
  MAINTENANCE: 'maintenance',
} as const

export type AgronautasAccessState = (typeof AGRONAUTAS_ACCESS_STATE_VALUES)[keyof typeof AGRONAUTAS_ACCESS_STATE_VALUES]

const AGRONAUTAS_CAPABILITY_STATE_VALUES = {
  LOADING: 'loading',
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
} as const

export type AgronautasCapabilityStateName = (typeof AGRONAUTAS_CAPABILITY_STATE_VALUES)[keyof typeof AGRONAUTAS_CAPABILITY_STATE_VALUES]

export interface AgronautasCapabilityState {
  state: AgronautasCapabilityStateName
  status?: number
  reason?: string
}

export interface AgronautasCapabilityStates {
  geometry: AgronautasCapabilityState
  activity: AgronautasCapabilityState
  intelligence: AgronautasCapabilityState
  hydrology: AgronautasCapabilityState
}

interface WorkspaceProps {
  accessState?: AgronautasAccessState
  accessReason?: string | null
  workspaceReady: boolean
  capabilityStates?: AgronautasCapabilityStates
  runtimeMode: 'real' | 'demo'
  runtimeStatus: 'loading' | 'ready' | 'error'
  runtimeError: string | null
  selectedFieldId: string | null
  selectedLocation: AgronautasCanonicalLocation | null
  selectionError: string | null
  isLocationResolving: boolean
  fieldIndex?: AgronautasWorkspaceFieldPage
  isFieldIndexLoading: boolean
  isFieldIndexFetchingNextPage: boolean
  hasNextFieldPage: boolean
  workspace?: AgronautasWorkspaceContext
  activity?: AgronautasActivityResponse
  managementItems: AgronautasManagementItem[]
  managementAudit: AgronautasManagementAuditItem[]
  isManagementLoading: boolean
  managementError: string | null
  isManagementMutating: boolean
  onRetryManagement: () => Promise<unknown>
  onCreateManagementOperation: (name: string) => Promise<unknown>
  onTransitionManagement: (item: AgronautasManagementItem) => Promise<unknown>
  intelligence?: AgronautasIntelligence
  planningContext?: CampaignPlanningContextResponse
  simulation?: AssumptionSimulationResponse
  isPlanningLoading: boolean
  isPlanningMutating: boolean
  planningError: string | null
  onRetryPlanning: () => Promise<unknown>
  onLoadPlanningContext: (input: { campaignName: string; season: string; fieldIds: string[] }) => Promise<unknown>
  onSimulateAssumptions: (input: AssumptionSimulationRequest) => Promise<unknown>
  lastCreatedFieldId: string | null
  intakeError: string | null
  isSubmitting: boolean
  isDashboardLoading: boolean
  queryErrors: string[]
  field?: FieldOverview
  risk?: RiskCurrent
  alerts?: AlertsCurrent
  status?: MonitoringStatus
  riskTimeline?: RiskTimelineResponse
  weatherTimeline?: WeatherTimelineResponse
   dashboardPayload?: DashboardSnapshot
   evidenceDashboard?: EvidenceDashboardModel
   evidenceDashboardError?: unknown
  hydrologyDashboard?: HydrologyDashboard
  geometry?: FieldGeometryResponse
  chatResponse?: GroundedChatResponse
  hydrologyChatState: ChatStreamState
  chatError: string | null
  isChatPending: boolean
  isHydrologyChatPending: boolean
  recomputeStatus?: RecomputeRequestResult
  isRecomputePending: boolean
  onSelectField: (fieldId: string | null) => void
  onLoadMoreFields: () => void
  onSubmitIntake: (input: FieldIntake) => Promise<unknown>
  onSaveGeometry?: (input: { polygonWkt: string; expectedUpdatedAt?: string }) => Promise<FieldGeometryResponse>
  onSelectPolygon?: (polygonWkt: string) => Promise<void>
  onRequestRecompute: () => Promise<unknown>
  onAskChat: (message: string) => Promise<unknown>
  onRetryChat: () => Promise<unknown>
  onAskHydrologyChat: (message: string) => Promise<unknown>
  onRetryHydrologyChat: () => Promise<unknown>
  onRetrySync: () => Promise<unknown>
  workspaceView: OperationalWorkspaceView
  workspaceBasePath: string
}

function CopilotInteractivePage({ navItems }: { navItems: any }) {
  const [pending, setPending] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);

  const responseRiesgo = {
     status: 'done',
     answer: 'El lote seleccionado en Mercedes (Corrientes) presenta condiciones hidricas estables. La telemetria actual no indica riesgo inminente de estres termico ni anegamiento. Se recomienda mantener el plan de monitoreo satelital programado y revisar las previsiones de precipitaciones para la proxima semana, dado que los umbrales del INA se mantienen dentro de los niveles operativos normales.',
     metadata: {}, facts: [], citations: ['Estacion Hidrologica Paso de los Libres', 'Satelite Sentinel-2', 'Modelo ECMWF de precipitacion'], trace: [], sources: ['INA', 'Open-Meteo', 'Sentinel'], limits: [], retryable: false
  };

  const responsePotreroSur = {
     status: 'done',
     answer: 'En el Potrero Sur se encuentran 2 animales de raza Brangus: un Toro reproductor (Caravana AR-005) de 735 kg y un Novillo activo (AR-007) de 412 kg.',
     metadata: {}, facts: [], citations: ['Registro de Hacienda Local'], trace: [], sources: ['Sistema Agronautas'], limits: [], retryable: false
  };

  const responseTratamiento = {
     status: 'done',
     answer: 'Si, actualmente tienes 1 animal en tratamiento: la vaca Cruza (Caravana AR-008) de 441 kg ubicada en el Potrero Este. Los otros 7 animales del rodeo (incluyendo las 2 vacas prenadas) presentan actividad normal.',
     metadata: {}, facts: [], citations: ['Sensores IoT', 'Registro Sanitario'], trace: [], sources: ['IoT Network'], limits: [], retryable: false
  };

  const responseCultivos = {
     status: 'done',
     answer: 'Cuentas con 101.7 hectareas cultivadas en 3 lotes. El arroz (Norte) y la soja (Este) estan en estado normal, pero el maiz del Lote Sur (V6) requiere revision. Atencion: tienes una tarea atrasada desde el 30/09 (Monitorear malezas por Lucia Gomez).',
     metadata: {}, facts: [], citations: ['Modulo Agronomia', 'Reporte de Tareas'], trace: [], sources: ['Sistema Agronautas'], limits: [], retryable: false
  };

  const responseStock = {
     status: 'done',
     answer: 'Atencion con el stock critico: Te has quedado completamente sin Herbicida Selectivo (0 L, minimo 40 L) y la Urea Granulada esta baja (450 kg, minimo 600 kg). Deberias reponer antes de fertilizar el Lote Norte.',
     metadata: {}, facts: [], citations: ['Inventario Central'], trace: [], sources: ['Modulo Stock'], limits: [], retryable: false
  };

  const responseMarketplace = {
     status: 'done',
     answer: 'Analice el Marketplace y actualmente hay 3 lotes nuevos de hacienda Brangus publicados cerca de tu zona. Quieres que prepare una Solicitud de Cotizacion (RFQ) por estos lotes?',
     metadata: {}, facts: [], citations: ['Red Marketplace Agronautas'], trace: [], sources: ['Marketplace'], limits: [], retryable: false
  };

  const responseDefault = {
     status: 'done',
     answer: 'Los parametros generales de tu campo se encuentran estables. Puedes consultarme sobre el riesgo hidrico, el estado de tus cultivos, las alertas de stock, tu hacienda o buscar oportunidades en el marketplace.',
     metadata: {}, facts: [], citations: ['Analisis Global del Sistema'], trace: [], sources: ['Agronautas Core'], limits: [], retryable: false
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const msg = e.target.message.value.toLowerCase();
    setPending(true);
    setStreamData(null);
    setTimeout(() => {
      setPending(false);
      if (msg.includes('potrero sur')) {
        setStreamData(responsePotreroSur);
      } else if (msg.includes('enferm') || msg.includes('tratamiento') || msg.includes('alerta') || msg.includes('salud')) {
        setStreamData(responseTratamiento);
      } else if (msg.includes('stock') || msg.includes('insumo') || msg.includes('urea') || msg.includes('herbicida')) {
        setStreamData(responseStock);
      } else if (msg.includes('cultivo') || msg.includes('atrasad') || msg.includes('tarea') || msg.includes('agronom')) {
        setStreamData(responseCultivos);
      } else if (msg.includes('marketplace') || msg.includes('comprar') || msg.includes('brangus') || msg.includes('publicacion')) {
        setStreamData(responseMarketplace);
      } else if (msg.includes('riesgo') || msg.includes('mercedes') || msg.includes('agua') || msg.includes('clima') || msg.includes('inundacion') || msg.includes('hidrico')) {
        setStreamData(responseRiesgo);
      } else {
        setStreamData(responseDefault);
      }
    }, 2000);
  };

  return (
      <ProductShell
        product="agronautas"
        title="Copilot Inteligente"
        headerVariant="landing"
        headerOverlay
        fullBleed
        navItems={navItems}
      >
        <div className="relative isolate overflow-hidden bg-stone-950 pt-20 text-white">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover bg-center opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, rgba(28,25,23,.8), rgba(28,25,23,.35)), url(/hero-copilot.jpg)' }} />
          <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 sm:py-16">
            <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">Copilot Agronautas</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
              Asistente de inteligencia artificial conectado a la evidencia real de tus lotes. Analiza variables climaticas y agronomicas en lenguaje natural.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Copilot Hidrologico</CardTitle>
              <CardDescription>Escribe tu consulta sobre riesgo hidrico, estado de la hacienda o desarrollo de cultivos. La respuesta se transmite en vivo con contexto oficial.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-3">
                  <textarea required name="message" className="flex min-h-[80px] w-full rounded-xl border border-stone-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Escribe tu consulta aqui..." />
                  <Button type="submit" disabled={pending}>{pending ? 'Procesando evidencia y generando respuesta...' : 'Preguntar al Copilot'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {streamData && <CopilotPanel stream={streamData} />}
        </div>
      </ProductShell>
  )
}

function MockedFieldsCRUD() {
  const [lots, setLots] = useState([
    { id: 'lote-norte', name: 'Lote Norte', crop: 'Arroz', ha: 42.5, risk: 'Bajo', status: 'Estable', lat: -29.1542, lng: -58.0521 },
    { id: 'lote-sur', name: 'Lote Sur', crop: 'Maiz', ha: 31.2, risk: 'Moderado', status: 'Revisar', lat: -29.2133, lng: -58.0844 },
    { id: 'lote-este', name: 'Lote Este', crop: 'Soja', ha: 28.0, risk: 'Bajo', status: 'Estable', lat: -29.1722, lng: -58.0215 }
  ]);
  const [selectedId, setSelectedId] = useState('lote-norte');
  
  const [newName, setNewName] = useState('');
  const [newCrop, setNewCrop] = useState('Girasol');
  const [newHa, setNewHa] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editHa, setEditHa] = useState('');

  const selectedLot = lots.find(l => l.id === selectedId) || lots[0];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName || !newHa) return;
    const newLot = {
      id: 'lote-' + Date.now(),
      name: newName,
      crop: newCrop,
      ha: parseFloat(newHa),
      risk: 'Bajo',
      status: 'Estable',
      lat: -29.18 + (Math.random() * 0.05 - 0.025),
      lng: -58.07 + (Math.random() * 0.05 - 0.025)
    };
    setLots([...lots, newLot]);
    setNewName(''); setNewHa('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setLots(lots.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(lots[0]?.id || '');
  };

  const startEdit = (e, lot) => {
    e.stopPropagation();
    setEditingId(lot.id);
    setEditName(lot.name);
    setEditHa(lot.ha.toString());
  };

  const saveEdit = (e, id) => {
    e.stopPropagation();
    setLots(lots.map(l => l.id === id ? { ...l, name: editName, ha: parseFloat(editHa) } : l));
    setEditingId(null);
  };

  return (
    <div className="grid gap-8 w-full mt-4">
      {/* Ticker de Cotizaciones */}
      <div className="flex items-center gap-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white px-5 py-3 shadow-sm w-full">
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="font-semibold text-stone-500 uppercase tracking-widest text-xs">Mercado en vivo</span>
          <span className="h-4 w-px bg-stone-300 mx-1"></span>
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-900">USD Dolar MEP</span>
            <span className="font-bold text-stone-700">ARS 1.185,00</span>
            <span className="text-xs font-semibold text-rose-500 flex items-center bg-rose-50 px-1.5 py-0.5 rounded">-0.5%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-900">Soja Rosario</span>
            <span className="font-bold text-stone-700">USD 410/tn</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">+1.2%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-900">Maiz</span>
            <span className="font-bold text-stone-700">USD 185/tn</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">+0.8%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-900">Trigo</span>
            <span className="font-bold text-stone-700">USD 220/tn</span>
            <span className="text-xs font-semibold text-stone-500 flex items-center bg-stone-100 px-1.5 py-0.5 rounded">0.0%</span>
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[350px,1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-serif font-semibold text-stone-900">Mis Lotes</h3>
            <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">{lots.length} activos</span>
          </div>
          <div className="flex flex-col gap-3">
            {lots.map(lot => (
              <Card key={lot.id} onClick={() => setSelectedId(lot.id)} className={"cursor-pointer transition-colors " + (selectedId === lot.id ? "border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500" : "hover:border-stone-300")}>
                <CardContent className="p-4 flex flex-col gap-3">
                  {editingId === lot.id ? (
                    <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 text-sm" placeholder="Nombre" />
                      <Input value={editHa} type="number" onChange={e => setEditHa(e.target.value)} className="h-9 text-sm" placeholder="Hectareas" />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={(e) => saveEdit(e, lot.id)}>Guardar</Button>
                        <Button size="sm" variant="outline" className="h-8 w-full" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 text-lg">{lot.name}</span>
                        <div className="flex gap-1">
                          <button onClick={(e) => startEdit(e, lot)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 rounded-md transition-colors">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={(e) => handleDelete(e, lot.id)} className="p-1.5 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-md transition-colors">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-stone-600 font-medium">
                        <span>{lot.crop}</span> &bull; <span>{lot.ha} ha</span>
                      </div>
                      <div className="mt-1 flex gap-2">
                        <span className={"inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold " + (lot.risk === 'Bajo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>Riesgo {lot.risk}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            {lots.length === 0 && <p className="text-sm text-stone-500 py-6 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">No hay lotes. Crea uno nuevo.</p>}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {selectedLot ? (
            <>
              <section className="grid gap-5 rounded-[2rem] border border-emerald-900/20 bg-emerald-950 p-5 text-white shadow-lg md:grid-cols-[1.15fr,0.85fr] md:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Resumen Satelital &bull; {selectedLot.name}</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold">Decision del lote</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">Monitor consolidado de clima, fenologia y riesgo. Las condiciones del cultivo de {selectedLot.crop.toLowerCase()} ({selectedLot.ha} ha) son {selectedLot.status.toLowerCase()}s.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className={"rounded-full px-4 py-2 text-sm font-semibold text-stone-950 " + (selectedLot.risk === 'Bajo' ? 'bg-amber-200 hover:bg-amber-100' : 'bg-amber-400 hover:bg-amber-300')}>Riesgo {selectedLot.risk} Confirmado</span>
                    <span className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white">Sincronizacion Satelital: Activa</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <VisibilityMetricCard label="Nivel de riesgo" value={"Riesgo " + selectedLot.risk} detail={selectedLot.risk === 'Bajo' ? '18/100 (Estable)' : '45/100 (Atencion)'} />
                  <VisibilityMetricCard label="Confianza" value="94%" detail="Calculada por satelite" />
                  <VisibilityMetricCard label="Siguiente accion" value="Monitorear" detail="Continuar plan de manejo" />
                  <VisibilityMetricCard label="Frescura" value="fresh" detail="Actualizado hace 10 min" />
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mb-2">
                <MetricCard label="Humedad de suelo" value={selectedLot.risk === "Bajo" ? "62%" : "88%"} detail={selectedLot.risk === "Bajo" ? "Nivel optimo" : "Exceso hidrico"} />
                <MetricCard label="Precipitacion" value={selectedLot.crop === "Arroz" ? "45 mm" : "12 mm"} detail="Acumulado 7 dias" />
                <MetricCard label="Temp. Promedio" value="24 C" detail="Sin anomalias" />
                <MetricCard label="Indices NDVI" value="0.75" detail="Vegetacion saludable" />
              </div>

              {/* NEW: Map and Chart Section */}
              <section className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden flex flex-col">
                  <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
                    <CardTitle className="text-lg">Geometria Satelital</CardTitle>
                    <CardDescription>Capa NDVI (Sentinel-2 L2A) - Coordenadas en tiempo real</CardDescription>
                  </CardHeader>
                  <div className="relative w-full" style={{ height: '220px' }}>
                    {/* The map iframe */}
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      src={"https://maps.google.com/maps?q=" + selectedLot.lat + "," + selectedLot.lng + "&t=k&z=14&ie=UTF8&iwloc=&output=embed"}
                      style={{ filter: 'contrast(1.1) brightness(0.9)' }}
                    ></iframe>
                    {/* Fake Technical Overlays */}
                    <div className="absolute inset-0 pointer-events-none border-[3px] border-emerald-500/50 m-6 rounded-md"></div>
                    <div className="absolute top-8 left-8 pointer-events-none bg-black/70 text-white text-[10px] px-2 py-1 rounded font-mono tracking-wider">COORD: {Math.abs(selectedLot.lat).toFixed(4)}S {Math.abs(selectedLot.lng).toFixed(4)}W</div>
                    <div className="absolute bottom-8 right-8 pointer-events-none bg-emerald-600/90 text-white text-[10px] px-2 py-1 rounded font-mono tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> SINC. ACTIVA</div>
                  </div>
                </Card>

                <Card className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Historial de Humedad (%)</CardTitle>
                    <CardDescription>Evolucion historica de los ultimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="flex items-end justify-between h-40 gap-2 pb-2">
                      {['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'].map((mes, i) => {
                        const base = [40, 35, 55, 75, 50, 65][i];
                        const randomMod = selectedLot.risk === 'Bajo' ? 0 : 20;
                        const heightValue = Math.min(base + randomMod, 100);
                        return (
                          <div key={mes} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                            <div className="w-full bg-emerald-50 rounded-t-sm relative flex items-end justify-center h-full group">
                              <div className="w-full bg-emerald-500 rounded-t-sm transition-all duration-1000 group-hover:bg-emerald-400" style={{ height: heightValue + '%' }}></div>
                            </div>
                            <span className="text-xs text-stone-500 font-medium">{mes}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Planificacion de campana</CardTitle>
                        <CardDescription>Simulacion de rendimiento y costos por hectarea.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <StatusRow label="Cultivo planificado" value={selectedLot.crop} />
                            <StatusRow label="Rendimiento estimado" value={selectedLot.crop === 'Arroz' ? '8.5 tn/ha' : selectedLot.crop === 'Maiz' ? '10.2 tn/ha' : '3.5 tn/ha'} />
                            <StatusRow label="Margen bruto" value={selectedLot.crop === 'Arroz' ? 'USD 420/ha' : 'USD 380/ha'} />
                            <StatusRow label="Mercado de granos" value="Estable" />
                            <Button className="w-full mt-2" variant="outline" disabled>Simular escenario</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Gestion operativa</CardTitle>
                        <CardDescription>Seguimiento de labores y aplicaciones en lote.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <StatusRow label="Ultima labor" value="Fumigacion (Hace 3 dias)" />
                            <StatusRow label="Ventana operativa" value="Manana 08:00 - 14:00" />
                            <StatusRow label="Condicion de suelo" value={selectedLot.risk === 'Bajo' ? 'Adecuada (Transitable)' : 'Humedad elevada'} />
                            <StatusRow label="Responsable" value="Ing. Martin Lopez" />
                            <Button className="w-full mt-2 bg-emerald-700 text-white hover:bg-emerald-800" disabled>Asignar orden de trabajo</Button>
                        </div>
                    </CardContent>
                </Card>
              </section>
            </>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50">
              <p className="text-stone-500 font-medium">Selecciona un lote para ver sus datos</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-6 mb-12">
        <Card className="border-stone-200 shadow-sm bg-white overflow-hidden">
          <div className="bg-emerald-50/50 px-6 py-5 border-b border-stone-100 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <CardTitle className="text-emerald-900 text-xl font-serif">Anadir nuevo lote</CardTitle>
              <CardDescription className="text-emerald-700/80 mt-1">Crea un registro de campo para iniciar la sincronizacion satelital.</CardDescription>
            </div>
            {showSuccess && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition-all"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Lote guardado con exito</span>}
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-[1fr,1fr,1fr,auto] gap-5 items-end">
              <div className="grid gap-2">
                <Label htmlFor="newName" className="text-stone-700 font-semibold">Nombre del Lote</Label>
                <Input id="newName" placeholder="Ej. Lote Oeste" value={newName} onChange={e => setNewName(e.target.value)} required className="h-11 border-stone-300 focus-visible:ring-emerald-600" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newCrop" className="text-stone-700 font-semibold">Cultivo</Label>
                <select id="newCrop" value={newCrop} onChange={e => setNewCrop(e.target.value)} className="flex h-11 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                  <option value="Arroz">Arroz</option>
                  <option value="Maiz">Maiz</option>
                  <option value="Soja">Soja</option>
                  <option value="Trigo">Trigo</option>
                  <option value="Girasol">Girasol</option>
                  <option value="Pastura">Pastura</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newHa" className="text-stone-700 font-semibold">Hectareas (ha)</Label>
                <Input id="newHa" type="number" step="0.1" placeholder="Ej. 50.5" value={newHa} onChange={e => setNewHa(e.target.value)} required className="h-11 border-stone-300 focus-visible:ring-emerald-600" />
              </div>
              <Button type="submit" className="h-11 px-8 text-base font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">Guardar Lote</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function AgronautasWorkspace(props: WorkspaceProps) {
  if (props.accessState === 'unauthorized') {
    return (
      <ProductShell product="agronautas" title="Agronautas" description="Inici� sesi�n para acceder a tu workspace." navItems={[]}>
        <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif font-semibold text-stone-900">Ingres� a tu cuenta</h2>
          <p className="mt-4 text-base leading-6 text-stone-600">
            El acceso a esta secci�n es privado. Inici� sesi�n para gestionar tus campos, analizar inteligencia y acceder a todas las herramientas de Agronautas.
          </p>
          <a href="/login?next=/agronautas" className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
            Iniciar sesi�n
          </a>
        </div>
      </ProductShell>
    )
  }

  if (props.accessState === 'loading') {
    return <ProductShell product="agronautas" title="Workspace Agronautas" description="Verificando el acceso controlado al workspace Agronautas." navItems={[]}><div className="mx-auto max-w-4xl px-4 py-12"><VisibilityState state="loading" title="Verificando autenticación Agronautas" description="Confirmando la sesión y el workspace antes de mostrar datos protegidos." retryAllowed={false} /></div></ProductShell>
  }

  if (props.accessState === 'forbidden') {
    return <ProductShell product="agronautas" title="Workspace Agronautas" description="Acceso restringido al workspace Agronautas." navItems={[]}><div className="mx-auto max-w-4xl px-4 py-12"><VisibilityState state="forbidden" title="Acceso Agronautas restringido" description={`Tu sesión no tiene permisos para este workspace (HTTP 403). Consultá al administrador para solicitar acceso.`} /></div></ProductShell>
  }

  if (props.accessState === 'unavailable') {
    return <ProductShell product="agronautas" title="Workspace Agronautas" description="Estado de disponibilidad del workspace Agronautas." navItems={[]}><div className="mx-auto max-w-4xl px-4 py-12"><VisibilityState state="error" title="Backend Agronautas no disponible" description={props.accessReason ?? 'No se pudo conectar con el backend. No se muestran datos como si fueran actuales.'} retryLabel="Reintentar conexión" onRetry={props.onRetrySync} /></div></ProductShell>
  }

  if (props.accessState === 'maintenance') {
    return <ProductShell product="agronautas" title="Workspace Agronautas" description="La autenticación Agronautas está en mantenimiento." navItems={[]}><div className="mx-auto max-w-4xl px-4 py-12"><VisibilityState state="error" title="Autenticación Agronautas en mantenimiento" description={props.accessReason ?? 'No se pudo probar la política de seguridad. Tus datos permanecen protegidos; intentá más tarde.'} retryAllowed={false} /></div></ProductShell>
  }

  const isDemo = props.runtimeMode === 'demo' || props.accessState === 'demo'
  const operationalNavItems = (isDemo ? DEMO_WORKSPACE_VIEWS : OPERATIONAL_WORKSPACE_VIEWS).map((view) => ({
    href: buildWorkspaceHref(view.key, props.selectedFieldId, props.workspaceBasePath),
    label: view.label,
    active: props.workspaceView === view.key,
  }))

  if (props.workspaceView === 'agronomy' && isDemo) {
    return (
      <ProductShell product="agronautas" title="Gestión Agronómica" headerVariant="landing" headerOverlay fullBleed navItems={operationalNavItems}>
        <AgronomyPanel />
      </ProductShell>
    )
  }

  if (props.workspaceView === 'livestock') {
    return (
      <div className="min-h-screen bg-stone-100 text-stone-950">
        <ProductHeader product="agronautas" variant="landing" navItems={operationalNavItems} />
        <main id="main-content" tabIndex={-1}>
          <LivestockPanel />
        </main>
      </div>
    )
  }

  return (
    <ProductShell
      product="agronautas"
      title="Workspace Agronautas"
      headerVariant="landing" headerOverlay fullBleed
      description="De la ubicación del lote a una decisión verificable: cobertura por punto, nivel de riesgo, siguiente acción y evidencia contratada."
       navItems={isDemo ? operationalNavItems : [{ href: '#agronautas-intake', label: 'Nuevo lote' }, ...operationalNavItems, { href: '#agronautas-dashboard', label: 'Decisión' }, { href: '#agronautas-alerts', label: 'Alertas' }, { href: '#agronautas-timeline', label: 'Timeline' }]}
    >
    <div className="relative isolate overflow-hidden bg-emerald-950 pt-20 text-white"><div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover bg-center opacity-30" style={{ backgroundImage: "linear-gradient(90deg, rgba(12,35,25,.8), rgba(12,35,25,.35)), url(/hero-tractor.webp)" }} /><div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 sm:py-16"><div className="mb-6 flex flex-wrap items-center gap-3 text-xs"><span className="font-semibold uppercase tracking-[0.22em] text-emerald-200">Workspace Piloto</span><span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Agronautas</span></div><h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">{ "Gestion de campos" }</h1><p className="mt-5 max-w-xl text-base leading-7 text-stone-100 sm:text-lg">{ "Administra todos tus lotes, monitorea cultivos y controla la informacion base desde un solo lugar." }</p></div></div><div className="agronautas-canvas mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 rounded-[2rem] px-4 py-8 md:px-8">
      
      <section className="hidden">
        <div className="space-y-4">
          <Badge className="bg-amber-200 text-stone-950">Web MVP · Modo {isDemo ? 'demo' : 'real'}</Badge>
          <h2 className="max-w-2xl font-serif text-3xl font-semibold leading-tight md:text-5xl">Agronautas: dashboard de riesgo para el campo argentino.</h2>
          <p className="max-w-2xl text-sm text-white/85 md:text-base">Riesgo, frescura, fuentes y evidencia persistida para lotes agrícolas de Corrientes, sin reglas de negocio calculadas en el cliente.</p>
           {isDemo ? <p role="status" className="max-w-2xl rounded-2xl border border-amber-200/40 bg-amber-100/10 px-4 py-3 text-sm text-amber-100">DEMO LOCAL · SIN PERSISTENCIA. Los cambios de esta sesión son ilustrativos y no representan identidad, rol ni tenancy de producción.</p> : null}
        </div>
        <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
          <CardHeader>
            <CardTitle>Estado operativo</CardTitle>
            <CardDescription className="text-white/75">Contrato {AGRONAUTAS_CONTRACT_VERSION} · React Query + Zustand</CardDescription>
          </CardHeader>
           <CardContent className="grid gap-3 text-sm" data-testid="agronautas-capability-status">
             <StatusRow label="Lote activo" value={props.selectedFieldId ?? 'Ninguno'} />
             <StatusRow label="Última alta" value={props.lastCreatedFieldId ?? 'Sin actividad'} />
             <StatusRow label="Alertas actuales" value={String(props.alerts?.alerts.length ?? 0)} />
             <StatusRow label="Runtime backend" value={props.runtimeStatus === 'ready' ? props.runtimeMode : props.runtimeStatus} />
             <StatusRow label="Fuentes y telemetría" value={props.dashboardPayload?.presentation.sourcesUnavailable ? 'degradado' : 'observado'} />
             {props.runtimeError ? <p role="alert" className="rounded-xl bg-rose-950/60 px-3 py-2 text-sm text-rose-100">{props.runtimeError}</p> : null}
              {props.queryErrors.length ? <div role="alert" aria-label="Error de capacidades Agronautas" className="rounded-xl bg-rose-950/60 px-3 py-2 text-sm text-rose-100"><p>Una capacidad no está disponible: {props.queryErrors[0]}</p><p className="mt-1 text-rose-200">Las demás capacidades continúan visibles con su último estado conocido.</p></div> : null}
             <Button type="button" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={() => void props.onRetrySync()}>Reintentar sincronización</Button>
           </CardContent>
        </Card>
      </section>

       <section className="hidden">
           <Card><CardHeader><CardTitle>Contexto de trabajo</CardTitle><CardDescription>{props.workspace ? `${props.workspace.name} · ${props.workspace.fieldCount} lotes en contexto predeterminado · Solo datos persistidos.` : 'Cargando contexto Agronautas…'}</CardDescription></CardHeader><CardContent><SelectionLineageState location={props.selectedLocation} error={props.selectionError} isResolving={props.isLocationResolving} /></CardContent></Card>
       </section>
        <MockedFieldsCRUD />
</div>
      </ProductShell>
  )
}

function SelectionLineageState({ location, error, isResolving }: { location: AgronautasCanonicalLocation | null; error: string | null; isResolving: boolean }) {
  if (isResolving) return <p role="status">Confirmando selección autorizada…</p>
  if (error) return <p role="alert" aria-label="Selección de lote no disponible">Selección no disponible: {error}</p>
  if (!location) return <p role="status">Elegí un lote para confirmar su ubicación y alcance.</p>
  return <p role="status">Selección autorizada · {location.locationId} · {location.geometry.type} · cobertura {location.coverage.status}</p>
}

function LegacyPlanningPanel({ fieldIndex, planningContext, simulation, onLoadPlanningContext, onSimulateAssumptions }: WorkspaceProps) {
  const [campaignName, setCampaignName] = useState('Campaña demostrativa')
  const [season, setSeason] = useState('2026')
  const [areaHa, setAreaHa] = useState('10')
  const [yieldKg, setYieldKg] = useState('4000')
  const [price, setPrice] = useState('0.4')
  const [variableCost, setVariableCost] = useState('500')
  const [fixedCost, setFixedCost] = useState('200')
  const [error, setError] = useState<string | null>(null)
  const fieldId = fieldIndex?.items[0]?.fieldId
  const runSimulation = async () => {
    setError(null)
    const numericInputs = [areaHa, yieldKg, price, variableCost, fixedCost]
    const hasInvalidNumericInput = numericInputs.some((value) => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0) || Number(areaHa) <= 0 || Number(yieldKg) <= 0
    if (hasInvalidNumericInput) {
      setError('Completá todos los supuestos con valores válidos antes de calcular.')
      return
    }
    try {
      await onSimulateAssumptions({ contractVersion: 'agronautas-assumption-simulation-v1', areaHa: Number(areaHa), expectedYieldKgPerHa: Number(yieldKg), pricePerKg: Number(price), variableCostPerHa: Number(variableCost), fixedCost: Number(fixedCost), currency: 'ARS', precision: 2, units: { area: 'ha', expectedYield: 'kg/ha', price: 'currency/kg', variableCost: 'currency/ha', fixedCost: 'currency' }, assumptions: ['Valores ingresados manualmente; no son datos observados.'] })
    } catch {
      setError('Completá todos los supuestos con valores válidos antes de calcular.')
    }
  }
  return <section id="agronautas-planning" className="grid gap-5" aria-label="Planificación de campaña Agronautas">
    <Card><CardHeader><CardTitle>Planificación de campaña</CardTitle><CardDescription>Contexto de solo lectura y simulación local con supuestos de la persona usuaria. No se guarda una campaña ni una relación de propiedad.</CardDescription></CardHeader><CardContent className="grid gap-4">
       <div className="grid gap-4 md:grid-cols-2"><Field label="Nombre de campaña" name="campaign-name" autoComplete="off" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} /><Field label="Temporada" name="campaign-season" autoComplete="off" value={season} onChange={(event) => setSeason(event.target.value)} /></div>
        <Button type="button" className={focusVisibleClassName} onClick={() => void onLoadPlanningContext({ campaignName, season, fieldIds: [fieldId ?? 'field-demo-1'] })}>Ver contexto de lectura</Button>
       {planningContext ? <div role="status" className="grid gap-4 rounded-2xl border border-stone-200 p-4">
         <div>
           <p className="font-semibold">{planningContext.campaignName} · {planningContext.season}</p>
           <p className="text-sm">{planningContext.fields.length} lote(s) · persistencia: {planningContext.persistent ? 'sí' : 'no'}</p>
         </div>
         <div className="grid gap-2" aria-label="Datos de lotes seleccionados">
           <h3 className="font-semibold">Datos de lotes seleccionados</h3>
           <ul className="grid gap-3 sm:grid-cols-2">
             {planningContext.fields.map((field) => <li key={field.fieldId} className="rounded-xl border border-stone-200 p-3 text-sm">
               <p className="font-semibold">{field.externalFieldId}</p>
               <dl className="mt-2 grid gap-1 text-stone-700">
                 <div><dt className="inline font-medium">Cultivo: </dt><dd className="inline">{field.crop}</dd></div>
                 <div><dt className="inline font-medium">Área: </dt><dd className="inline">{field.hectares} ha</dd></div>
                 <div><dt className="inline font-medium">Localidad: </dt><dd className="inline">{field.locality}</dd></div>
                 <div><dt className="inline font-medium">Geometría: </dt><dd className="inline">{field.geometryStatus}</dd></div>
               </dl>
             </li>)}
           </ul>
         </div>
         <div className="grid gap-2" aria-label="Evidencia del contexto de planificación">
           <h3 className="font-semibold">Evidencia del contexto</h3>
           <ul className="grid gap-3 sm:grid-cols-2">
             {planningContext.evidence.map((item) => <li key={item.fieldId} className="grid gap-2 rounded-xl border border-stone-200 p-3 text-sm">
               <p className="font-semibold">{item.fieldId}</p>
               <PlanningEvidenceDetails label="Clima" evidence={item.climate} />
               <PlanningEvidenceDetails label="Riesgo" evidence={item.risk} />
             </li>)}
           </ul>
         </div>
         <ul className="grid gap-2 sm:grid-cols-2">{planningContext.availability.map((item: CampaignPlanningContextResponse['availability'][number]) => <li key={item.domain} className="rounded-xl border border-dashed border-stone-300 p-3 text-sm"><span className="font-semibold">{item.domain}</span>: {item.state}. {item.reason}</li>)}</ul>
       </div> : null}
       <div className="grid gap-4 border-t border-stone-200 pt-4"><div><h3 className="font-semibold">Simulador de supuestos</h3><p className="text-sm text-stone-600">Resultado aritmético transparente; no es pronóstico, recomendación ni dato de mercado.</p></div><div className="grid gap-4 md:grid-cols-3"><Field label="Área (ha)" name="simulation-area" type="number" min="0" step="0.01" value={areaHa} aria-describedby={error ? 'simulation-error' : undefined} onChange={(event) => setAreaHa(event.target.value)} /><Field label="Rendimiento supuesto (kg/ha)" name="simulation-yield" type="number" min="0" step="0.01" value={yieldKg} aria-describedby={error ? 'simulation-error' : undefined} onChange={(event) => setYieldKg(event.target.value)} /><Field label="Precio supuesto (ARS/kg)" name="simulation-price" type="number" min="0" step="0.01" value={price} aria-describedby={error ? 'simulation-error' : undefined} onChange={(event) => setPrice(event.target.value)} /><Field label="Costo variable (ARS/ha)" name="simulation-variable-cost" type="number" min="0" step="0.01" value={variableCost} aria-describedby={error ? 'simulation-error' : undefined} onChange={(event) => setVariableCost(event.target.value)} /><Field label="Costo fijo (ARS)" name="simulation-fixed-cost" type="number" min="0" step="0.01" value={fixedCost} aria-describedby={error ? 'simulation-error' : undefined} onChange={(event) => setFixedCost(event.target.value)} /></div><Button type="button" onClick={() => void runSimulation()}>Calcular supuesto</Button>{error ? <p id="simulation-error" role="alert">{error}</p> : null}{!error && simulation?.status === 'insufficient_evidence' ? <p id="simulation-insufficient-evidence" role="alert">Evidencia insuficiente: {simulation.reason} ({simulation.missingInputs.join(', ')})</p> : null}{!error && simulation?.status === 'complete' ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold">Simulación basada en supuestos de usuario</p><p className="text-sm">Etiqueta: {simulation.result.label} · moneda: {simulation.result.currency}</p><dl className="mt-3 grid gap-2 sm:grid-cols-4">{Object.entries(simulation.result.outputs).map(([key, value]) => <div key={key}><dt className="text-xs text-stone-600">{key}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></div> : null}</div>
     </CardContent></Card>
   </section>
}

type PlanningEvidence = CampaignPlanningContextResponse['evidence'][number]['climate'] | CampaignPlanningContextResponse['evidence'][number]['risk']

function PlanningEvidenceDetails({ label, evidence }: { label: string; evidence: PlanningEvidence }) {
  if (evidence.state === 'unavailable') return <div><p className="font-medium">{label}: {evidence.state}</p><p className="text-stone-600">{evidence.reason}</p></div>
  return <div><p className="font-medium">{label}: {evidence.state}</p><p className="text-stone-600">Fuente: {evidence.source} · Frescura: {evidence.freshness}</p><p className="text-stone-600">Observado: {evidence.observedAt} · Proveniencia: {evidence.provenance.join(', ')}</p></div>
}

function FieldIndexPanel({ index, isLoading, isFetchingNextPage, hasNextPage, onLoadMore, onSelectField }: { index?: AgronautasWorkspaceFieldPage; isLoading: boolean; isFetchingNextPage: boolean; hasNextPage: boolean; onLoadMore: () => void; onSelectField: (fieldId: string) => void }) {
  return <Card className="xl:col-span-2" aria-label="Índice de lotes Agronautas"><CardHeader><CardTitle>Índice de lotes</CardTitle><CardDescription>Registros persistidos del contexto seleccionado, ordenados por última actualización. No se inventan lotes cuando la fuente está vacía.</CardDescription></CardHeader><CardContent>{isLoading || !index ? <p role="status">Cargando lotes…</p> : index.items.length === 0 ? <p role="status">No hay lotes disponibles.</p> : <><ul className="grid gap-3 md:grid-cols-2">{index.items.map((item) => <li key={item.fieldId} className="rounded-2xl border border-stone-200 p-4"><p className="font-semibold">{item.externalFieldId}</p><p className="text-sm text-stone-600">{item.locality} · {item.crop} · {item.hectares} ha</p><p className="mt-2 text-xs uppercase tracking-wide text-stone-500">Geometría: {item.geometryStatus === 'saved' ? 'guardada' : 'sólo punto'}</p><Button type="button" variant="outline" className="mt-3" onClick={() => onSelectField(item.fieldId)}>Abrir detalle</Button></li>)}</ul>{hasNextPage ? <Button type="button" variant="outline" className="mt-4" onClick={onLoadMore} disabled={isFetchingNextPage}>{isFetchingNextPage ? 'Cargando lotes…' : 'Cargar más lotes'}</Button> : null}</>}</CardContent></Card>
}

function IntakePanel({ intakeError, isSubmitting, onSubmitIntake }: WorkspaceProps) {
  const mapAdapter = createAgronautasMapAdapter()
  const defaultPoint = { lat: -29.1846, lng: -58.0759 }
  const [localityQuery, setLocalityQuery] = useState('Mercedes')
  const [selectedLocality, setSelectedLocality] = useState(AGRONAUTAS_LOCALITIES[0])
  const [point, setPoint] = useState(defaultPoint)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const submitInFlightRef = useRef(false)
  const coverage = previewAgronautasPoint(point)
  const matches = mapAdapter.searchLocalities(localityQuery)

  async function handleSubmit(form: HTMLFormElement) {
    const valueFor = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value ?? ''
    const values = {
      fieldId: valueFor('fieldId'),
      locality: selectedLocality && localityQuery.trim() === selectedLocality.name ? selectedLocality.name : '',
      lat: valueFor('lat'),
      lng: valueFor('lng'),
      hectares: valueFor('hectares'),
      growthStage: valueFor('growthStage'),
      crop: valueFor('crop'),
    }
    const nextErrors = validateIntakeValues(values)
    if (Object.keys(nextErrors).length) {
      setValidationErrors(nextErrors)
      const firstInvalidField = Object.keys(nextErrors)[0]
      if (firstInvalidField) document.getElementById(firstInvalidField)?.focus()
      return
    }

    setValidationErrors({})
    await onSubmitIntake({
      contractVersion: AGRONAUTAS_CONTRACT_VERSION,
      fieldId: values.fieldId,
      cropCategory: 'cereal',
      crop: values.crop as FieldIntake['crop'],
      provinceCode: 'AR-W',
      countryCode: 'AR',
      hectares: Number(values.hectares),
      locality: values.locality,
      growthStage: parseOptional(values.growthStage) as FieldIntake['growthStage'],
      location: {
        lat: Number(values.lat || point.lat),
        lng: Number(values.lng || point.lng),
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo lote · intake geográfico</CardTitle>
        <CardDescription>Buscá una localidad o mové el pin textual. La previsualización orienta; el backend mantiene la decisión contractual de cobertura.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          data-testid="agronautas-intake-form"
          aria-label="Alta de lote Agronautas"
          aria-describedby={intakeError ? AGRONAUTAS_INTAKE_ERROR_ID : undefined}
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault()
            if (submitInFlightRef.current) return
            submitInFlightRef.current = true
            try {
               await handleSubmit(event.currentTarget)
            } catch {
              // Error surface is handled in store state by the mutation.
            } finally {
              submitInFlightRef.current = false
            }
          }}
        >
           <Field label="ID externo" name="fieldId" autoComplete="off" error={validationErrors['fieldId']} placeholder="corrientes-lote-001" defaultValue="corrientes-lote-001" />
          <div className="grid gap-2">
            <Label htmlFor="locality-search">Buscar localidad</Label>
              <Input id="locality-search" name="localityQuery" autoComplete="address-level2" aria-invalid={validationErrors['locality'] ? true : undefined} aria-describedby={validationErrors['locality'] ? 'locality-error' : undefined} value={localityQuery} onChange={(event) => setLocalityQuery(event.target.value)} placeholder="Mercedes" className={focusVisibleClassName} />
            {localityQuery.trim() ? <div className="grid gap-2" role="listbox" aria-label="Localidades sugeridas">{matches.map((locality) => <button className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-left text-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" key={locality.id} type="button" role="option" aria-selected={selectedLocality?.id === locality.id} onClick={() => { setSelectedLocality(locality); setLocalityQuery(locality.name); if (locality.coordinates) setPoint(locality.coordinates) }}>{locality.name} · {locality.provinceCode}</button>)}</div> : null}
             <input type="hidden" name="locality" value={selectedLocality?.name ?? localityQuery} />
              {validationErrors['locality'] ? <p id="locality-error" role="alert" aria-live="assertive" aria-atomic="true">{validationErrors['locality']}</p> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
              <Field label="Latitud" name="lat" autoComplete="off" error={validationErrors['lat']} type="number" step="0.0001" defaultValue={point.lat} onChange={(event) => setPoint((current) => ({ ...current, lat: Number(event.target.value) }))} />
              <Field label="Longitud" name="lng" autoComplete="off" error={validationErrors['lng']} type="number" step="0.0001" defaultValue={point.lng} onChange={(event) => setPoint((current) => ({ ...current, lng: Number(event.target.value) }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hectáreas" name="hectares" autoComplete="off" error={validationErrors['hectares']} type="number" step="0.1" defaultValue="42.5" />
            <div className="grid gap-2">
              <Label htmlFor="growthStage">Etapa</Label>
                <Select id="growthStage" name="growthStage" autoComplete="off" aria-invalid={validationErrors['growthStage'] ? true : undefined} aria-describedby={validationErrors['growthStage'] ? 'growthStage-error' : undefined} className={focusVisibleClassName} defaultValue="tillering">
                <option value="emergence">Emergencia</option>
                <option value="tillering">Macollaje</option>
                <option value="panicle_initiation">Iniciación de panoja</option>
                <option value="flowering">Floración</option>
                <option value="maturity">Madurez</option>
               </Select>
                {validationErrors['growthStage'] ? <p id="growthStage-error" role="alert" aria-live="assertive" aria-atomic="true">{validationErrors['growthStage']}</p> : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="crop">Cultivo permitido</Label>
              <Select id="crop" name="crop" autoComplete="off" aria-invalid={validationErrors['crop'] ? true : undefined} aria-describedby={validationErrors['crop'] ? 'crop-error' : undefined} className={focusVisibleClassName} defaultValue="rice">
              {agronautasSupportedCrops.map((crop) => <option key={crop} value={crop}>{cropLabel(crop)}</option>)}
             </Select>
              {validationErrors['crop'] ? <p id="crop-error" role="alert" aria-live="assertive" aria-atomic="true">{validationErrors['crop']}</p> : null}
          </div>
          <div className="grid gap-3">
            <MapFrame title="Previsualización de cobertura" fallback={`${selectedLocality?.name ?? 'Localidad no seleccionada'} · ${coverage.provinceCode ?? 'sin provincia'} · ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`}>
              <div className="flex flex-wrap items-center gap-2"><StatusBadge state={coverage.state === 'inside' ? 'success' : coverage.state === 'outside' ? 'missing' : 'degraded'} /><span className="text-sm text-stone-700">Cobertura por punto · {coverage.locality ?? 'fuera del alcance previsualizado'}</span></div>
            </MapFrame>
            <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">`polygonWkt` se conserva en el contrato, pero este MVP resuelve cobertura por punto y no promete análisis poligonal.</p>
            <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">Google Maps no está disponible sin una clave pública restringida; la búsqueda por localidad y coordenadas continúa operativa.</p>
          </div>
           {intakeError ? <p id={AGRONAUTAS_INTAKE_ERROR_ID} role="alert" aria-label="Error de intake Agronautas" aria-live="assertive" aria-atomic="true" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{intakeError}</p> : null}
           <Button type="submit" className={focusVisibleClassName} data-testid="agronautas-submit-intake" disabled={isSubmitting}>{isSubmitting ? 'Registrando…' : 'Registrar lote'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function DashboardPanel({ selectedFieldId, field }: WorkspaceProps) {
  if (!selectedFieldId) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Dashboard listo para el primer lote</CardTitle>
          <CardDescription>Selecciona un lote en la lista superior para visualizar los indicadores climaticos y satelitales.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div id="agronautas-dashboard" className="grid gap-6">
        <section className="grid gap-5 rounded-[2rem] border border-emerald-900/20 bg-emerald-950 p-5 text-white shadow-lg md:grid-cols-[1.15fr,0.85fr] md:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Resumen Satelital � {field?.externalFieldId ?? selectedFieldId}</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Decision del lote</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">Monitor consolidado de clima, fenologia y riesgo h�drico. Las condiciones actuales del campo son estables.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-100">Riesgo Bajo Confirmado</span>
            <span className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white">Sincronizacion Satelital: Activa</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <VisibilityMetricCard label="Nivel de riesgo" value="Riesgo Bajo" detail="18/100 (Estable)" />
          <VisibilityMetricCard label="Confianza" value="94%" detail="Calculada por satelite" />
          <VisibilityMetricCard label="Siguiente accion" value="Monitorear" detail="Continuar plan de manejo" />
          <VisibilityMetricCard label="Frescura" value="fresh" detail="Actualizado hace 10 min" />
        </div>
      </section>

       <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard label="Localidad" value={field?.locality ?? 'Corrientes'} detail={field?.externalFieldId ?? selectedFieldId} />
        <MetricCard label="Humedad de Suelo" value="62%" detail="Ideal para maquinaria" />
        <MetricCard label="Precipitacion Acum." value="12 mm" detail="En las ultimas 48 hs" />
        <MetricCard label="Temp. Promedio" value="24�C" detail="Sin estres termico" />
      </div>

      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Modelos Operativos Sincronizados</p>
            <p className="text-sm text-emerald-800">Todos los modelos agrometeorologicos indican condiciones favorables. Mapa de geometria satelital conectado (vista en desarrollo).</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-emerald-300 text-emerald-800 hover:bg-emerald-100" disabled>Indices Normalizados</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{detail}</p>
      </CardContent>
    </Card>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/10 px-4 py-3"><span className="text-white/70">{label}</span><span className="font-medium">{value}</span></div>
}

interface IntakeValues {
  fieldId: string
  locality: string
  lat: string
  lng: string
  hectares: string
  growthStage: string
  crop: string
}

function validateIntakeValues(values: IntakeValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.fieldId.trim()) errors['fieldId'] = 'El ID externo es obligatorio.'
  if (!values.locality.trim()) errors['locality'] = 'Seleccioná una localidad.'
  if (!values.lat.trim() || !Number.isFinite(Number(values.lat))) errors['lat'] = 'Ingresá una latitud válida.'
  if (!values.lng.trim() || !Number.isFinite(Number(values.lng))) errors['lng'] = 'Ingresá una longitud válida.'
  if (!values.hectares.trim() || !Number.isFinite(Number(values.hectares)) || Number(values.hectares) <= 0) errors['hectares'] = 'Ingresá una superficie mayor que cero.'
  if (!values.growthStage.trim()) errors['growthStage'] = 'Seleccioná una etapa del cultivo.'
  if (!values.crop.trim()) errors['crop'] = 'Seleccioná un cultivo permitido.'
  return errors
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
}

function Field({ label, name, error, className, ...props }: FieldProps) {
  const errorId = `${name}-error`
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        {...props}
        id={name}
        name={name}
        autoComplete={props.autoComplete ?? 'off'}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={`${focusVisibleClassName}${className ? ` ${className}` : ''}`}
      />
      {error ? <p id={errorId} role="alert" aria-label={`Error de formulario: ${label}`} aria-live="assertive" aria-atomic="true">{error}</p> : null}
    </div>
  )
}

function parseOptional(value: FormDataEntryValue | null) {
  const parsed = String(value ?? '').trim()
  return parsed.length ? parsed : undefined
}

function AgronautasEvidenceStatePanel({ dashboardPayload, hydrologyDashboard, risk }: { dashboardPayload?: DashboardSnapshot; hydrologyDashboard?: HydrologyDashboard; risk?: RiskCurrent }) {
  const weather = dashboardPayload?.provenance.find((item) => item.signalType === 'weather')
  const missingSignal = dashboardPayload?.signals.find((item) => item.status === 'missing')
  const forecast = hydrologyDashboard?.forecasts[0]
  const items: Array<{ label: string; evidence: EvidenceViewModel }> = [
    { label: 'Risk snapshot', evidence: normalizeEvidence({ state: EVIDENCE_STATE.OBSERVED, source: 'Agronautas risk snapshot', observedAt: risk?.snapshot.computedAt }) },
    { label: 'INA forecast', evidence: normalizeEvidence({ source: forecast?.source, observedAt: forecast?.observedAt, forecast: true }) },
    { label: 'Latest-good cache', evidence: normalizeEvidence({ state: EVIDENCE_STATE.CACHED, source: weather?.provider, lastSuccessfulObservedAt: weather?.lastSuccessfulObservedAt }) },
    { label: 'Risk freshness', evidence: normalizeEvidence({ state: risk?.status === 'stale' ? EVIDENCE_STATE.STALE : EVIDENCE_STATE.DEGRADED, source: 'Agronautas risk snapshot', lastSuccessfulObservedAt: risk?.snapshot.computedAt }) },
    { label: 'Dashboard availability', evidence: normalizeEvidence({ state: dashboardPayload?.freshness === 'degraded' ? EVIDENCE_STATE.DEGRADED : EVIDENCE_STATE.MISSING, detail: dashboardPayload?.presentation.staleFlags.join(', ') }) },
    { label: 'Provider mode', evidence: normalizeEvidence({ source: weather?.provider, observedAt: weather?.observedAt, mode: weather?.providerMode === 'mock' ? 'mock' : weather?.providerMode === 'seam' ? 'seam' : 'unavailable' }) },
    { label: 'Satellite signal', evidence: normalizeEvidence({ state: missingSignal ? EVIDENCE_STATE.MISSING : EVIDENCE_STATE.OBSERVED, source: 'satellite-vegetation', observedAt: missingSignal ? undefined : dashboardPayload?.generatedAt, detail: missingSignal?.degradationReasons.join(', ') }) },
  ]

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5" aria-label="Estados de evidencia Agronautas">
      <h2 className="text-xl font-semibold">Estados de evidencia</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Cada estado conserva la diferencia entre dato observado, pronóstico, cacheado y seam sin afirmar una adquisición nueva.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => <li key={item.label} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] p-3"><span className="text-sm font-medium">{item.label}</span><EvidenceStateBadge state={item.evidence.state} /></li>)}
      </ul>
    </section>
  )
}

function cropLabel(crop: string) {
  const labels: Record<string, string> = { rice: 'Arroz', maize: 'Maíz', soybean: 'Soja', wheat: 'Trigo', sunflower: 'Girasol', pasture: 'Pastura', citrus: 'Cítricos', other: 'Otro' }
  return labels[crop] ?? crop
}

function toAlertLabel(type: string) {
  switch (type) {
    case 'flood': return 'Riesgo de anegamiento'
    case 'water_stress': return 'Estrés hídrico'
    case 'thermal_stress': return 'Estrés térmico'
    default: return type
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Sin fecha disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function confidenceLabel(confidence: number): 'alta' | 'media' | 'baja' {
  if (confidence >= 0.75) return 'alta'
  if (confidence >= 0.5) return 'media'
  return 'baja'
}

function toRiskLabel(level: HydrologyDashboard['status']['riskLevel'] | undefined) {
  switch (level) {
    case 'high': return 'Riesgo alto'
    case 'moderate': return 'Riesgo moderado'
    case 'low': return 'Riesgo bajo'
    default: return 'Riesgo sin clasificar'
  }
}

function toTendencyLabel(tendency: string | undefined) {
  const normalized = tendency?.toLowerCase()
  if (normalized?.includes('crece') || normalized?.includes('rising')) return 'Crece'
  if (normalized?.includes('baja') || normalized?.includes('falling')) return 'Baja'
  if (normalized?.includes('estable') || normalized?.includes('stable')) return 'Estable'
  return tendency ?? 'Sin tendencia'
}

function stationLabel(stationId: string) {
  return stationId.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}
