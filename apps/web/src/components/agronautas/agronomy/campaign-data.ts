export type CampaignStatus = 'Planificada' | 'En curso' | 'Finalizada' | 'Pausada'
export type StageStatus = 'Completado' | 'Actual' | 'Pendiente'
export interface CampaignActivity {
  id: string
  title: string
  date: string
  responsible: string
  status: 'Programada' | 'Por confirmar'
}
export interface CampaignCost {
  category: string
  budget: number
  executed: number
}
export interface Campaign {
  id: string
  name: string
  cycle: string
  field: { id: string; name: string }
  lot: { id: string; name: string }
  crop: string
  variety: string
  area: number
  sowingDate: string
  harvestDate: string
  targetYield: number
  status: CampaignStatus
  progress: number
  asOf: string
  stages: { name: string; status: StageStatus }[]
  activities: CampaignActivity[]
  costs: CampaignCost[]
  productionLotId: string | null
}

const stageNames = [
  'Preparación del suelo',
  'Siembra',
  'Fertilización',
  'Monitoreo',
  'Aplicación',
  'Cosecha',
]
const stages = (current: number): Campaign['stages'] =>
  stageNames.map((name, index) => ({
    name,
    status: index < current ? 'Completado' : index === current ? 'Actual' : 'Pendiente',
  }))
const costs = (area: number, used: number): CampaignCost[] =>
  [
    ['Semillas', 160],
    ['Fertilizantes', 130],
    ['Fitosanitarios', 95],
    ['Combustible', 55],
    ['Maquinaria', 75],
    ['Personal', 45],
    ['Contratistas', 90],
  ].map(([category, perHa]) => ({
    category: String(category),
    budget: Number(perHa) * area,
    executed: Math.round(Number(perHa) * area * used),
  }))

export const campaignStatuses: CampaignStatus[] = [
  'Planificada',
  'En curso',
  'Finalizada',
  'Pausada',
]
export const campaigns: Campaign[] = [
  {
    id: 'soja-norte-2026',
    name: 'Soja 2026/27',
    cycle: '2026/27',
    field: { id: 'esperanza', name: 'La Esperanza' },
    lot: { id: 'norte', name: 'Norte' },
    crop: 'Soja',
    variety: 'DM 46R18',
    area: 185,
    sowingDate: '2026-11-15',
    harvestDate: '2027-04-20',
    targetYield: 3200,
    status: 'En curso',
    progress: 32,
    asOf: '2026-12-01',
    stages: stages(3),
    activities: [
      {
        id: 'soja-monitoreo',
        title: 'Monitoreo de malezas',
        date: '2026-12-03',
        responsible: 'Juan Pérez',
        status: 'Programada',
      },
      {
        id: 'soja-aplicacion',
        title: 'Aplicación programada',
        date: '2026-12-06',
        responsible: 'Lucía Gómez',
        status: 'Por confirmar',
      },
      {
        id: 'soja-muestreo',
        title: 'Muestreo de suelo',
        date: '2026-12-12',
        responsible: 'Martín López',
        status: 'Programada',
      },
    ],
    costs: costs(185, 0.38),
    productionLotId: null,
  },
  {
    id: 'maiz-sur-2026',
    name: 'Maíz temprano 2026/27',
    cycle: '2026/27',
    field: { id: 'esperanza', name: 'La Esperanza' },
    lot: { id: 'sur', name: 'Sur' },
    crop: 'Maíz',
    variety: 'DK 72-10',
    area: 120,
    sowingDate: '2026-09-10',
    harvestDate: '2027-03-15',
    targetYield: 8500,
    status: 'En curso',
    progress: 48,
    asOf: '2026-12-01',
    stages: stages(4),
    activities: [
      {
        id: 'maiz-aplicacion',
        title: 'Aplicación foliar',
        date: '2026-12-05',
        responsible: 'Lucía Gómez',
        status: 'Programada',
      },
    ],
    costs: costs(120, 0.52),
    productionLotId: null,
  },
  {
    id: 'arroz-este-2026',
    name: 'Arroz 2026/27',
    cycle: '2026/27',
    field: { id: 'san-miguel', name: 'San Miguel' },
    lot: { id: 'este', name: 'Este' },
    crop: 'Arroz',
    variety: 'IRGA 424',
    area: 96,
    sowingDate: '2026-12-10',
    harvestDate: '2027-04-25',
    targetYield: 7800,
    status: 'Planificada',
    progress: 0,
    asOf: '2026-12-01',
    stages: stages(-1),
    activities: [
      {
        id: 'arroz-preparacion',
        title: 'Nivelación del terreno',
        date: '2026-12-04',
        responsible: 'Martín López',
        status: 'Programada',
      },
    ],
    costs: costs(96, 0),
    productionLotId: null,
  },
  {
    id: 'soja-oeste-2026',
    name: 'Soja de segunda 2026/27',
    cycle: '2026/27',
    field: { id: 'san-miguel', name: 'San Miguel' },
    lot: { id: 'oeste', name: 'Oeste' },
    crop: 'Soja',
    variety: 'NS 5258',
    area: 72,
    sowingDate: '2026-12-20',
    harvestDate: '2027-05-10',
    targetYield: 2800,
    status: 'Pausada',
    progress: 12,
    asOf: '2026-12-01',
    stages: stages(1),
    activities: [
      {
        id: 'soja-revision',
        title: 'Revisar humedad para retomar siembra',
        date: '2026-12-08',
        responsible: 'Juan Pérez',
        status: 'Por confirmar',
      },
    ],
    costs: costs(72, 0.15),
    productionLotId: null,
  },
  {
    id: 'trigo-norte-2025',
    name: 'Trigo 2025/26',
    cycle: '2025/26',
    field: { id: 'esperanza', name: 'La Esperanza' },
    lot: { id: 'norte', name: 'Norte' },
    crop: 'Trigo',
    variety: 'Baguette 620',
    area: 185,
    sowingDate: '2025-06-15',
    harvestDate: '2025-11-25',
    targetYield: 4200,
    status: 'Finalizada',
    progress: 100,
    asOf: '2026-12-01',
    stages: stages(6),
    activities: [],
    costs: costs(185, 0.94),
    productionLotId: null,
  },
]

export function campaignTotals(campaign: Campaign) {
  const budget = campaign.costs.reduce((sum, cost) => sum + cost.budget, 0)
  const executed = campaign.costs.reduce((sum, cost) => sum + cost.executed, 0)
  return {
    budget,
    executed,
    balance: budget - executed,
    used: budget ? Math.round((executed / budget) * 100) : 0,
  }
}

export interface CampaignFilters {
  search: string
  cycle: string
  crop: string
  field: string
  status: string
}
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
export function filterCampaigns(items: Campaign[], filters: CampaignFilters) {
  return items.filter(
    (item) =>
      normalize(
        [item.name, item.field.name, item.lot.name, item.crop, item.variety].join(' ')
      ).includes(normalize(filters.search)) &&
      (!filters.cycle || item.cycle === filters.cycle) &&
      (!filters.crop || item.crop === filters.crop) &&
      (!filters.field || item.field.id === filters.field) &&
      (!filters.status || item.status === filters.status)
  )
}
