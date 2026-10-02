'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode, SVGProps } from 'react'

export type JakaruIconName = 'overview' | 'study' | 'arrow' | 'leaf' | 'drop' | 'history'

const iconPaths: Record<JakaruIconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  study: (
    <>
      <path d="M4 19h16M6 16V8m6 8V4m6 12v-5" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="9" r="2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  leaf: (
    <>
      <path d="M20.5 3.5c-8 0-14 2.5-14 9a5 5 0 0 0 5 5c6.5 0 9-6 9-14Z" />
      <path d="M3.5 21c2.5-6 6-9 12-12" />
    </>
  ),
  drop: <path d="M12 3s-6 7-6 12a6 6 0 0 0 12 0c0-5-6-12-6-12Z" />,
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l4 2" />
    </>
  ),
}

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: JakaruIconName }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  )
}

const steps = [
  { number: '01', title: 'Recopilar', text: 'Reunir mediciones de ejemplo vinculadas a cada huerta.', icon: 'drop' as const },
  { number: '02', title: 'Guardar', text: 'Conservar lecturas y observaciones en un historial.', icon: 'history' as const },
  { number: '03', title: 'Consultar', text: 'Explorar fechas, variables y cambios registrados.', icon: 'overview' as const },
  { number: '04', title: 'Estudiar', text: 'Aportar información organizada al trabajo con especialistas.', icon: 'study' as const },
]

function GardenArtwork() {
  return (
    <div className="jakaru-hero-art" aria-label="Ilustración conceptual de canteros junto a un panel de seguimiento">
      <div className="jakaru-art-sun" />
      <div className="jakaru-art-field">
        <svg viewBox="0 0 520 400" role="img" aria-label="Ilustración conceptual de una huerta con canteros y cultivos">
          <path d="M0 245C92 201 155 226 238 183s157-41 282-7v224H0Z" fill="#e8eee1" />
          <path d="M0 279c78-25 151-6 236-43 83-36 184-44 284-15v179H0Z" fill="#dbe8d4" />
          <path d="M36 310c91-39 165-10 260-48 74-30 132-37 195-29" fill="none" stroke="#a7c390" strokeWidth="3" />
          <path d="M25 350c85-32 164-9 259-45 72-28 146-39 210-28" fill="none" stroke="#a7c390" strokeWidth="3" />
          <g fill="#4b8c58">
            <path d="M80 245c-3-30 10-50 23-53 8 19 1 40-23 53Zm5 1c-19-22-20-43-11-51 16 13 21 29 11 51Zm40-17c-1-31 13-52 26-54 8 20-1 42-26 54Zm7 1c-18-23-17-43-7-51 16 12 19 29 7 51Zm54-26c0-28 14-47 26-49 7 18-2 38-26 49Zm8 2c-17-21-17-39-7-47 15 11 18 26 7 47Z" />
            <path d="M275 252c-2-30 11-48 24-51 8 19 1 39-24 51Zm6 2c-18-21-19-41-10-49 15 12 20 27 10 49Zm50-17c0-29 13-48 25-51 8 18 0 39-25 51Zm7 1c-17-21-17-40-7-48 15 12 18 27 7 48Zm55-23c0-27 13-45 25-47 7 17-2 36-25 47Zm8 2c-16-20-16-38-7-45 14 10 17 25 7 45Z" />
          </g>
          <g fill="none" stroke="#286c47" strokeWidth="3" strokeLinecap="round">
            <path d="M97 268v-34m41 16v-35m58 15v-32m92 55v-33m50 17v-35m58 13v-32" />
          </g>
          <g fill="#db8b48"><circle cx="126" cy="213" r="5" /><circle cx="331" cy="224" r="5" /><circle cx="256" cy="269" r="4" /></g>
        </svg>
        <div className="jakaru-art-label"><span /> Vista conceptual · huerta de estudio</div>
      </div>
      <div className="jakaru-preview-card jakaru-preview-main">
        <div className="jakaru-preview-top"><span>Seguimiento</span><span className="jakaru-preview-tag">EJEMPLO</span></div>
        <strong>Huerta de estudio Norte</strong>
        <small>Monte Caseros · Corrientes</small>
        <div className="jakaru-preview-chart"><svg viewBox="0 0 180 38"><path d="M0 31 37 23 71 25 109 13 145 18 180 5" fill="none" stroke="#287a70" strokeWidth="2.5" /></svg></div>
        <div className="jakaru-preview-bottom"><span>Humedad del suelo</span><b>36,5 %</b></div>
      </div>
      <div className="jakaru-preview-card jakaru-preview-note"><span className="jakaru-preview-note-icon"><Icon name="leaf" /></span><span><b>Registros en contexto</b><small>Mediciones y observaciones</small></span></div>
    </div>
  )
}

export default function JakaruPage() {
  return (
    <div className="jakaru-shell">
      <header className="jakaru-header">
        <div className="jakaru-container jakaru-header-inner">
          <Link className="jakaru-wordmark" href="/jakaru" aria-label="Agronautas, inicio Jakaru Porá">
            <span>Agronautas</span>
            <small>Jakaru Porá · huertas</small>
          </Link>
          <nav className="jakaru-nav" aria-label="Navegación principal">
            <a href="#propuesta">La propuesta</a>
            <a href="#etapas">Etapas</a>
            <Link className="jakaru-nav-demo" href="/demo-jakaru">Explorar la demo <span aria-hidden="true">↗</span></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="jakaru-home-hero">
          <div className="jakaru-container jakaru-hero-layout">
            <div className="jakaru-hero-copy">
              <p className="jakaru-kicker"><span /> AGRONAUTAS <span className="jakaru-kicker-separator">/</span> JAKARU PORÁ</p>
              <h1>Información para acompañar la evolución de cada huerta</h1>
              <p className="jakaru-hero-lead">Una propuesta de Agronautas para registrar condiciones, estudiar su evolución y facilitar el seguimiento de las huertas de Jakaru Porá.</p>
              <div className="jakaru-hero-actions"><Link className="jakaru-button-primary" href="/demo-jakaru">Explorar la demo <Icon name="arrow" /></Link><a className="jakaru-button-text" href="#etapas">Conocer las etapas <span aria-hidden="true">↓</span></a></div>
              <div className="jakaru-hero-caption"><span /> Una primera etapa centrada en huertas de estudio</div>
            </div>
            <GardenArtwork />
          </div>
          <div className="jakaru-container jakaru-hero-foot"><span>Una herramienta en desarrollo</span><span>Demo con datos simulados</span></div>
        </section>

        <section className="jakaru-prototype-section" id="prototipo">
          <div className="jakaru-container">
            <div className="jakaru-prototype-intro">
              <div><p className="jakaru-kicker">DEL CONCEPTO AL PROTOTIPO</p><h2>Una idea que ya se puede ver y recorrer</h2></div>
              <p>El seguimiento empieza con una pregunta simple: ¿cómo evoluciona cada huerta? El prototipo propone registrar esa historia para poder consultarla junto con especialistas.</p>
            </div>
            <div className="jakaru-prototype-gallery">
              <figure className="jakaru-prototype-image"><Image src="/landing/source/prototipoImg1.webp" alt="Prototipo del dispositivo para el monitoreo de huertas" width={720} height={480} priority className="jakaru-prototype-media" /><figcaption><span>El dispositivo en contexto</span><span className="jakaru-prototype-tag">Prototipo</span></figcaption></figure>
              <div className="jakaru-prototype-video"><div className="jakaru-prototype-video-head"><span>EL PROTOTIPO EN MOVIMIENTO</span><small>Video</small></div><video controls muted playsInline preload="metadata" poster="/landing/source/prototipoImg1.webp"><source src="/landing/source/videoPrototipo.mp4" type="video/mp4" />Tu navegador no puede reproducir este video.</video><p>Recorrido visual del dispositivo. La demostración utiliza datos simulados.</p></div>
            </div>
          </div>
        </section>

        <section className="jakaru-section-how" id="propuesta">
          <div className="jakaru-container">
            <div className="jakaru-section-heading jakaru-section-heading-split"><div><p className="jakaru-kicker">CÓMO FUNCIONARÍA</p><h2>De una lectura a una historia que se puede consultar</h2></div><p>La propuesta conecta mediciones, registros y consultas para acompañar el estudio de cada huerta junto con especialistas.</p></div>
            <div className="jakaru-steps-grid">{steps.map((step) => <article className="jakaru-step-item" key={step.number}><span className="jakaru-step-number">{step.number}</span><div className="jakaru-step-icon"><Icon name={step.icon} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
            <Link className="jakaru-button-primary" style={{ marginTop: 30 }} href="/jakaru">Conocer más <Icon name="arrow" /></Link>
          </div>
        </section>

        <section className="jakaru-section-stages" id="etapas">
          <div className="jakaru-container jakaru-stages-layout">
            <div className="jakaru-stages-intro"><p className="jakaru-kicker">ETAPAS DEL DESARROLLO</p><h2>Aprender primero. Ampliar después.</h2><p>Un desarrollo progresivo para estudiar la experiencia y evaluar cómo extenderla.</p></div>
            <div className="jakaru-stage-list"><article className="jakaru-stage-item"><span className="jakaru-stage-marker">01</span><div><span className="jakaru-stage-label">PRIMERO</span><h3>Huertas de estudio</h3><p>Validar el registro y la consulta de mediciones junto con el trabajo de especialistas.</p></div><span className="jakaru-stage-status">Etapa inicial</span></article><article className="jakaru-stage-item"><span className="jakaru-stage-marker jakaru-stage-marker-muted">02</span><div><span className="jakaru-stage-label">DESPUÉS</span><h3>Ampliar el seguimiento</h3><p>Evaluar dispositivos más accesibles para huertas familiares y comunitarias.</p></div><span className="jakaru-stage-status jakaru-stage-status-muted">Proyección</span></article></div>
          </div>
        </section>

        <section className="jakaru-section-benefits">
          <div className="jakaru-container">
            <div className="jakaru-section-heading"><p className="jakaru-kicker">QUÉ BUSCAMOS ACOMPAÑAR</p><h2>Información útil para distintos recorridos</h2><p>Son objetivos del proyecto, sujetos al desarrollo y al trabajo conjunto.</p></div>
            <div className="jakaru-benefit-grid"><article><span>01 / FAMILIAS</span><h3>Acompañar decisiones</h3><p>Contar con registros que puedan aportar información para el seguimiento de los cultivos.</p></article><article><span>02 / ESPECIALISTAS</span><h3>Estudiar y comparar</h3><p>Organizar observaciones y mediciones como insumo para el análisis especializado.</p></article><article><span>03 / ORGANISMOS</span><h3>Consultar avances</h3><p>Explorar herramientas para acompañar el desarrollo del programa de huertas.</p></article></div>
          </div>
        </section>

        <section className="jakaru-section-team"><div className="jakaru-container jakaru-team-panel"><div className="jakaru-team-symbol"><Icon name="leaf" /></div><div><p className="jakaru-kicker">SOBRE AGRONAUTAS</p><h2>Software y hardware para el ámbito agropecuario</h2><p>Somos parte de un equipo de cerca de ocho emprendedores. Agronautas trabaja en proyectos agropecuarios, incluido el monitoreo de ganado, y desarrolla esta propuesta junto con Jakaru Porá.</p></div><Link className="jakaru-button-primary jakaru-button-light" href="/demo-jakaru">Ver la propuesta en demo <Icon name="arrow" /></Link></div></section>
      </main>

      <footer className="jakaru-footer"><div className="jakaru-container jakaru-footer-main"><div><Link className="jakaru-footer-wordmark" href="/jakaru">Agronautas</Link><p>Software y hardware para el ámbito agropecuario.</p></div><div className="jakaru-footer-links"><a href="#propuesta">La propuesta</a><a href="#etapas">Etapas</a><Link href="/demo-jakaru">Abrir demo <span aria-hidden="true">↗</span></Link></div></div><div className="jakaru-container jakaru-footer-bottom"><span>Jakaru Porá · Proyecto en desarrollo</span><span>La demo usa datos completamente simulados.</span></div></footer>
    </div>
  )
}
