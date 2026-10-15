import { FlaskConical, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { addEth, compareEth, formatEth, subtractEth } from '@/lib/money'
import { mockControls } from '../controls'
import { db } from '../db/database'
import { SCENARIOS, type ScenarioName } from '../network/scenarios'

const PRICE_STEP = '0.10'
const MIN_PRICE = '0.01'

const BUTTON_CLASS =
  'rounded-sm border border-secondary px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold tracking-wider text-primary uppercase">{title}</h3>
      {children}
    </section>
  )
}

function curatedNfts() {
  return db
    .read()
    .nfts.slice(0, 9)
    .map((record) => ({ id: record.id, name: record.name }))
}

export function SimulationPanel() {
  const [open, setOpen] = useState(false)
  const [nftId, setNftId] = useState('emerald-ape-042')
  const [message, setMessage] = useState('')
  const [, setTick] = useState(0)
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nfts = curatedNfts()
  const record = db.read().nfts.find((item) => item.id === nftId)
  const scenario = mockControls.scenario() as ScenarioName

  useEffect(() => {
    if (open) headingRef.current?.focus()
  }, [open])

  const run = (label: string, action: () => string | void) => {
    try {
      const detail = action()
      setMessage(detail ? `${label}: ${detail}` : label)
    } catch (error) {
      setMessage(`Falhou: ${error instanceof Error ? error.message : String(error)}`)
    }
    setTick((value) => value + 1)
  }

  const changePrice = (direction: 1 | -1) =>
    run(direction > 0 ? 'Preço aumentado' : 'Preço reduzido', () => {
      if (!record) return
      const raw = direction > 0 ? addEth(record.price, PRICE_STEP) : subtractEth(record.price, PRICE_STEP)
      const next = compareEth(raw, MIN_PRICE) < 0 ? MIN_PRICE : raw
      mockControls.setPrice(nftId, next)
      return `${record.name} agora custa ${formatEth(next)}`
    })

  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <div className="fixed top-1/2 right-0 z-[60] -translate-y-1/2 font-sans text-foreground md:top-auto md:right-4 md:bottom-4 md:translate-y-0">
      {open ? (
        <aside
          id={panelId}
          aria-labelledby={`${panelId}-title`}
          onKeyDown={(event) => event.key === 'Escape' && close()}
          className="mr-2 mb-3 max-h-[min(36rem,calc(100dvh-8rem))] w-[min(22rem,calc(100vw-2rem))] md:mr-0 space-y-4 overflow-y-auto rounded-md border border-primary/60 bg-surface p-4 shadow-2xl shadow-black/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={`${panelId}-title`} ref={headingRef} tabIndex={-1} className="text-sm font-bold outline-none">
                Painel de simulação
              </h2>
              <p className="text-xs text-subtle">Controla o backend fictício (MSW). Visível apenas com mocks ativos.</p>
            </div>
            <button type="button" onClick={close} aria-label="Fechar painel de simulação" className="rounded-sm p-1 hover:text-primary">
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <Section title="Cenário de rede">
            <label htmlFor={`${panelId}-scenario`} className="sr-only">
              Cenário
            </label>
            <select
              id={`${panelId}-scenario`}
              value={scenario}
              onChange={(event) => {
                mockControls.useScenario(event.target.value)
                window.location.reload()
              }}
              className="h-9 w-full rounded-sm border border-secondary bg-background px-2 text-xs"
            >
              {Object.values(SCENARIOS).map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-subtle">{SCENARIOS[scenario]?.description} A página recarrega ao trocar.</p>
          </Section>

          <Section title="Mercado em tempo real (Socket.IO)">
            <label htmlFor={`${panelId}-nft`} className="sr-only">
              NFT
            </label>
            <select
              id={`${panelId}-nft`}
              value={nftId}
              onChange={(event) => setNftId(event.target.value)}
              className="h-9 w-full rounded-sm border border-secondary bg-background px-2 text-xs"
            >
              {nfts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {record ? (
              <p className="text-xs text-subtle">
                Preço atual {formatEth(record.price)} · versão {record.version} ·{' '}
                {record.editions.map((edition) => `${edition.label}: ${edition.available}`).join(' · ')}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={BUTTON_CLASS} onClick={() => changePrice(1)}>
                Subir preço +{PRICE_STEP}
              </button>
              <button type="button" className={BUTTON_CLASS} onClick={() => changePrice(-1)}>
                Baixar preço −{PRICE_STEP}
              </button>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={() => run('Todas as edições esgotadas', () => void mockControls.sellOut(nftId))}
              >
                Esgotar todas as edições
              </button>
              <button type="button" className={BUTTON_CLASS} onClick={() => run('Estoque reposto', () => void mockControls.restock(nftId))}>
                Repor estoque
              </button>
            </div>
          </Section>

          <Section title="Robustez do cliente">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={() => run('Último evento reenviado (deve ser ignorado)', () => mockControls.replayLastEvent() ?? 'nenhum evento ainda')}
              >
                Reenviar evento (duplicado)
              </button>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={() => run('Evento antigo enviado (deve ser ignorado)', () => void mockControls.emitStaleEvent(nftId, '9.99'))}
              >
                Enviar evento antigo
              </button>
              <button
                type="button"
                className={BUTTON_CLASS}
                onClick={() => run('Conexão derrubada', () => `${mockControls.dropRealtime()} conexão(ões) encerrada(s); o cliente reconecta sozinho`)}
              >
                Derrubar conexão
              </button>
              <button type="button" className={BUTTON_CLASS} onClick={() => run('Sessões expiradas', () => mockControls.expireSessions())}>
                Expirar sessão
              </button>
            </div>
          </Section>

          <Section title="Dados">
            <button
              type="button"
              className={BUTTON_CLASS}
              onClick={() => {
                mockControls.reset()
                window.location.reload()
              }}
            >
              Restaurar cenário inicial (apaga carrinhos, favoritos e sessões)
            </button>
          </Section>

          <p role="status" aria-live="polite" className="min-h-4 text-xs text-primary">
            {message}
          </p>
        </aside>
      ) : null}
      <div className="flex justify-end">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => (open ? close() : setOpen(true))}
          className="flex items-center gap-2 rounded-l-full border border-primary/60 bg-surface/95 px-3 py-2 text-xs font-semibold md:rounded-full shadow-lg shadow-black/40 backdrop-blur transition-colors hover:border-primary hover:text-primary"
        >
          <FlaskConical className="size-4 text-primary" aria-hidden />
          <span className="sr-only md:not-sr-only">Simulação</span>
        </button>
      </div>
    </div>
  )
}
