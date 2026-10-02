'use client'
import { createElement, Fragment, useState } from 'react'
import { Search, Sprout, ArrowRight, MapPin } from 'lucide-react'
import type {
  AgronautasMarketplaceDiscoveryResponse,
  AgronautasMarketplaceListing,
} from '@/lib/agronautas/schemas'
import type { SourceMode } from '@/components/ui/evidence'
import { MarketplaceNotice } from './notice'
const React = { createElement, Fragment }
export interface MarketplaceCatalogProps {
  workspaceId: string
  response: AgronautasMarketplaceDiscoveryResponse
  isLoading?: boolean
  mode?: SourceMode
  accessState?: 'unauthorized' | 'forbidden' | 'maintenance'
  accessReason?: string
  onRetry?: () => void
  onSelectListing: (listing: AgronautasMarketplaceListing) => void
  selectedId?: string
}
export function MarketplaceCatalog({
  workspaceId,
  response,
  isLoading,
  accessState,
  onRetry,
  onSelectListing,
  selectedId,
}: MarketplaceCatalogProps) {
  const [search, setSearch] = useState('')
  const [marketId, setMarketId] = useState('all');
  const [locationId, setLocationId] = useState('all');
  if (accessState)
    return (
      <MarketplaceNotice
        title={
          accessState === 'unauthorized'
            ? 'Entrá para ver las publicaciones'
            : accessState === 'forbidden'
              ? 'Tu cuenta no tiene acceso'
              : 'No podemos verificar tu cuenta'
        }
        error={accessState !== 'unauthorized'}
        onRetry={accessState === 'maintenance' ? onRetry : undefined}
      >
        {accessState === 'unauthorized' ? (
          <>
            Usá tu correo y contraseña para consultar y enviar solicitudes.
            <a className="mkt-button" href="/login?next=marketplace">
              Iniciar sesión
            </a>
          </>
        ) : accessState === 'forbidden' ? (
          'Pedile acceso al administrador de tu cuenta.'
        ) : (
          <>
            <p>No pudimos comprobar tu sesión. Podés abrir el login o volver a intentar.</p>
            <a className="mkt-button" href="/login?next=marketplace">
              Iniciar sesión
            </a>
          </>
        )}
      </MarketplaceNotice>
    )
  if (isLoading)
    return (
      <MarketplaceNotice title="Buscando publicaciones…">
        Esperá un momento mientras cargamos el catálogo.
      </MarketplaceNotice>
    )
  if (response.status === 'unavailable' || response.status === 'degraded')
    return (
      <MarketplaceNotice error title="No pudimos cargar las publicaciones" onRetry={onRetry}>
        Hubo un problema al consultar el catálogo. Volvé a intentar en unos minutos.
      </MarketplaceNotice>
    )
  const scoped = response.items.filter((item) => item.workspaceId === workspaceId)
  if (!scoped.length)
    return (
      <div className="mkt-empty-catalog">
        <div className="mkt-empty-art" aria-hidden="true">
          <Sprout size={76} strokeWidth={1} />
          <span>Un lugar para encontrarnos</span>
        </div>
        <MarketplaceNotice title="Todavía no hay publicaciones">
          Cuando se carguen productos en tu cuenta, los vas a encontrar acá. Podrás ver los detalles
          y pedir una cotización.
        </MarketplaceNotice>
      </div>
    )
  const markets = [...new Set(scoped.map((item) => item.marketId))]
  const locations = [...new Set(scoped.map((item: any) => {
    const detail = item.__frontendDetails?.find((d: any) => d[0] === 'Ubicación' || d[0] === 'Ubicacin');
    return detail ? detail[1] : '';
  }).filter(Boolean))]
  const visible = scoped.filter(
    (item: any) => {
      const itemLoc = item.__frontendDetails?.find((d: any) => d[0] === 'Ubicación' || d[0] === 'Ubicacin')?.[1] || '';
      return (marketId === 'all' || item.marketId === marketId) &&
             (locationId === 'all' || itemLoc === locationId) &&
             `${item.title} ${item.itemName}`.toLowerCase().includes(search.trim().toLowerCase());
    }
  )
  return (
    <section
      className="mkt-catalog"
      aria-label="Publicaciones disponibles"
      data-testid="marketplace-catalog"
    >
      <div className="mkt-section-heading">
        <h2>Publicaciones disponibles</h2>
        <span>
          {scoped.length} {scoped.length === 1 ? 'publicación' : 'publicaciones'}
        </span>
      </div>
      <div className="mkt-filters">
        <label>
          <span>¿Qué estás buscando?</span>
          <div className="mkt-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Buscar publicaciones"
              placeholder="Por ejemplo: arroz, terneros…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onInput={(event) => setSearch(event.currentTarget.value)}
            />
          </div>
        </label>
        <label>
          <span>Zona o mercado</span>
          <select
            aria-label="Filtrar por mercado"
            value={marketId}
            onChange={(event) => setMarketId(event.target.value)}
          >
            <option value="all">Todos los mercados</option>
            {markets.map((market) => (
              <option key={market} value={market}>
                {marketName(market)}
              </option>
            ))}
          </select>
        </label>
          <label>
            <span>Ubicación</span>
            <select
              aria-label="Filtrar por ubicación"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="all">Todas las zonas</option>
              {locations.map((loc: any) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </label>
      </div>
      {response.staleListingCount > 0 ? (
        <p className="mkt-muted">Las publicaciones vencidas ya no aparecen en este listado.</p>
      ) : null}
      {!visible.length ? (
        <MarketplaceNotice title="No encontramos coincidencias">
          Probá con otro nombre o eleg? otro mercado.
        </MarketplaceNotice>
      ) : (
        <div className="mkt-cards">
          {visible.map((item) => (
            <button
              type="button"
              key={item.listingId}
              className={`mkt-card ${selectedId === item.listingId ? 'mkt-card-selected' : ''}`}
              onClick={() => onSelectListing(item)}
              aria-pressed={selectedId === item.listingId}
              aria-label={`Ver publicación: ${item.title}`}
            >
              {(item as any).__frontendImages && (item as any).__frontendImages.length > 0 ? (
                  <div className="mkt-card-image" style={{ backgroundImage: `url(${(item as any).__frontendImages[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '180px', borderRadius: '12px 12px 0 0', flexShrink: 0 }} />
                ) : (
                  <div className="mkt-card-image">
                    <Sprout size={48} strokeWidth={1} aria-hidden="true" />
                  </div>
                )}
              <div className="mkt-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#0c2319', margin: 0, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
                  <strong style={{ fontSize: '0.9rem', color: '#44403c', fontWeight: 500 }}>
                    {item.quantity === null
                      ? 'Cantidad a consultar'
                      : item.quantity.toLocaleString('es-AR') + ' ' + (item.unit ?? '')}
                  </strong>
                  {(() => {
                    const loc = (item as any).__frontendDetails?.find((d: any) => d[0] === 'Ubicación')?.[1];
                    return loc ? (
                      <span style={{ fontSize: '0.8rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {loc}
                      </span>
                    ) : null;
                  })()}
                <p>
                  <MapPin size={14} aria-hidden="true" />
                  {marketName(item.marketId)}
                </p>
                <span className="mkt-card-link">
                  Ver detalles y consultar <ArrowRight size={15} aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
export function marketName(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}
export function marketDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
