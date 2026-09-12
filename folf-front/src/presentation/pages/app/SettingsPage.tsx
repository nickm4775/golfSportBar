import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePrintStore } from '@/presentation/stores/printStore'
import type { AgentPrinter, PrepStation, PrintExecutionMode } from '@/domain/print/Print'
import { notify, notifyError } from '@/presentation/lib/notify'
import {
  ErrorBanner,
  PageHeader,
  StatusBadge,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'

const STATIONS: PrepStation[] = ['KITCHEN', 'BAR', 'RECEIPT']

function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

export function SettingsPage() {
  const { t } = useTranslation('admin')
  const settings = usePrintStore((s) => s.settings)
  const discovered = usePrintStore((s) => s.discovered)
  const agents = usePrintStore((s) => s.agents)
  const pairingCode = usePrintStore((s) => s.pairingCode)
  const loading = usePrintStore((s) => s.loading)
  const discovering = usePrintStore((s) => s.discovering)
  const error = usePrintStore((s) => s.error)
  const load = usePrintStore((s) => s.load)
  const setMode = usePrintStore((s) => s.setMode)
  const savePrinter = usePrintStore((s) => s.savePrinter)
  const generatePairingCode = usePrintStore((s) => s.generatePairingCode)
  const discover = usePrintStore((s) => s.discover)
  const probe = usePrintStore((s) => s.probe)
  const testPrint = usePrintStore((s) => s.testPrint)
  const assignDiscovered = usePrintStore((s) => s.assignDiscovered)
  const [cidr, setCidr] = useState('')

  useEffect(() => {
    void load()
  }, [load])

  const isAgentMode = settings?.printExecutionMode === 'AGENT'

  const printersByStation = useMemo(() => {
    const map = new Map(settings?.printers.map((p) => [p.station, p]) ?? [])
    return map
  }, [settings])

  const agentPrinters = useMemo<AgentPrinter[]>(
    () => agents.flatMap((a) => a.printers),
    [agents],
  )

  const onModeChange = async (mode: PrintExecutionMode) => {
    try {
      await setMode(mode)
      notify({ title: t('settings.modeSaved') })
    } catch (err) {
      notifyError(t('common.error'), err)
    }
  }

  const onDiscover = async () => {
    try {
      await discover(cidr.trim() || undefined)
      notify({
        title: t('settings.discoverDone', { count: usePrintStore.getState().discovered.length }),
      })
    } catch (err) {
      notifyError(t('common.error'), err)
    }
  }

  const onGenerateCode = async () => {
    try {
      await generatePairingCode()
    } catch (err) {
      notifyError(t('common.error'), err)
    }
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      {error ? (
        <ErrorBanner message={error} onRetry={() => void load()} retryLabel={t('common.retry')} />
      ) : null}

      {loading && !settings ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : null}

      {settings ? (
        <div className="grid gap-8">
          <section className="grid gap-3">
            <h2 className="font-display text-xl">{t('settings.modeTitle')}</h2>
            <p className="text-sm text-[var(--gsb-muted)]">
              {settings.printExecutionMode === 'DIRECT'
                ? t('settings.modeHelpDirect')
                : t('settings.modeHelpAgent')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['DIRECT', 'AGENT'] as PrintExecutionMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={
                    settings.printExecutionMode === mode ? primaryButtonClass : ghostButtonClass
                  }
                  onClick={() => void onModeChange(mode)}
                >
                  {t(`settings.mode.${mode}`)}
                </button>
              ))}
            </div>
            {isAgentMode ? (
              <p className="text-sm">
                {t('settings.agentStatus')}:{' '}
                <StatusBadge
                  status={settings.agentOnline ? 'COMPLETED' : 'CANCELLED'}
                  label={settings.agentOnline ? t('settings.agentOnline') : t('settings.agentOffline')}
                />
              </p>
            ) : null}
          </section>

          {isAgentMode ? (
            <section className="grid gap-4">
              <div className="grid gap-3">
                <h2 className="font-display text-xl">{t('settings.agentPairing.title')}</h2>
                <p className="text-sm text-[var(--gsb-muted)]">{t('settings.agentPairing.help')}</p>
                <div>
                  <button type="button" className={primaryButtonClass} onClick={() => void onGenerateCode()}>
                    {pairingCode
                      ? t('settings.agentPairing.regenerate')
                      : t('settings.agentPairing.generate')}
                  </button>
                </div>
                {pairingCode ? <PairingCodeCard expiresAt={pairingCode.expiresAt} code={pairingCode.code} /> : null}
              </div>

              <div className="grid gap-3">
                <h3 className="font-display text-lg">{t('settings.agentsList.title')}</h3>
                {agents.length === 0 ? (
                  <p className="text-sm text-[var(--gsb-muted)]">{t('settings.agentsList.noAgents')}</p>
                ) : (
                  <ul className="grid gap-3">
                    {agents.map((agent) => (
                      <li
                        key={agent.id}
                        className="grid gap-2 border border-[var(--gsb-border)] rounded-lg p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{agent.deviceName || agent.id}</span>
                          <StatusBadge
                            status={agent.online ? 'COMPLETED' : 'CANCELLED'}
                            label={
                              agent.online
                                ? t('settings.agentsList.online')
                                : t('settings.agentsList.offline')
                            }
                          />
                          <span className="text-xs text-[var(--gsb-muted)]">
                            {t('settings.agentsList.platform')}: {agent.platform || '—'}
                          </span>
                          {agent.lastSeenAt ? (
                            <span className="text-xs text-[var(--gsb-muted)]">
                              {t('settings.agentsList.lastSeen')}:{' '}
                              {new Date(agent.lastSeenAt).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-[var(--gsb-muted)]">
                          {t('settings.agentsList.printers')}:
                        </div>
                        <ul className="grid gap-1">
                          {agent.printers.length === 0 ? (
                            <li className="text-xs text-[var(--gsb-muted)]">—</li>
                          ) : (
                            agent.printers.map((p) => (
                              <li key={p.id} className="flex flex-wrap items-center gap-2 text-xs">
                                <span>{p.name}</span>
                                <span className="text-[var(--gsb-muted)]">{p.address}</span>
                                <span className="text-[var(--gsb-muted)]">{p.paperWidth} mm</span>
                                <StatusBadge
                                  status={p.isOnline ? 'COMPLETED' : 'CANCELLED'}
                                  label={
                                    p.isOnline
                                      ? t('settings.agentsList.online')
                                      : t('settings.agentsList.offline')
                                  }
                                />
                              </li>
                            ))
                          )}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : null}

          {settings.printExecutionMode === 'DIRECT' ? (
            <section className="grid gap-3">
              <h2 className="font-display text-xl">{t('settings.discoverTitle')}</h2>
              <p className="text-sm text-[var(--gsb-muted)]">{t('settings.discoverHelp')}</p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs text-[var(--gsb-muted)]">
                  CIDR
                  <input
                    className={`${inputClass} mt-1`}
                    placeholder="192.168.1.0/24"
                    value={cidr}
                    onChange={(e) => setCidr(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={primaryButtonClass}
                  disabled={discovering}
                  onClick={() => void onDiscover()}
                >
                  {discovering ? t('settings.discovering') : t('settings.discover')}
                </button>
              </div>
              {discovered.length > 0 ? (
                <ul className="grid gap-2">
                  {discovered.map((item) => (
                    <li
                      key={`${item.host}:${item.port}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gsb-border)] py-2 text-sm"
                    >
                      <span>
                        {item.host}:{item.port} · {item.latencyMs}ms
                      </span>
                      <span className="flex gap-2">
                        {STATIONS.map((station) => (
                          <button
                            key={station}
                            type="button"
                            className={ghostButtonClass}
                            onClick={() =>
                              void assignDiscovered(station, item.host, item.port)
                                .then(() =>
                                  notify({
                                    title: t('settings.assigned', {
                                      station: t(`settings.station.${station}`),
                                    }),
                                  }),
                                )
                                .catch((err) => notifyError(t('common.error'), err))
                            }
                          >
                            {t('settings.assignTo', { station: t(`settings.station.${station}`) })}
                          </button>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-6">
            <h2 className="font-display text-xl">{t('settings.printersTitle')}</h2>
            {STATIONS.map((station) => {
              const printer = printersByStation.get(station)
              if (!printer) return null
              return (
                <PrinterForm
                  key={station}
                  station={station}
                  mode={settings.printExecutionMode}
                  agentPrinters={agentPrinters}
                  initial={{
                    name: printer.name,
                    host: printer.host ?? '',
                    port: String(printer.port),
                    enabled: printer.enabled,
                    paperWidth: String(printer.paperWidth),
                    agentPrinterId: printer.agentPrinterId ?? '',
                  }}
                  status={printer.connectionStatus}
                  lastSeenAt={printer.lastSeenAt}
                  lastError={printer.lastError}
                  onSave={async (payload) => {
                    try {
                      await savePrinter(station, payload)
                      notify({ title: t('settings.printerSaved') })
                    } catch (err) {
                      notifyError(t('common.error'), err)
                    }
                  }}
                  onProbe={async () => {
                    try {
                      await probe(station)
                      notify({ title: t('settings.probeDone') })
                    } catch (err) {
                      notifyError(t('common.error'), err)
                    }
                  }}
                  onTest={async () => {
                    try {
                      await testPrint(station)
                      notify({ title: t('settings.testQueued') })
                    } catch (err) {
                      notifyError(t('common.error'), err)
                    }
                  }}
                />
              )
            })}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PairingCodeCard({ expiresAt, code }: { expiresAt: string; code: string }) {
  const { t } = useTranslation('admin')
  const [remaining, setRemaining] = useState(() => secondsLeft(expiresAt))

  useEffect(() => {
    setRemaining(secondsLeft(expiresAt))
    const id = setInterval(() => setRemaining(secondsLeft(expiresAt)), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const expired = remaining <= 0

  return (
    <div className="grid gap-1 border border-[var(--gsb-border)] rounded-lg p-4">
      <span className="text-xs text-[var(--gsb-muted)]">{t('settings.agentPairing.code')}</span>
      <span
        className={`font-mono text-3xl tracking-[0.3em] ${expired ? 'text-[var(--gsb-muted)] line-through' : ''}`}
      >
        {code}
      </span>
      <span className="text-xs text-[var(--gsb-muted)]">
        {expired
          ? t('settings.agentPairing.expired')
          : t('settings.agentPairing.expiresIn', { seconds: remaining })}
      </span>
      <p className="mt-1 text-xs text-[var(--gsb-muted)]">{t('settings.agentPairing.instructions')}</p>
    </div>
  )
}

function PrinterForm({
  station,
  mode,
  agentPrinters,
  initial,
  status,
  lastSeenAt,
  lastError,
  onSave,
  onProbe,
  onTest,
}: {
  station: PrepStation
  mode: PrintExecutionMode
  agentPrinters: AgentPrinter[]
  initial: {
    name: string
    host: string
    port: string
    enabled: boolean
    paperWidth: string
    agentPrinterId: string
  }
  status: string
  lastSeenAt: string | null
  lastError: string | null
  onSave: (payload: {
    name: string
    host?: string | null
    port?: number
    enabled: boolean
    paperWidth?: number
    agentPrinterId?: string | null
  }) => Promise<void>
  onProbe: () => Promise<void>
  onTest: () => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [name, setName] = useState(initial.name)
  const [host, setHost] = useState(initial.host)
  const [port, setPort] = useState(initial.port)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [paperWidth, setPaperWidth] = useState(initial.paperWidth)
  const [agentPrinterId, setAgentPrinterId] = useState(initial.agentPrinterId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(initial.name)
    setHost(initial.host)
    setPort(initial.port)
    setEnabled(initial.enabled)
    setPaperWidth(initial.paperWidth)
    setAgentPrinterId(initial.agentPrinterId)
  }, [
    initial.name,
    initial.host,
    initial.port,
    initial.enabled,
    initial.paperWidth,
    initial.agentPrinterId,
  ])

  const isAgentMode = mode === 'AGENT'
  const statusTone =
    status === 'ONLINE' ? 'COMPLETED' : status === 'OFFLINE' ? 'CANCELLED' : 'PENDING'

  return (
    <div className="grid gap-3 border-t border-[var(--gsb-border)] pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg">{t(`settings.station.${station}`)}</h3>
        {!isAgentMode ? (
          <StatusBadge status={statusTone} label={t(`settings.connection.${status}`)} />
        ) : null}
        {lastSeenAt ? (
          <span className="text-xs text-[var(--gsb-muted)]">
            {t('settings.lastSeen')}: {new Date(lastSeenAt).toLocaleString()}
          </span>
        ) : null}
      </div>
      {lastError ? <p className="text-xs text-red-500">{lastError}</p> : null}
      {isAgentMode && !agentPrinterId ? (
        <p className="text-xs text-amber-600">{t('settings.agentPrinter.unassignedWarning')}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {isAgentMode ? (
          <label className="text-xs text-[var(--gsb-muted)]">
            {t('settings.agentPrinter.label')}
            <select
              className={`${inputClass} mt-1`}
              value={agentPrinterId}
              onChange={(e) => setAgentPrinterId(e.target.value)}
            >
              <option value="">{t('settings.agentPrinter.none')}</option>
              {agentPrinters.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.address}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="text-xs text-[var(--gsb-muted)]">
              {t('settings.host')}
              <input
                className={`${inputClass} mt-1`}
                placeholder="192.168.1.50"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </label>
            <label className="text-xs text-[var(--gsb-muted)]">
              {t('settings.port')}
              <input
                className={`${inputClass} mt-1`}
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </label>
          </>
        )}
        {!isAgentMode ? (
          <label className="text-xs text-[var(--gsb-muted)]">
            {t('settings.paperWidth')}
            <select
              className={`${inputClass} mt-1`}
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value)}
            >
              <option value="58">58 mm</option>
              <option value="80">80 mm</option>
            </select>
          </label>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t('settings.enabled')}
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryButtonClass}
          disabled={saving}
          onClick={() => {
            setSaving(true)
            const payload = isAgentMode
              ? {
                  name: name.trim(),
                  enabled,
                  agentPrinterId: agentPrinterId || null,
                }
              : {
                  name: name.trim(),
                  host: host.trim() || null,
                  port: Number(port) || 9100,
                  enabled,
                  paperWidth: Number(paperWidth) || 80,
                }
            void onSave(payload).finally(() => setSaving(false))
          }}
        >
          {t('common.save')}
        </button>
        {!isAgentMode ? (
          <button type="button" className={ghostButtonClass} onClick={() => void onProbe()}>
            {t('settings.probe')}
          </button>
        ) : null}
        <button type="button" className={ghostButtonClass} onClick={() => void onTest()}>
          {t('settings.testPrint')}
        </button>
      </div>
    </div>
  )
}
