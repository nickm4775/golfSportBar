import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type {
  DiscoveredPrinter,
  PairingCodeResult,
  PrepStation,
  PrintAgent,
  PrintExecutionMode,
  PrintSettings,
  UpsertPrinterPayload,
} from '@/domain/print/Print'

interface PrintState {
  settings: PrintSettings | null
  discovered: DiscoveredPrinter[]
  agents: PrintAgent[]
  pairingCode: PairingCodeResult | null
  loading: boolean
  discovering: boolean
  error: string | null
  load: () => Promise<void>
  loadAgents: () => Promise<void>
  generatePairingCode: () => Promise<void>
  setMode: (mode: PrintExecutionMode) => Promise<void>
  savePrinter: (station: PrepStation, payload: UpsertPrinterPayload) => Promise<void>
  assignAgentPrinter: (station: PrepStation, agentPrinterId: string | null) => Promise<void>
  discover: (cidr?: string) => Promise<void>
  probe: (station: PrepStation) => Promise<void>
  testPrint: (station: PrepStation) => Promise<void>
  printReceipt: (orderId: string) => Promise<void>
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
  agents: [],
  pairingCode: null,
  loading: false,
  discovering: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const settings = await services.print.getSettings(requireBusinessId())
      set({ settings, loading: false })
      if (settings.printExecutionMode === 'AGENT') {
        await get().loadAgents()
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async loadAgents() {
    try {
      const agents = await services.print.listAgents(requireBusinessId())
      set({ agents })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async generatePairingCode() {
    const pairingCode = await services.print.generateAgentPairingCode(requireBusinessId())
    set({ pairingCode })
  },

  async setMode(mode) {
    const settings = await services.print.updateSettings(requireBusinessId(), {
      printExecutionMode: mode,
    })
    set({ settings })
    if (mode === 'AGENT') {
      await get().loadAgents()
    }
  },

  async savePrinter(station, payload) {
    const settings = await services.print.upsertPrinter(
      requireBusinessId(),
      station,
      payload,
    )
    set({ settings })
  },

  async assignAgentPrinter(station, agentPrinterId) {
    await get().savePrinter(station, { agentPrinterId })
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

  async printReceipt(orderId) {
    await services.print.printReceipt(requireBusinessId(), orderId)
  },

  async assignDiscovered(station, host, port) {
    await get().savePrinter(station, { host, port, enabled: true })
  },
}))
