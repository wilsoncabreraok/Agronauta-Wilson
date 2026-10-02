'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from './jakaru-page'

type GardenType = 'De estudio' | 'Comunitaria' | 'Familiar'
type Variable = 'Humedad del suelo' | 'Temperatura ambiente'
type View = 'overview' | 'gardens' | 'study'
type Period = 7 | 30

type Garden = { id: string; name: string; type: GardenType; locality: string; crops: string[] }
type Measurement = { id: string; gardenId: string; variable: Variable; value: number; unit: string; date: string }
type FollowUp = { id: string; gardenId: string; date: string; observation: string }

const gardens: Garden[] = [
  { id: 'estudio-norte', name: 'Huerta de estudio Norte', type: 'De estudio', locality: 'Monte Caseros, Corrientes', crops: ['Lechuga', 'Acelga', 'Rúcula'] },
  { id: 'comunitaria-rio', name: 'Huerta comunitaria del Río', type: 'Comunitaria', locality: 'Juan Pujol, Corrientes', crops: ['Tomate', 'Albahaca', 'Perejil'] },
  { id: 'familiar-sur', name: 'Huerta familiar del Sur', type: 'Familiar', locality: 'Mocoretá, Corrientes', crops: ['Zanahoria', 'Cebolla', 'Espinaca'] },
]

const measurements: Measurement[] = [
  ['e', 'estudio-norte', [31.2, 33.8, 35.1, 34.2, 36.5], [18.2, 20.1, 22.8, 20.4, 21.7]],
  ['c', 'comunitaria-rio', [40.2, 42.1, 41.6, 41.3, 43.1], [19.2, 22, 24.2, 19.9, 22.8]],
  ['f', 'familiar-sur', [27.4, 29.7, 31.2, 29.4, 31.8], [17.7, 20.1, 23.1, 18.7, 20.9]],
].flatMap(([prefix, gardenId, moisture, temperature]) => [0, 1, 2, 3, 4].flatMap((index) => {
  const date = `2026-09-${['02', '10', '17', '23', '29'][index]}T09:00:00-03:00`
  return [
    { id: `${prefix}-h-${index}`, gardenId, variable: 'Humedad del suelo' as const, value: moisture[index] as number, unit: '%', date },
    { id: `${prefix}-t-${index}`, gardenId, variable: 'Temperatura ambiente' as const, value: temperature[index] as number, unit: '°C', date },
  ]
}))

const initialFollowUps: FollowUp[] = gardens.flatMap((garden, index) => [
  { id: `${garden.id}-r1`, gardenId: garden.id, date: '2026-09-23T11:00:00-03:00', observation: index === 0 ? 'Se registró el estado general de los cultivos de ejemplo.' : 'Se documentó una revisión de los canteros de ejemplo.' },
  { id: `${garden.id}-r2`, gardenId: garden.id, date: '2026-09-29T11:00:00-03:00', observation: 'Se agregó una observación de seguimiento para comparar fechas.' },
])

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
const shortDate = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })
const storageKey = 'agronautas-jakaru-demo-v1'

function Chart({ series, unit, title }: { series: { label: string; color: string; measurements: Measurement[] }[]; unit: string; title: string }) {
  const all = series.flatMap((line) => line.measurements)
  if (!all.length) return <div className="jakaru-demo-chart-empty">No hay mediciones para mostrar en este período.</div>
  const values = all.map((item) => item.value)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const spread = high - low || 1
  const min = low - spread * 0.18
  const max = high + spread * 0.18
  const times = all.map((item) => Date.parse(item.date))
  const first = Math.min(...times)
  const last = Math.max(...times)
  const x = (date: string) => first === last ? 380 : 55 + ((Date.parse(date) - first) * 650) / (last - first)
  const y = (value: number) => 182 - ((value - min) * 145) / (max - min)
  const days = [...new Set(all.map((item) => item.date.slice(0, 10)))]
  return <figure className="jakaru-demo-chart"><svg viewBox="0 0 760 230" role="img" aria-label={title}>{[0, 1, 2, 3].map((step) => { const value = max - ((max - min) * step) / 3; return <g key={step}><line x1="55" x2="705" y1={y(value)} y2={y(value)} className="jakaru-demo-chart-grid" /><text x="45" y={y(value) + 4} textAnchor="end" className="jakaru-demo-chart-axis">{numberFormat.format(value)}{unit}</text></g> })}{series.map((line) => { const points = [...line.measurements].sort((a, b) => a.date.localeCompare(b.date)).map((item) => `${x(item.date)},${y(item.value)}`).join(' '); return <polyline key={line.label} fill="none" stroke={line.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} /> })}{days.map((day) => <text key={day} x={x(`${day}T09:00:00-03:00`)} y="214" textAnchor="middle" className="jakaru-demo-chart-axis">{shortDate.format(new Date(`${day}T09:00:00-03:00`))}</text>)}</svg><figcaption>{series.map((line) => <span key={line.label}><i style={{ backgroundColor: line.color }} />{line.label}</span>)}</figcaption></figure>
}

function Modal({ mode, garden, onSave, onClose }: { mode: 'measurement' | 'observation'; garden: Garden; onSave: (value: { variable?: Variable; reading?: number; observation?: string }) => void; onClose: () => void }) {
  const [variable, setVariable] = useState<Variable>('Humedad del suelo')
  const [reading, setReading] = useState('')
  const [observation, setObservation] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === 'measurement') {
      const value = Number(reading)
      if (!Number.isFinite(value) || value < 0 || (variable === 'Humedad del suelo' && value > 100)) return
      onSave({ variable, reading: value })
    } else if (observation.trim().length >= 8) onSave({ observation: observation.trim() })
  }
  return <div className="jakaru-demo-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="jakaru-demo-modal" role="dialog" aria-modal="true" aria-labelledby="jakaru-dialog-title"><div className="jakaru-demo-dialog-heading"><div><span>Huerta seleccionada</span><h2 id="jakaru-dialog-title">{mode === 'measurement' ? 'Añadir lectura de ejemplo' : 'Registrar observación'}</h2><p>{garden.name}</p></div><button type="button" aria-label="Cerrar formulario" onClick={onClose}>×</button></div><form onSubmit={submit}>{mode === 'measurement' ? <label>Variable de ejemplo<select value={variable} onChange={(event) => setVariable(event.target.value as Variable)}><option>Humedad del suelo</option><option>Temperatura ambiente</option></select><small>La lectura se guardará como dato simulado.</small><span>Valor</span><div className="jakaru-demo-input-unit"><input autoFocus type="number" min="0" max={variable === 'Humedad del suelo' ? 100 : undefined} step="0.1" required value={reading} onChange={(event) => setReading(event.target.value)} /><b>{variable === 'Humedad del suelo' ? '%' : '°C'}</b></div></label> : <label>Observación<textarea autoFocus minLength={8} maxLength={240} rows={5} required value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Escribí una nota de seguimiento de ejemplo..." /><small>Entre 8 y 240 caracteres.</small></label>}<div className="jakaru-demo-dialog-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="jakaru-demo-primary" type="submit">{mode === 'measurement' ? 'Guardar lectura' : 'Guardar observación'}</button></div></form></div></div>
}

export default function DemoJakaruPage() {
  const [view, setView] = useState<View>('overview')
  const [selectedId, setSelectedId] = useState(gardens[0].id)
  const [period, setPeriod] = useState<Period>(7)
  const [variable, setVariable] = useState<Variable>('Humedad del suelo')
  const [storedMeasurements, setStoredMeasurements] = useState(measurements)
  const [storedFollowUps, setStoredFollowUps] = useState(initialFollowUps)
  const [storageWarning, setStorageWarning] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState<'measurement' | 'observation' | null>(null)
  const [gardenQuery, setGardenQuery] = useState('')
  const [gardenFilter, setGardenFilter] = useState<'Todas' | GardenType>('Todas')
  const [firstId, setFirstId] = useState(gardens[0].id)
  const [secondId, setSecondId] = useState(gardens[1].id)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) { const parsed = JSON.parse(saved) as { measurements?: Measurement[]; followUps?: FollowUp[] }; if (Array.isArray(parsed.measurements) && Array.isArray(parsed.followUps)) { setStoredMeasurements(parsed.measurements); setStoredFollowUps(parsed.followUps) } }
    } catch { setStorageWarning('No se pudieron leer los cambios guardados. La demo cargó sus datos iniciales.') }
  }, [])
  useEffect(() => { try { window.localStorage.setItem(storageKey, JSON.stringify({ measurements: storedMeasurements, followUps: storedFollowUps })) } catch { setStorageWarning('No se pudieron guardar los cambios de esta sesión.') } }, [storedMeasurements, storedFollowUps])

  const garden = gardens.find((item) => item.id === selectedId) ?? gardens[0]
  const anchor = Math.max(Date.parse('2026-09-29T23:59:00-03:00'), ...storedMeasurements.map((item) => Date.parse(item.date)), ...storedFollowUps.map((item) => Date.parse(item.date)))
  const inPeriod = <T extends { date: string }>(items: T[]) => items.filter((item) => Date.parse(item.date) >= anchor - (period - 1) * 86400000 && Date.parse(item.date) <= anchor)
  const visibleMeasurements = inPeriod(storedMeasurements)
  const selectedMeasurements = visibleMeasurements.filter((item) => item.gardenId === garden.id)
  const selectedFollowUps = inPeriod(storedFollowUps).filter((item) => item.gardenId === garden.id)
  const filteredGardens = gardens.filter((item) => (gardenFilter === 'Todas' || item.type === gardenFilter) && `${item.name} ${item.locality} ${item.crops.join(' ')}`.toLocaleLowerCase('es-AR').includes(gardenQuery.toLocaleLowerCase('es-AR')))
  const viewInfo = { overview: ['Resumen', 'Una lectura general de la huerta seleccionada.'], gardens: ['Huertas', 'Buscá y consultá los espacios de ejemplo.'], study: ['Estudio', 'Compará registros del mismo período y variable.'] }[view]

  function save(value: { variable?: Variable; reading?: number; observation?: string }) {
    if (value.variable && value.reading !== undefined) setStoredMeasurements((current) => [...current, { id: `sample-${Date.now()}`, gardenId: garden.id, variable: value.variable, value: value.reading, unit: value.variable === 'Humedad del suelo' ? '%' : '°C', date: new Date().toISOString() }])
    if (value.observation) setStoredFollowUps((current) => [...current, { id: `note-${Date.now()}`, gardenId: garden.id, date: new Date().toISOString(), observation: value.observation! }])
    setNotice(value.reading !== undefined ? 'Lectura simulada guardada.' : 'Observación agregada al seguimiento.')
    setModal(null)
  }
  function reset() { if (!window.confirm('¿Restablecer la demo? Se eliminarán las modificaciones de esta sesión.')) return; setStoredMeasurements(measurements); setStoredFollowUps(initialFollowUps); setNotice('La demo volvió a sus datos iniciales.') }

  return <div className="jakaru-demo-shell"><aside className="jakaru-demo-sidebar"><Link className="jakaru-demo-brand" href="/jakaru">Agronautas<span>JAKARU PORÁ</span></Link><div className="jakaru-demo-caption">ESPACIO DE DEMOSTRACIÓN</div><nav className="jakaru-demo-nav" aria-label="Secciones de la demo">{([['overview', 'Resumen', 'overview'], ['gardens', 'Huertas', 'overview'], ['study', 'Estudio', 'study']] as const).map(([id, label, icon]) => <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon name={icon} /><span>{label}</span>{view === id && <i />}</button>)}</nav><div className="jakaru-demo-sidebar-bottom"><div className="jakaru-demo-sim"><span />Demostración con<br />datos simulados</div><button type="button" onClick={reset}><Icon name="history" />Restablecer demo</button><Link href="/jakaru">← Volver a Jakaru Porá</Link></div></aside><main className="jakaru-demo-main"><header className="jakaru-demo-header"><div><p>AGRONAUTAS <span>/</span> JAKARU PORÁ</p><h1>{viewInfo[0]}</h1><small>{viewInfo[1]}</small></div><label><span>HUERTA ACTIVA</span><select value={garden.id} onChange={(event) => setSelectedId(event.target.value)}>{gardens.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><em>{garden.locality}</em></label></header>{storageWarning && <div className="jakaru-demo-warning">{storageWarning}</div>}<div className="jakaru-demo-toolbar"><div className="jakaru-demo-period"><span>Período</span>{[7, 30].map((days) => <button key={days} className={period === days ? 'active' : ''} type="button" onClick={() => setPeriod(days as Period)}>{days} días</button>)}<small>Hasta {shortDate.format(new Date(anchor))}</small></div><div className="jakaru-demo-actions"><button type="button" onClick={() => setModal('observation')}>+ Registrar observación</button><button className="jakaru-demo-primary" type="button" onClick={() => setModal('measurement')}>+ Añadir lectura de ejemplo</button></div></div>{notice && <div className="jakaru-demo-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}<div className="jakaru-demo-mobile-note"><span />Demostración con datos simulados</div>{view === 'overview' && <Overview garden={garden} measurements={selectedMeasurements} followUps={selectedFollowUps} period={period} variable={variable} setVariable={setVariable} setView={setView} />}{view === 'gardens' && <Gardens filteredGardens={filteredGardens} garden={garden} selectedId={garden.id} query={gardenQuery} setQuery={setGardenQuery} filter={gardenFilter} setFilter={setGardenFilter} onSelect={setSelectedId} measurements={selectedMeasurements} followUps={selectedFollowUps} period={period} />}{view === 'study' && <Study gardens={gardens} measurements={visibleMeasurements} period={period} firstId={firstId} secondId={secondId} setFirstId={setFirstId} setSecondId={setSecondId} variable={variable} setVariable={setVariable} />}</main>{modal && <Modal mode={modal} garden={garden} onSave={save} onClose={() => setModal(null)} />}</div>
}

function Overview({ garden, measurements, followUps, period, variable, setVariable, setView }: { garden: Garden; measurements: Measurement[]; followUps: FollowUp[]; period: Period; variable: Variable; setVariable: (value: Variable) => void; setView: (value: View) => void }) {
  const latest = (value: Variable) => [...measurements].filter((item) => item.variable === value).sort((a, b) => b.date.localeCompare(a.date))[0]
  const graph = measurements.filter((item) => item.variable === variable)
  return <section className="jakaru-demo-view"><div className="jakaru-demo-welcome"><div><span>HUERTA SELECCIONADA · {garden.type.toUpperCase()}</span><h2>{garden.name}</h2><p>{garden.locality} · {garden.crops.join(', ')}</p></div><button type="button" onClick={() => setView('gardens')}>Ver ficha de la huerta →</button></div><div className="jakaru-demo-stat-grid"><Stat title={`Lecturas en ${period} días`} value={String(measurements.length)} note="Registros de esta huerta" emphasis /><Stat title="Humedad del suelo" value={latest('Humedad del suelo') ? `${numberFormat.format(latest('Humedad del suelo')!.value)} %` : '—'} note="Última lectura" /><Stat title="Temperatura ambiente" value={latest('Temperatura ambiente') ? `${numberFormat.format(latest('Temperatura ambiente')!.value)} °C` : '—'} note="Última lectura" /><Stat title="Registros de seguimiento" value={String(followUps.length)} note={`Notas en ${period} días`} /></div><div className="jakaru-demo-two-col"><section className="jakaru-demo-card"><div className="jakaru-demo-card-heading"><div><span>EVOLUCIÓN · {period} DÍAS</span><h3>Mediciones de la huerta</h3></div><label>Variable<select value={variable} onChange={(event) => setVariable(event.target.value as Variable)}><option>Humedad del suelo</option><option>Temperatura ambiente</option></select></label></div><Chart title={`${variable} en ${garden.name}`} unit={graph[0]?.unit ?? '%'} series={[{ label: garden.name, color: '#287a70', measurements: graph }]} /></section><section className="jakaru-demo-card"><div className="jakaru-demo-card-heading"><div><span>ÚLTIMAS CARGAS</span><h3>Lecturas recientes</h3></div></div><ul className="jakaru-demo-reading-list">{[...measurements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((item) => <li key={item.id}><b>{item.variable}</b><small>{dateFormat.format(new Date(item.date))}</small><strong>{numberFormat.format(item.value)} {item.unit}</strong></li>)}</ul></section></div><section className="jakaru-demo-card"><div className="jakaru-demo-card-heading"><div><span>BITÁCORA</span><h3>Últimos registros de seguimiento</h3></div></div><div className="jakaru-demo-follow-grid">{followUps.slice(0, 3).map((item) => <article key={item.id}><time>{dateFormat.format(new Date(item.date))}</time><p>{item.observation}</p></article>)}</div></section><small className="jakaru-demo-footnote">● Datos ficticios de interfaz · {gardens.length} huertas de ejemplo</small></section>
}

function Stat({ title, value, note, emphasis = false }: { title: string; value: string; note: string; emphasis?: boolean }) { return <article className={`jakaru-demo-stat ${emphasis ? 'emphasis' : ''}`}><span>{title}</span><strong>{value}</strong><small>{note}</small></article> }

function Gardens({ filteredGardens, garden, selectedId, query, setQuery, filter, setFilter, onSelect, measurements, followUps, period }: { filteredGardens: Garden[]; garden: Garden; selectedId: string; query: string; setQuery: (value: string) => void; filter: 'Todas' | GardenType; setFilter: (value: 'Todas' | GardenType) => void; onSelect: (id: string) => void; measurements: Measurement[]; followUps: FollowUp[]; period: Period }) { return <section className="jakaru-demo-view"><div className="jakaru-demo-directory-toolbar"><input aria-label="Buscar huertas" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, localidad o cultivo" /><select aria-label="Tipo de huerta" value={filter} onChange={(event) => setFilter(event.target.value as 'Todas' | GardenType)}><option>Todas</option><option>De estudio</option><option>Comunitaria</option><option>Familiar</option></select></div><div className="jakaru-demo-garden-layout"><div className="jakaru-demo-garden-results"><div className="jakaru-demo-results-caption">{filteredGardens.length} huertas <small>Escenarios ilustrativos</small></div>{filteredGardens.map((item) => <button type="button" className={item.id === selectedId ? 'active' : ''} key={item.id} onClick={() => onSelect(item.id)}><span>{item.type}</span><b>{item.name}</b><small>{item.locality}</small><em>{item.crops.join(' · ')}</em></button>)}</div><div className="jakaru-demo-garden-inspector"><section className="jakaru-demo-card jakaru-demo-profile"><span>FICHA DE EJEMPLO · {garden.type}</span><h2>{garden.name}</h2><p>{garden.locality}</p><div>{garden.crops.map((crop) => <i key={crop}>{crop}</i>)}</div></section><section className="jakaru-demo-card"><div className="jakaru-demo-card-heading"><div><span>HISTORIAL</span><h3>Mediciones y notas</h3></div></div><table className="jakaru-demo-table"><thead><tr><th>Fecha</th><th>Variable</th><th>Valor</th></tr></thead><tbody>{measurements.map((item) => <tr key={item.id}><td>{dateFormat.format(new Date(item.date))}</td><td>{item.variable}</td><td>{numberFormat.format(item.value)} {item.unit}</td></tr>)}</tbody></table><div className="jakaru-demo-notes"><b>Seguimiento · {followUps.length} notas</b>{followUps.map((item) => <p key={item.id}>{dateFormat.format(new Date(item.date))} · {item.observation}</p>)}</div></section></div></div><small className="jakaru-demo-footnote">Datos ficticios · Consulta limitada a {period} días</small></section> }

function Study({ gardens, measurements, period, firstId, secondId, setFirstId, setSecondId, variable, setVariable }: { gardens: Garden[]; measurements: Measurement[]; period: Period; firstId: string; secondId: string; setFirstId: (value: string) => void; setSecondId: (value: string) => void; variable: Variable; setVariable: (value: Variable) => void }) { const first = gardens.find((item) => item.id === firstId); const second = gardens.find((item) => item.id === secondId); const firstRecords = measurements.filter((item) => item.gardenId === firstId && item.variable === variable); const secondRecords = measurements.filter((item) => item.gardenId === secondId && item.variable === variable); return <section className="jakaru-demo-view"><div className="jakaru-demo-study-intro"><div><span>COMPARACIÓN ILUSTRATIVA</span><h2>Observar registros en contexto</h2><p>Elegí dos huertas y una variable para comparar mediciones del mismo período.</p></div><div>Las diferencias describen estos datos de ejemplo. No señalan causas ni recomendaciones agronómicas.</div></div><div className="jakaru-demo-card jakaru-demo-comparison-controls"><label>Huerta A<select value={firstId} onChange={(event) => setFirstId(event.target.value)}>{gardens.map((item) => <option disabled={item.id === secondId} key={item.id} value={item.id}>{item.name}</option>)}</select></label><b>VS</b><label>Huerta B<select value={secondId} onChange={(event) => setSecondId(event.target.value)}>{gardens.map((item) => <option disabled={item.id === firstId} key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Variable<select value={variable} onChange={(event) => setVariable(event.target.value as Variable)}><option>Humedad del suelo</option><option>Temperatura ambiente</option></select></label></div><section className="jakaru-demo-card"><div className="jakaru-demo-card-heading"><div><span>EVOLUCIÓN · ÚLTIMOS {period} DÍAS</span><h3>{variable}</h3></div></div><Chart title={`Comparación de ${variable}`} unit={firstRecords[0]?.unit ?? '%'} series={[{ label: first?.name ?? 'Huerta A', color: '#225e89', measurements: firstRecords }, { label: second?.name ?? 'Huerta B', color: '#609a2a', measurements: secondRecords }]} /></section></section> }
