import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePrintStore } from '@/presentation/stores/printStore'
import type { PrepStation, PrintExecutionMode } from '@/domain/print/Print'
import { notify, notifyError } from '@/presentation/lib/notify'
import {
  ErrorBanner,
  PageHeader,
  StatusBadge,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'

const STATIONS: PrepStation[] = ['KITCHEN', 'BAR']

export function SettingsPage() {
  const { t } = useTranslation('admin')
  const settings = usePrintStore((s) => s.settings)
  const discovered = usePrintStore((s) => s.discovered)
  const loading = usePrintStore((s) => s.loading)
  const discovering = usePrintStore((s) => s.discovering)
  const error = usePrintStore((s) => s.error)
  const load = usePrintStore((s) => s.load)
  const setMode = usePrintStore((s) => s.setMode)
  const savePrinter = usePrintStore((s) => s.savePrinter)
  const discover = usePrintStore((s) => s.discover)
  const probe = usePrintStore((s) => s.probe)
  const testPrint = usePrintStore((s) => s.testPrint)
  const assignDiscovered = usePrintStore((s) => s.assignDiscovered)
  const [cidr, setCidr] = useState('')

  useEffect(() => {
    void load()
  }, [load])

  const printersByStation = useMemo(() => {
    const map = new Map(settings?.printers.map((p) => [p.station, p]) ?? [])
    return map
  }, [settings])

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
            {settings.printExecutionMode === 'AGENT' ? (
              <p className="text-sm">
                {t('settings.agentStatus')}:{' '}
                <StatusBadge
                  status={settings.agentOnline ? 'COMPLETED' : 'CANCELLED'}
                  label={settings.agentOnline ? t('settings.agentOnline') : t('settings.agentOffline')}
                />
              </p>
            ) : null}
          </section>

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

          <section className="grid gap-6">
            <h2 className="font-display text-xl">{t('settings.printersTitle')}</h2>
            {STATIONS.map((station) => {
              const printer = printersByStation.get(station)
              if (!printer) return null
              return (
                <PrinterForm
                  key={station}
                  station={station}
                  initial={{
                    name: printer.name,
                    host: printer.host ?? '',
                    port: String(printer.port),
                    enabled: printer.enabled,
                    paperWidth: String(printer.paperWidth),
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

function PrinterForm({
  station,
  initial,
  status,
  lastSeenAt,
  lastError,
  onSave,
  onProbe,
  onTest,
}: {
  station: PrepStation
  initial: {
    name: string
    host: string
    port: string
    enabled: boolean
    paperWidth: string
  }
  status: string
  lastSeenAt: string | null
  lastError: string | null
  onSave: (payload: {
    name: string
    host: string | null
    port: number
    enabled: boolean
    paperWidth: number
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(initial.name)
    setHost(initial.host)
    setPort(initial.port)
    setEnabled(initial.enabled)
    setPaperWidth(initial.paperWidth)
  }, [initial.name, initial.host, initial.port, initial.enabled, initial.paperWidth])

  const statusTone =
    status === 'ONLINE' ? 'COMPLETED' : status === 'OFFLINE' ? 'CANCELLED' : 'PENDING'

  return (
    <div className="grid gap-3 border-t border-[var(--gsb-border)] pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg">{t(`settings.station.${station}`)}</h3>
        <StatusBadge status={statusTone} label={t(`settings.connection.${status}`)} />
        {lastSeenAt ? (
          <span className="text-xs text-[var(--gsb-muted)]">
            {t('settings.lastSeen')}: {new Date(lastSeenAt).toLocaleString()}
          </span>
        ) : null}
      </div>
      {lastError ? <p className="text-xs text-red-500">{lastError}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
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
            void onSave({
              name: name.trim(),
              host: host.trim() || null,
              port: Number(port) || 9100,
              enabled,
              paperWidth: Number(paperWidth) || 80,
            }).finally(() => setSaving(false))
          }}
        >
          {t('common.save')}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => void onProbe()}>
          {t('settings.probe')}
        </button>
        <button type="button" className={ghostButtonClass} onClick={() => void onTest()}>
          {t('settings.testPrint')}
        </button>
      </div>
    </div>
  )
}
