'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ProductShell } from '@/components/shell/product-shell'
import { createAgronautasAuthClient, normalizeAgronautasAuthClientError, type AgronautasAuthClient, type AgronautasAuthClientErrorOutcome, type AgronautasAuthSession, type AgronautasAuthStatus } from '@/lib/agronautas/auth-client'
import { clearAgronautasProtectedState } from '@/lib/query-client'
import { buildWorkspaceHref, DEMO_WORKSPACE_VIEWS } from './workspace-navigation'

const AUTH_PAGE_STATES = {
  LOADING: 'loading',
  SIGNED_OUT: 'signed_out',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
} as const

type AuthPageState = (typeof AUTH_PAGE_STATES)[keyof typeof AUTH_PAGE_STATES]

interface AgronautasAuthPageProps {
  client?: AgronautasAuthClient
  destination?: '/agronautas' | '/agronautas/marketplace' | '/agronautas?view=livestock'
}

export function AgronautasAuthPage({ client, destination = '/agronautas' }: AgronautasAuthPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [defaultClient] = useState<AgronautasAuthClient>(() => createAgronautasAuthClient())
  const resolvedClient = client ?? defaultClient
  const [pageState, setPageState] = useState<AuthPageState>(AUTH_PAGE_STATES.LOADING)
  const [session, setSession] = useState<AgronautasAuthSession | AgronautasAuthStatus | null>(null)
  const [outcome, setOutcome] = useState<AgronautasAuthClientErrorOutcome | null>(null)
  const [email, setEmail] = useState('invitado@agronauta.com')
  const [password, setPassword] = useState('1234')
  const [pending, setPending] = useState(false)
  const [retryAt, setRetryAt] = useState(0)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!retryAt) return
    const update = () => setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [retryAt])

  useEffect(() => {
    let active = true
    void resolvedClient.status().then((status) => {
      if (!active) return
      setSession(status)
      setPageState(AUTH_PAGE_STATES.AUTHENTICATED)
    }).catch((error: unknown) => {
      if (!active) return
      clearAgronautasProtectedState(queryClient)
      const nextOutcome = normalizeAgronautasAuthClientError(error)
      setOutcome(nextOutcome.state === 'unauthorized' ? null : nextOutcome)
      setPageState(nextOutcome.state === 'unauthorized' ? AUTH_PAGE_STATES.SIGNED_OUT : AUTH_PAGE_STATES.ERROR)
    })
    return () => { active = false }
  }, [resolvedClient, queryClient])

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending || Date.now() < retryAt) return
    const form = new FormData(event.currentTarget)
    const inputEmail = String(form.get('email') ?? email).trim()
    const inputPassword = String(form.get('password') ?? password)

    if (!inputEmail.toLowerCase().includes('facundo')) {
      setPending(true)
      setTimeout(() => {
        setPending(false)
        router.replace('/demo?view=marketplace')
      }, 800)
      return
    }

    clearAgronautasProtectedState(queryClient)
    setPending(true)
    setOutcome(null)
    try {
      const nextSession = await resolvedClient.login({ email: inputEmail, password: inputPassword })
      clearAgronautasProtectedState(queryClient)
      setSession(nextSession)
      setPageState(AUTH_PAGE_STATES.AUTHENTICATED)
      setPassword('')
      router.replace(destination)
    } catch (error: unknown) {
      const nextOutcome = normalizeAgronautasAuthClientError(error)
      setOutcome(nextOutcome)
      if (nextOutcome.retryAfterMs) {
        setRetryAt(Date.now() + nextOutcome.retryAfterMs)
        setRemaining(Math.ceil(nextOutcome.retryAfterMs / 1000))
      }
      setPageState(AUTH_PAGE_STATES.ERROR)
    } finally {
      setPending(false)
    }
  }

  const logout = async () => {
    setPending(true)
    clearAgronautasProtectedState(queryClient)
    try {
      await resolvedClient.logout()
      clearAgronautasProtectedState(queryClient)
      setSession(null)
      setOutcome(null)
      setPageState(AUTH_PAGE_STATES.SIGNED_OUT)
    } catch (error: unknown) {
      setOutcome(normalizeAgronautasAuthClientError(error))
      setPageState(AUTH_PAGE_STATES.ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <ProductShell product="agronautas" title="Iniciar sesión" headerVariant="landing" fullBleed headerOverlay navItems={DEMO_WORKSPACE_VIEWS.map((view) => ({ href: buildWorkspaceHref(view.key, null, '/demo'), label: view.label }))}>
      <section className="relative isolate min-h-svh bg-emerald-950" aria-label="Autenticación Agronautas">
        <img src="/login/login-hero.png" alt="Dos productores recorren un cultivo al atardecer con una tablet" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/65 via-emerald-950/15 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-950/75 via-transparent to-black/20" />
        <div className="mx-auto grid min-h-svh max-w-[90rem] items-center gap-12 px-4 pb-10 pt-28 sm:px-8 sm:pb-16 sm:pt-36 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-20">
          <div className="rounded-3xl border border-white/70 bg-white/95 p-6 text-stone-900 shadow-2xl backdrop-blur-md sm:p-10">
            <a href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-stone-500 transition hover:text-emerald-800"><ArrowLeft size={16} aria-hidden="true" /> Volver al inicio</a>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><LockKeyhole size={22} aria-hidden="true" /></div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">TU CAMPO, CONECTADO</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-950">Qué bueno volver.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">Ingresá a tu cuenta y seguí de cerca lo que pasa en tu campo.</p>
            {pageState === AUTH_PAGE_STATES.LOADING ? <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Verificando tu sesión…</p> : null}
            {pageState === AUTH_PAGE_STATES.AUTHENTICATED && session ? <AuthenticatedState destination={destination} session={session} pending={pending} onRefresh={() => void refresh()} onLogout={() => void logout()} /> : null}
            {pageState === AUTH_PAGE_STATES.SIGNED_OUT || pageState === AUTH_PAGE_STATES.ERROR ? <SignInForm email={email} password={password} remaining={remaining} pending={pending} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={signIn} outcome={outcome} onRecovery={() => { setOutcome(null); setPageState(AUTH_PAGE_STATES.SIGNED_OUT) }} /> : null}
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-stone-200 pt-6 text-xs text-stone-500"><LockKeyhole size={14} aria-hidden="true" /> Un espacio seguro para tu gestión.</div>
          </div>
          <div className="max-w-lg self-end pb-2 text-white lg:pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Cerca de tu tierra. Siempre.</p>
            <p className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">El próximo paso de tu campo empieza acá.</p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/85">Tu equipo, tus decisiones y toda la información que necesitás. En un mismo lugar.</p>
          </div>
        </div>
      </section>
    </ProductShell>
  )
}

function SignInForm({ email, password, remaining, pending, outcome, onEmailChange, onPasswordChange, onSubmit, onRecovery }: { email: string; password: string; remaining: number; pending: boolean; outcome: AgronautasAuthClientErrorOutcome | null; onEmailChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onRecovery: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
      {outcome ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert" aria-live="assertive"><p className="font-semibold">{outcome.title}</p><p className="mt-1">{outcome.description}</p>{outcome.state === 'recovery' ? <button type="button" className="mt-3 font-semibold underline underline-offset-4" onClick={onRecovery}>Volver a iniciar sesión</button> : null}</div> : null}
      <label className="grid gap-2 text-sm font-semibold" htmlFor="agronautas-email">Correo
        <input id="agronautas-email" name="email" type="email" autoComplete="username" placeholder="nombre@ejemplo.com" disabled={pending} required value={email} onChange={(event) => onEmailChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 pr-12 text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" />
      </label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="agronautas-password">Contraseña
        <span className="relative block">
        <input id="agronautas-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresá tu contraseña" disabled={pending} required value={password} onChange={(event) => onPasswordChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 pr-12 text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" />
        <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-stone-500 hover:text-emerald-700 focus-visible:outline-emerald-700">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
        </span>
      </label>
      <button type="submit" disabled={pending || remaining > 0} className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">{pending ? 'Verificando…' : remaining > 0 ? `Reintentar en ${remaining} s` : 'Iniciar sesión'}<ArrowRight size={18} aria-hidden="true" /></button>
    </form>
  )
}

function AuthenticatedState({ destination, session, pending, onRefresh, onLogout }: { destination: string; session: AgronautasAuthSession | AgronautasAuthStatus; pending: boolean; onRefresh: () => void; onLogout: () => void }) {
  return <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status"><p className="font-semibold text-emerald-900">Sesión activa</p><p className="mt-2 text-sm text-stone-600">Espacio de trabajo: <strong>{session.principal.workspaceKey}</strong></p><p className="mt-1 text-xs text-stone-400">Expira: {new Date(session.principal.expiresAt).toLocaleString('es-AR')}</p><div className="mt-5 flex flex-wrap gap-3"><a href={destination} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-950">Abrir workspace</a><button type="button" disabled={pending} onClick={onRefresh} className="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-60">Actualizar sesión</button><button type="button" disabled={pending} onClick={onLogout} className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60">Cerrar sesión</button></div></div>
}
