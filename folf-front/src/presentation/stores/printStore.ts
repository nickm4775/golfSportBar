import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type {
  DiscoveredPrinter,
  PrepStation,
  PrintExecutionMode,
  PrintSettings,
} from '@/domain/print/Print'

interface PrintState {
  settings: PrintSettings | null
  discovered: DiscoveredPrinter[]
  loading: boolean
  discovering: boolean
  error: string | null
  load: () => Promise<void>
  setMode: (mode: PrintExecutionMode) => Promise<void>
  savePrinter: (
    station: PrepStation,
    payload: {
      name?: string
      host?: string | null
      port?: number
      enabled?: boolean
      paperWidth?: number
    },
  ) => Promise<void>
  discover: (cidr?: string) => Promise<void>
  probe: (station: PrepStation) => Promise<void>
  testPrint: (station: PrepStation) => Promise<void>
  assignDiscovered: (station: PrepStation, host: string, port: number) => Promise<void>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const usePrintStore = create<PrintState>((set, get) => ({
  settings: null,
  discovered: [],
  loading: false,
  discovering: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const settings = await services.print.getSettings(requireBusinessId())
      set({ settings, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async setMode(mode) {
    const settings = await services.print.updateSettings(requireBusinessId(), {
      printExecutionMode: mode,
    })
    set({ settings })
  },

  async savePrinter(station, payload) {
    const settings = await services.print.upsertPrinter(
      requireBusinessId(),
      station,
      payload,
    )
    set({ settings })
  },

  async discover(cidr) {
    set({ discovering: true, error: null })
    try {
      const result = await services.print.discover(requireBusinessId(), cidr)
      set({ discovered: result.printers, discovering: false })
    } catch (error) {
      set({
        discovering: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  async probe(station) {
    await services.print.probe(requireBusinessId(), station)
    await get().load()
  },

  async testPrint(station) {
    await services.print.testPrint(requireBusinessId(), station)
  },

  async assignDiscovered(station, host, port) {
    await get().savePrinter(station, { host, port, enabled: true })
  },
}))
