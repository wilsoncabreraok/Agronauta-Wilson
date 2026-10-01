'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, MapPin, Plus, Sprout, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from './agronomy-data'
import {
  campaigns,
  campaignStatuses,
  campaignTotals,
  filterCampaigns,
  type Campaign,
  type CampaignFilters,
  type CampaignStatus,
} from './campaign-data'

const control =
  'mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm'
const number = (value: number) => value.toLocaleString('es-AR')
const money = (value: number) => `USD ${number(value)}`
const emptyFilters: CampaignFilters = { search: '', cycle: '', crop: '', field: '', status: '' }
const statusStyles: Record<CampaignStatus, string> = {
  Planificada: 'bg-sky-50 text-sky-800',
  'En curso': 'bg-emerald-50 text-emerald-800',
  Finalizada: 'bg-stone-100 text-stone-700',
  Pausada: 'bg-amber-50 text-amber-900',
}
function Status({ status }: { status: CampaignStatus }) {
  return <Badge className={`shrink-0 ${statusStyles[status]}`}>{status}</Badge>
}
function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 overflow-hidden rounded-full bg-stone-100"
    >
      <div
        className="h-full rounded-full bg-emerald-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
function Facts({ campaign }: { campaign: Campaign }) {
  const entries = [
    ['Campo', campaign.field.name],
    ['Lote / zona', campaign.lot.name],
    ['Cultivo', campaign.crop],
    ['Variedad', campaign.variety],
    ['Superficie', `${number(campaign.area)} ha`],
    ['Siembra', formatDate(campaign.sowingDate)],
    ['Cosecha estimada', formatDate(campaign.harvestDate)],
    ['Rendimiento objetivo', `${number(campaign.targetYield)} kg/ha`],
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
      {entries.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-stone-500">{label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-stone-800">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function CampaignCosts({ campaign }: { campaign: Campaign }) {
  const totals = campaignTotals(campaign)
  return (
    <Card className="min-w-0 bg-white p-5 sm:p-6">
      <h3 className="text-xl font-semibold">Presupuesto de campaña</h3>
      <p className="mt-1 text-sm text-stone-500">Importes de referencia en USD · {campaign.name}</p>
      <dl className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Presupuesto total', money(totals.budget)],
          ['Costo ejecutado', money(totals.executed)],
          ['Saldo disponible', money(totals.balance)],
          ['Porcentaje utilizado', `${totals.used}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="mt-2 break-words text-lg font-semibold text-emerald-900">{value}</dd>
          </div>
        ))}
      </dl>
      <Progress value={totals.used} label="Presupuesto utilizado" />
      <div className="mt-6 space-y-4">
        {campaign.costs.map((cost) => (
          <div key={cost.category}>
            <div className="mb-2 flex flex-wrap justify-between gap-1 text-sm">
              <span className="font-medium">{cost.category}</span>
              <span className="text-stone-500">
                {money(cost.executed)} / {money(cost.budget)}
              </span>
            </div>
            <Progress
              value={cost.budget ? Math.round((cost.executed / cost.budget) * 100) : 0}
              label={`Ejecutado en ${cost.category}`}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-stone-500">
        Ejecutado / presupuestado por rubro. Datos demostrativos, sin movimientos contables.
      </p>
    </Card>
  )
}

function CampaignDetail({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const totals = campaignTotals(campaign)
  const next = campaign.activities[0]
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={16} className="mr-2" />
        Volver a campañas
      </Button>
      <Card className="border-emerald-900 bg-emerald-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
              Campaña {campaign.cycle}
            </p>
            <h2 ref={heading} tabIndex={-1} className="mt-2 text-3xl">
              {campaign.name}
            </h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-100">
              <MapPin size={16} />
              {campaign.field.name} · Lote {campaign.lot.name}
            </p>
          </div>
          <Status status={campaign.status} />
        </div>
        <p className="mt-5 text-xs text-emerald-100">
          Seguimiento simulado al {formatDate(campaign.asOf)} · {campaign.variety}
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          ['Superficie', `${number(campaign.area)} ha`],
          ['Avance', `${campaign.progress}%`],
          ['Rendimiento objetivo', `${number(campaign.targetYield)} kg/ha`],
          ['Presupuesto', money(totals.budget)],
          ['Costo ejecutado', money(totals.executed)],
          ['Próxima actividad', next?.title ?? 'Sin actividades pendientes'],
        ].map(([label, value]) => (
          <Card key={label} className="min-w-0 bg-white p-4">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="mt-3 break-words text-lg font-semibold text-stone-900">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="bg-white p-5 sm:p-6">
        <h3 className="text-xl font-semibold">Timeline productivo</h3>
        <p className="mt-1 text-sm text-stone-500">
          De la preparación a la cosecha{campaign.status === 'Pausada' ? ' · Campaña pausada' : ''}
        </p>
        <ol className="mt-6 grid gap-3 md:grid-cols-6">
          {campaign.stages.map((stage, index) => (
            <li
              key={stage.name}
              aria-current={stage.status === 'Actual' ? 'step' : undefined}
              className={`relative flex items-center gap-3 rounded-2xl border p-3 md:flex-col md:items-start ${stage.status === 'Actual' ? 'border-emerald-600 bg-emerald-50' : 'border-stone-200'}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${stage.status === 'Completado' ? 'bg-emerald-800 text-white' : stage.status === 'Actual' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-500'}`}
              >
                {stage.status === 'Completado' ? <Check size={16} aria-hidden="true" /> : index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{stage.name}</p>
                <p className="mt-1 text-xs text-stone-500">{stage.status}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="bg-white p-5 sm:p-6">
            <h3 className="mb-5 text-xl font-semibold">Ficha productiva</h3>
            <Facts campaign={campaign} />
          </Card>
          <Card className="bg-white p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Próximas actividades</h3>
            {campaign.activities.length ? (
              <ul className="mt-4 divide-y divide-stone-100">
                {campaign.activities.map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{activity.title}</p>
                      <Badge
                        className={
                          activity.status === 'Programada'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-900'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {formatDate(activity.date)} · Lote {campaign.lot.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Responsable: {activity.responsible}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-stone-500">
                Campaña finalizada. No hay actividades pendientes.
              </p>
            )}
          </Card>
        </div>
        <CampaignCosts campaign={campaign} />
      </div>
      <Card className="bg-stone-50 p-5 sm:p-6">
        <h3 className="font-semibold">Del campo al mercado</h3>
        <p className="mt-2 text-sm text-stone-500">
          La campaña reúne el recorrido productivo. Las conexiones con otros módulos se incorporarán
          más adelante.
        </p>
        <ol className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {[
            campaign.field.name,
            campaign.name,
            `Lote ${campaign.lot.name}`,
            'Labor',
            'Insumos y maquinaria',
            'Monitoreo',
            'Cosecha',
            'Lote de producción',
            'Marketplace',
          ].map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-stone-400">
                  →
                </span>
              )}
              <span
                className={`rounded-lg px-3 py-2 ${index < 3 ? 'bg-emerald-100 text-emerald-900' : 'border border-dashed border-stone-300 text-stone-600'}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

export function CampaignsPanel() {
  const [filters, setFilters] = useState<CampaignFilters>(emptyFilters)
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [creating, setCreating] = useState(false)
  const returnId = useRef<string | null>(null)
  useEffect(() => {
    if (!selected && returnId.current) {
      document.getElementById(`campaign-open-${returnId.current}`)?.focus()
      returnId.current = null
    }
  }, [selected])
  const visible = filterCampaigns(campaigns, filters)
  if (selected)
    return (
      <CampaignDetail
        campaign={selected}
        onBack={() => {
          returnId.current = selected.id
          setSelected(null)
        }}
      />
    )
  return (
    <section aria-label="Campañas productivas" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Planificación y seguimiento
          </p>
          <h2 className="mt-2 text-3xl text-stone-900">Campañas productivas</h2>
          <p className="mt-2 text-sm text-stone-500">
            Cada cultivo, su recorrido. Del primer trabajo a la cosecha.
          </p>
        </div>
        <Button className="min-h-11 bg-emerald-800 text-white" onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-2" />
          Nueva campaña
        </Button>
      </div>
      <p className="text-xs text-stone-500">
        Escenario de campañas al 01/12/2026 · Datos ficticios · Moneda: USD
      </p>
      <Card className="bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-medium text-stone-600">
            Buscar campaña
            <input
              type="search"
              placeholder="Nombre, lote o variedad"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              className={control}
            />
          </label>
          {(
            [
              [
                'cycle',
                'Campaña / ciclo',
                [...new Set(campaigns.map((c) => c.cycle))].map((v) => [v, v]),
              ],
              ['crop', 'Cultivo', [...new Set(campaigns.map((c) => c.crop))].map((v) => [v, v])],
              [
                'field',
                'Campo',
                [
                  ...new Map(
                    campaigns.map((c) => [c.field.id, [c.field.id, c.field.name]])
                  ).values(),
                ],
              ],
              ['status', 'Estado', campaignStatuses.map((v) => [v, v])],
            ] as [keyof CampaignFilters, string, string[][]][]
          ).map(([key, label, options]) => (
            <label key={key} className="text-xs font-medium text-stone-600">
              {label}
              <select
                aria-label={label}
                value={filters[key]}
                onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}
                className={control}
              >
                <option value="">Todos</option>
                {options.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-xs text-stone-500">
            {visible.length} de {campaigns.length} campañas ·{' '}
            {number(visible.reduce((sum, c) => sum + c.area, 0))} ha en la selección
          </p>
          <Button variant="ghost" onClick={() => setFilters(emptyFilters)}>
            Limpiar filtros
          </Button>
        </div>
      </Card>
      {visible.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((campaign) => (
            <Card key={campaign.id} className="flex min-w-0 flex-col bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Sprout size={18} />
                  {campaign.cycle}
                </span>
                <Status status={campaign.status} />
              </div>
              <h3 className="mb-5 text-xl font-semibold text-stone-900">{campaign.name}</h3>
              <Facts campaign={campaign} />
              <div className="mt-6 border-t border-stone-100 pt-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-stone-500">Avance productivo</span>
                  <strong>{campaign.progress}%</strong>
                </div>
                <Progress value={campaign.progress} label={`Avance de ${campaign.name}`} />
              </div>
              <Button
                id={`campaign-open-${campaign.id}`}
                variant="outline"
                className="mt-5 min-h-11 w-full text-emerald-800"
                aria-label={`Ver campaña ${campaign.name}`}
                onClick={() => setSelected(campaign)}
              >
                Ver campaña
                <ArrowUpRight size={16} className="ml-2" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white p-10 text-center">
          <Sprout className="mx-auto mb-3 text-emerald-700" />
          <h3 className="text-xl">No hay campañas que coincidan</h3>
          <p className="mt-2 text-sm text-stone-500">
            Probá otro cultivo, campo o estado, o limpiá los filtros.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => setFilters(emptyFilters)}>
            Mostrar todas las campañas
          </Button>
        </Card>
      )}
      {creating && <NewCampaignDialog onClose={() => setCreating(false)} />}
    </section>
  )
}

function NewCampaignDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current
    const overflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-labelledby="campaign-new-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-xl backdrop:bg-stone-950/50"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="campaign-new-title" className="text-2xl">
          Nueva campaña
        </h2>
        <Button variant="ghost" aria-label="Cerrar" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      <p className="mt-5 text-sm leading-6 text-stone-600">
        La creación de campañas estará disponible en una próxima etapa. Podrás definir campo, lote,
        cultivo, fechas y presupuesto. En esta demo podés recorrer las campañas de ejemplo.
      </p>
      <Button className="mt-6 bg-emerald-800 text-white" onClick={onClose}>
        Volver al listado
      </Button>
    </dialog>
  )
}

export function CampaignPlanningPanel({ mode }: { mode: 'costs' | 'harvest' }) {
  const [id, setId] = useState(campaigns[0]!.id)
  const campaign = campaigns.find((item) => item.id === id)!
  return (
    <section className="space-y-5">
      <h2 className="text-2xl">{mode === 'costs' ? 'Costos por campaña' : 'Plan de cosecha'}</h2>
      <label className="block max-w-md text-sm">
        Seleccionar campaña
        <select className={control} value={id} onChange={(event) => setId(event.target.value)}>
          {campaigns.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.field.name}
            </option>
          ))}
        </select>
      </label>
      {mode === 'costs' ? (
        <CampaignCosts campaign={campaign} />
      ) : (
        <Card className="bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h3 className="text-xl">{campaign.name}</h3>
            <Status status={campaign.status} />
          </div>
          <Facts campaign={campaign} />
          <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            Producción objetivo: {number((campaign.area * campaign.targetYield) / 1000)} t.
            Estimación de planificación, no rendimiento registrado.
          </p>
          <p className="mt-4 text-sm text-stone-500">
            El registro de cosecha y la vinculación del lote de producción con Marketplace se
            incorporarán en una próxima etapa.
          </p>
        </Card>
      )}
    </section>
  )
}
