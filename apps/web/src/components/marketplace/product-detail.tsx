'use client'

import { createElement, useState } from 'react'
import { MapPin, Sprout, Scale, Truck, CalendarDays, ShieldCheck } from 'lucide-react'
import type { AgronautasMarketplaceListing } from '@/lib/agronautas/schemas'
import { marketName, marketDate } from './catalog'

const React = { createElement }
const money = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function MarketplaceProductDetail({ listing }: { listing?: AgronautasMarketplaceListing }) {
  const demo = !listing;
  const priceMatch = listing?.title?.match(/USD \d+(?:\.\d+)?(?:\/\w+)?|\$\d+(?:\.\d+)?(?:\/\w+)?/i);
  const priceStr = priceMatch ? priceMatch[0] : 'A consultar';

  const [calcMethod, setCalcMethod] = useState('canje');
  const [calcResult, setCalcResult] = useState<{ total: number, message: string } | null>(null);

  const handleCalculate = () => {
    if (priceStr === 'A consultar') return;
    const basePrice = parseFloat(priceStr.replace(/[^\d.]/g, ''));
    if (isNaN(basePrice)) return;

    if (calcMethod === 'canje') {
      setCalcResult({ total: basePrice * 0.95, message: 'Incluye 5% de descuento por pago con granos.' });
    } else if (calcMethod === 'cheque') {
      setCalcResult({ total: basePrice * 1.10, message: 'Incluye 10% de recargo por financiación a 90 días.' });
    } else if (calcMethod === 'galicia') {
      setCalcResult({ total: basePrice * 1.20, message: 'Incluye 20% de interés anual por pago con Galicia Rural.' });
    } else if (calcMethod === 'agronacion') {
      setCalcResult({ total: basePrice * 1.20, message: 'Incluye 20% de interés anual por pago con Agronación.' });
    }
  };

  const title = (listing?.title ?? '70 vaquillonas para madre').replace(/ - (USD|\$)\s*\d+(?:\.\d+)?(?:\/\w+)?/i, '')
  const facts = demo
    ? [
        ['Cantidad', '70 cabezas'],
        ['Peso promedio', '280 kg'],
        ['Edad', '14 meses'],
        ['Raza', 'Hereford'],
      ]
    : [
        ['Producto', listing.itemName],
        [
          'Cantidad',
          listing.quantity === null
            ? 'A consultar'
            : listing.quantity.toLocaleString('es-AR') + ' ' + (listing.unit ?? ''),
        ],
        [
          'Disponibilidad',
          listing.availabilityStatus === 'available'
            ? 'Disponible'
            : listing.availabilityStatus === 'expired'
              ? 'Publicación vencida'
              : 'No disponible',
        ],
        ['Calidad', listing.qualityStatus === 'verified' ? 'Verificada' : 'Sin verificar'],
      ]
  return (
    <article
      id="marketplace-product"
      className="mkt-detail mkt-product-detail"
      aria-label={'Detalle de ' + title}
    >
      <div className="mkt-detail-heading">
        <div className="mkt-product-topline">
          <span className="mkt-eyebrow">
            {demo ? 'HACIENDA · EJEMPLO FICTICIO' : 'PUBLICACIÓN'}
          </span>
          <span className="mkt-badge">{demo ? 'Vista de ejemplo' : 'Ficha de producto'}</span>
        </div>
        <h2>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: '#57534e', fontSize: '1rem' }}>
            <span>{demo ? 'Hereford – recría a campo' : listing.itemName}</span>
            {(() => {
              const loc = (listing as any).__frontendDetails?.find((d: any) => d[0] === 'Ubicación' || d[0] === 'Ubicacin')?.[1];
              return loc ? (
                <>
                  <span style={{ color: '#d6d3d1' }}>|</span>
                  <MapPin size={16} style={{ color: '#059669' }} />
                  <span>{loc}</span>
                </>
              ) : null;
            })()}
          </div>
      </div>
      {listing && (listing as any).__frontendImages && (listing as any).__frontendImages.length > 0 ? (
          <div
            className="mkt-product-cover"
            role="img"
            style={{ background: `linear-gradient(0deg, rgba(12, 30, 20, 0.75), transparent 35%), url(${(listing as any).__frontendImages[0]}) center/cover` }}
          >
            <div>
              <MapPin size={18} aria-hidden="true" />
              <span>{listing.provenance?.type === 'official' ? 'Mkt verificado' : 'Ubicación a confirmar'}</span>
            </div>
            {listing.availabilityStatus === 'available' && <small>Disponible ahora</small>}
          </div>
        ) : demo ? (
          <div
            className="mkt-product-cover"
            role="img"
            aria-label="Foto del lote de 70 vaquillonas en el campo"
          >
            <span className="mkt-photo-label">70 vaquillonas - Foto del lote</span>
            <div>
              <MapPin size={18} aria-hidden="true" />
              <span>Gualeguaychú, Entre Ríos</span>
            </div>
            <small>Disponible en 15 días</small>
          </div>
        ) : (
          <div className="mkt-product-image">
            <Sprout size={76} strokeWidth={1} aria-hidden="true" />
            <span>Esta publicación todavía no tiene fotos</span>
          </div>
        )}
      <dl className="mkt-product-specs">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {listing && (
        <div className="mkt-product-section">
          <span className="mkt-eyebrow">PRECIO</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0c2319', marginBottom: '8px' }}>{priceStr}</h3>
            <p style={{ color: '#44403c' }}>
              {priceStr === 'A consultar' 
                ? 'Solicitá una cotización por la cantidad que necesitás. El vendedor no informó un precio explícito.'
                : 'Precio de referencia indicado por el vendedor. Solicitá una cotización para confirmar condiciones comerciales.'}
            </p>
          </div>)}
        
        {/* CALCULADORA DE CUOTAS */}
        {priceStr !== 'A consultar' && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', border: '1px solid #e7e5e4', background: '#fcfcfb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="8" y2="14"></line><line x1="8" y1="18" x2="8" y2="18"></line></svg>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#0c2319', fontWeight: 600 }}>Simulador de financiación</h4>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select 
                value={calcMethod}
                onChange={(e) => setCalcMethod(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d6d3d1', flex: 1, color: '#0c2319' }}
              >
                <option value="canje">Canje Cereal (Cosecha)</option>
                <option value="cheque">Cheque Pago Diferido (90d)</option>
                <option value="galicia">Tarjeta Galicia Rural</option>
                <option value="agronacion">Tarjeta Agronación</option>
              </select>
              <button 
                onClick={handleCalculate}
                style={{ padding: '8px 16px', background: '#0c2319', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
              >
                Calcular
              </button>
            </div>
            
            {calcResult ? (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
                <strong style={{ fontSize: '1.25rem', color: '#065f46', display: 'block' }}>Total a Pagar: USD {calcResult.total.toLocaleString('es-AR')}</strong>
                <span style={{ fontSize: '0.85rem', color: '#047857', marginTop: '4px', display: 'block' }}>Detalle: {calcResult.message}</span>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#78716c', margin: '12px 0 0 0' }}>Simulá tus pagos con las principales herramientas de financiación del agro.</p>
            )}
          </div>
        )}

      <div className="mkt-product-section">
        <h3>Descripción del producto</h3>
        <p>
          {demo
              ? 'Lote parejo de 70 vaquillonas Hereford, recriadas a campo sobre praderas y verdeos. Una propuesta de ejemplo para visualizar la información que acompañaría una publicación ganadera.'
              : ((listing as any).__frontendDescription ? (listing as any).__frontendDescription : 'La publicación identifica el producto como ' +
                listing.itemName +
                '. El vendedor todavía no agregó una descripción ampliada. Consultá las características y condiciones antes de avanzar.')}
        </p>
        {demo && (
          <div className="mkt-product-tags">
            <span>Recría a campo</span>
            <span>Praderas y verdeos</span>
            <span>Rodeo general</span>
          </div>
        )}
      </div>
      <div className="mkt-product-section">
        <h3>Condiciones de la publicación</h3>
        <div className="mkt-condition-grid">
          <div>
            <Truck size={21} aria-hidden="true" />
            <strong>Entrega y retiro</strong>
            <p>
              {demo
                ? 'Retiro en origen. Flete a coordinar con el vendedor.'
                : 'Lugar, plazo y costo de entrega a consultar.'}
            </p>
          </div>
          <div>
            <Scale size={21} aria-hidden="true" />
            <strong>{demo ? 'Pesaje del lote' : 'Cantidad y unidad'}</strong>
            <p>
              {demo
                ? 'Peso orientativo. Lugar de pesada y desbaste a convenir.'
                : 'Confirmá la cantidad disponible y la unidad de venta.'}
            </p>
          </div>
          <div>
            <CalendarDays size={21} aria-hidden="true" />
            <strong>Forma de pago</strong>
            <p>
              {demo
                ? 'Contado o plazo a convenir. Condiciones sujetas a confirmación.'
                : 'Plazos y medios de pago a acordar con el vendedor.'}
            </p>
          </div>
          <div>
            <ShieldCheck size={21} aria-hidden="true" />
            <strong>{demo ? 'Sanidad y documentación' : 'Documentación'}</strong>
            <p>
              {demo
                ? 'Solicitá antecedentes sanitarios y documentación de traslado.'
                : 'Pedí la documentación y especificaciones del producto.'}
            </p>
          </div>
        </div>
      </div>
      <div className="mkt-detail-footer">
        <span>
          {demo
            ? 'Todos los datos de esta ficha son ficticios.'
            : 'Actualizado el ' + marketDate(listing.updatedAt)}
        </span>
        <span>{demo ? 'Referencia DEMO-070' : `Precio: ${priceStr}`}</span>
      </div>
      {!demo && (
        <a className="mkt-button mkt-mobile-consult" href="#marketplace-consult">
          Consultar por este producto
        </a>
      )}
    </article>
  )
}

export function MarketplacePricePreview({ requiresLogin = false }: { requiresLogin?: boolean }) {
  const [price, setPrice] = useState('6000')
  const [quantity, setQuantity] = useState('70')
  const [payment, setPayment] = useState('Contado')
  const [delivery, setDelivery] = useState('Retiro en origen')
  const [simulated, setSimulated] = useState(false)
  const count = Number(quantity)
  const pricePerKg = Number(price)
  const valid =
    quantity.trim() !== '' &&
    Number.isInteger(count) &&
    count >= 1 &&
    count <= 70 &&
    price !== '' &&
    pricePerKg > 0
  const adjustPrice = (change: number) => {
    setPrice(String(Math.min(999999999, Math.max(0, pricePerKg + change))))
    setSimulated(false)
  }
  return (
    <section className="mkt-panel mkt-price-preview" aria-label="Simulador de precio ficticio">
      <span className="mkt-eyebrow">PRECIO DE EJEMPLO</span>
      <h2>Ingresá tu oferta</h2>
      <div className="mkt-price">
        <label htmlFor="marketplace-price">
          Seleccioná el <span>Precio</span>
        </label>
        <div className="mkt-price-control">
          <div className="mkt-price-input">
            <span aria-hidden="true">$</span>
            <input
              id="marketplace-price"
              aria-label="Precio en pesos por kilogramo"
              inputMode="numeric"
              value={price === '' ? '' : pricePerKg.toLocaleString('es-AR')}
              onChange={(event) => {
                setPrice(event.target.value.replace(/\D/g, '').slice(0, 9))
                setSimulated(false)
              }}
            />
          </div>
          <div className="mkt-price-steps">
            <button
              type="button"
              aria-label="Aumentar precio 5 pesos"
              disabled={pricePerKg >= 999999999}
              onClick={() => adjustPrice(5)}
            >
              <b aria-hidden="true">+</b> $ 5,00
            </button>
            <button
              type="button"
              aria-label="Reducir precio 5 pesos"
              disabled={pricePerKg <= 0}
              onClick={() => adjustPrice(-5)}
            >
              <b aria-hidden="true">−</b> $ 5,00
            </button>
          </div>
        </div>
        <span className="mkt-price-unit">Por Kg</span>
      </div>
      <p className="mkt-price-note">
        Sin una publicación real. Este ejemplo no se puede comprar ni reservar.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!valid) return
          if (requiresLogin) {
            window.location.assign('/login?next=marketplace')
            return
          }
          setSimulated(true)
        }}
        onChange={() => setSimulated(false)}
      >
        <label>
          Cantidad de animales
          <input
            type="number"
            min="1"
            max="70"
            step="1"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <small>De 1 a 70 cabezas · simulación</small>
        </label>
        <fieldset>
          <legend>Plazo de pago</legend>
          <div className="mkt-choice-row">
            {['Contado', '30 días', 'A convenir'].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={payment === value}
                onClick={() => {
                  setPayment(value)
                  setSimulated(false)
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Entrega
          <select value={delivery} onChange={(event) => setDelivery(event.target.value)}>
            <option>Retiro en origen</option>
            <option>Flete a coordinar</option>
          </select>
        </label>
        <div className="mkt-estimate">
          <span>Subtotal estimado</span>
          <strong>{valid ? money(count * 280 * pricePerKg) : '—'}</strong>
          <small>
            Calculado con 280 kg por animal (peso ficticio). Sin flete, comisiones ni impuestos. No
            es una cotización.
          </small>
        </div>
        <button className="mkt-button" type="submit" disabled={!valid}>
          Enviar oferta
        </button>
        {requiresLogin && <small>Para enviar una oferta, te pediremos iniciar sesión.</small>}
        {simulated && (
          <p className="mkt-inline-success" role="status">
            Oferta de demostración enviada con éxito.
          </p>
        )}
      </form>
    </section>
  )
}
