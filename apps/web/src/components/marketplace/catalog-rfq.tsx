'use client'

import { createElement, useState } from 'react'
import type {
  AgronautasMarketplaceDiscoveryResponse,
  AgronautasMarketplaceListing,
  AgronautasMarketplaceRfq,
  AgronautasMarketplaceRfqResponse,
} from '@/lib/agronautas/schemas'
import { MarketplaceCatalog } from './catalog'
import { MessageCircle, ClipboardList, Check, Sprout } from 'lucide-react'
import { MarketplaceRfqForm } from './rfq-form'
import { MarketplaceRfqHistory } from './rfq-history'
import { MarketplaceProductDetail, MarketplacePricePreview } from './product-detail'

const React = { createElement }

interface MarketplaceCatalogRfqProps {
  publicPreview?: boolean
  workspaceId?: string
  listings: AgronautasMarketplaceDiscoveryResponse
  rfqs: AgronautasMarketplaceRfqResponse
  isLoading: boolean
  error: string | null
  historyError?: string | null
  historyLoading?: boolean
  onHistoryRetry?: () => Promise<unknown>
  accessState?: 'unauthorized' | 'forbidden' | 'maintenance'
  accessReason?: string
  onRetry: () => Promise<unknown>
  onSubmit: (input: {
    workspaceId?: string
    listingId?: string | null
    itemName: string
    quantity: number
    unit: string
    locality: string
    idempotencyKey: string
    participantRefs: string[]
  }) => Promise<AgronautasMarketplaceRfqResponse | void>
  onCancel?: (rfq: AgronautasMarketplaceRfq) => Promise<AgronautasMarketplaceRfqResponse | void>
}

export function MarketplaceCatalogRfq({
  publicPreview = false,
  workspaceId,
  listings,
  rfqs,
  isLoading,
  error,
  historyError,
  historyLoading,
  onHistoryRetry,
  accessState,
  accessReason,
  onRetry,
  onSubmit,
  onCancel,
}: MarketplaceCatalogRfqProps) {
  const resolvedWorkspaceId =
    workspaceId ?? listings.items[0]?.workspaceId ?? rfqs.items[0]?.workspaceId ?? ''
  const [selectedListing, setSelectedListing] = useState<AgronautasMarketplaceListing | null>(null)
  const [isMutating, setIsMutating] = useState(false);
  const [currentTab, setCurrentTab] = useState<'explorar' | 'mis_publicaciones' | 'mis_consultas'>('explorar');

  const submit = async (
    input: Parameters<typeof onSubmit>[0]
  ): Promise<AgronautasMarketplaceRfqResponse | void> => {
    setIsMutating(true)
    try {
      return await onSubmit({ ...input, workspaceId: resolvedWorkspaceId })
    } finally {
      setIsMutating(false)
    }
  }

  const cancel = async (
    rfq: AgronautasMarketplaceRfq
  ): Promise<AgronautasMarketplaceRfqResponse | void> => {
    if (!onCancel) return undefined
    setIsMutating(true)
    try {
      return await onCancel(rfq)
    } finally {
      setIsMutating(false)
    }
  }

  const available =
    !publicPreview &&
    !accessState &&
    !isLoading &&
    !error &&
    listings.status !== 'unavailable' &&
    listings.status !== 'degraded'
  const scoped = listings.items.filter((item) => item.workspaceId === resolvedWorkspaceId)
  const activeListing = available
    ? (scoped.find((item) => item.listingId === selectedListing?.listingId) ?? scoped[0])
    : undefined
  const showExample = publicPreview || accessState === 'unauthorized' || (available && scoped.length === 0)
  return (
    
    <div className="mkt-wrapper" style={{ padding: "0 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ padding: '0 0 20px', borderBottom: '1px solid #e7e5e4', marginBottom: '24px', display: 'flex', gap: '24px' }}>
        <button onClick={() => setCurrentTab('explorar')} style={{ paddingBottom: '8px', borderBottom: currentTab === 'explorar' ? '2px solid #059669' : '2px solid transparent', color: currentTab === 'explorar' ? '#064e3b' : '#78716c', fontWeight: 600 }}>🏪 Explorar</button>
        <button onClick={() => setCurrentTab('mis_publicaciones')} style={{ paddingBottom: '8px', borderBottom: currentTab === 'mis_publicaciones' ? '2px solid #059669' : '2px solid transparent', color: currentTab === 'mis_publicaciones' ? '#064e3b' : '#78716c', fontWeight: 600 }}>📦 Mis Publicaciones</button>
        <button onClick={() => setCurrentTab('mis_consultas')} style={{ paddingBottom: '8px', borderBottom: currentTab === 'mis_consultas' ? '2px solid #059669' : '2px solid transparent', color: currentTab === 'mis_consultas' ? '#064e3b' : '#78716c', fontWeight: 600 }}>💬 Mis Consultas</button>
      </div>
      <div className="mkt-layout" style={{ display: currentTab === 'explorar' ? 'grid' : 'none' }}>

      <div className="mkt-main-column">
        {activeListing || showExample ? (
          <MarketplaceProductDetail listing={activeListing} />
        ) : null}
        {!showExample && (
          <MarketplaceCatalog
            workspaceId={resolvedWorkspaceId}
            response={error ? { ...listings, status: 'unavailable' } : listings}
            isLoading={isLoading}
            accessState={accessState}
            accessReason={accessReason}
            selectedId={activeListing?.listingId}
            onRetry={() => void onRetry()}
            onSelectListing={(item) => {
              setSelectedListing(item)
              document
                .getElementById('marketplace-product')
                ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
            }}
          />
        )}
        
      </div>
      <aside className="mkt-sidebar" aria-label="Consulta y ayuda">
        {activeListing ? (
          <MarketplaceRfqForm
            key={activeListing.listingId}
            workspaceId={resolvedWorkspaceId}
            listing={activeListing}
            isSubmitting={isMutating}
            onSubmit={submit}
          />
        ) : showExample ? (
          <MarketplacePricePreview requiresLogin={publicPreview || accessState === 'unauthorized'} />
        ) : (
          <section className="mkt-panel">
            <MessageCircle size={28} aria-hidden="true" />
            <h2>Consultá antes de comprar</h2>
            <p>Elegí una publicación para pedir precio, cantidad y entrega.</p>
            <div className="mkt-hint">
              La consulta es el primer paso. Las condiciones se acuerdan después.
            </div>
          </section>
        )}
        <section className="mkt-panel mkt-how">
          <h2>Así de sencillo</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Elegí un producto</strong>
                <p>Mirá los detalles de la publicación.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Contanos qué necesitás</strong>
                <p>Indicá cantidad y localidad de entrega.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Seguí tu consulta</strong>
                <p>Revisá su estado en Mis consultas.</p>
              </div>
            </li>
          </ol>
        </section>
        <section className="mkt-panel mkt-reassurance">
          <Check size={22} aria-hidden="true" />
          <div>
            <strong>Vos decidís cómo seguir</strong>
            <p>Enviar una consulta no confirma una compra ni genera un pago.</p>
          </div>
        </section>
        
      </aside>

      </div>
      {currentTab === 'mis_publicaciones' && (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0c2319', marginBottom: '24px' }}>Panel de Ventas</h2>
          {scoped.filter(item => item.participantRef === 'yo').length === 0 ? (
            <p style={{ color: '#78716c' }}>Todavia no publicaste nada. Usa el boton "Nueva Publicacion" para empezar a vender!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {scoped.filter(item => item.participantRef === 'yo').map(item => {
                const priceMatch = item.title.match(/USD \d+(?:\.\d+)?|\$\d+(?:\.\d+)?/i);
                const priceStr = priceMatch ? priceMatch[0] : 'Precio a consultar';
                return (
                <div key={item.listingId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e7e5e4', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '6px', backgroundColor: '#f5f5f4', backgroundImage: (item as any).__frontendImages ? `url(${(item as any).__frontendImages[0]})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!(item as any).__frontendImages && <Sprout size={24} color="#a8a29e" />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#0c2319' }}>{item.itemName}</h3>
                      <p style={{ margin: 0, color: '#78716c', fontSize: '0.875rem' }}>{priceStr} - {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#059669', fontWeight: 600 }}>Activa</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#78716c' }}>3 consultas recibidas</p>
                    </div>
                    <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e7e5e4', background: '#fff', fontWeight: 500, cursor: 'pointer' }}>Pausar</button>
                    <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Marcar Vendido</button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}
      {currentTab === 'mis_consultas' && (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0c2319', marginBottom: '24px' }}>Mis Consultas</h2>
          <MarketplaceRfqHistory
            workspaceId={resolvedWorkspaceId}
            response={rfqs}
            isLoading={historyLoading ?? isLoading}
            isMutating={isMutating}
            error={historyError}
            onRetry={() => void (onHistoryRetry ?? onRetry)()}
            onCancel={cancel}
          />
        </div>
      )}
    </div>

  )
}
