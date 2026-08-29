export type PrepStation = 'KITCHEN' | 'BAR'
export type PrintExecutionMode = 'DIRECT' | 'AGENT'
export type PrinterConnectionStatus = 'UNKNOWN' | 'ONLINE' | 'OFFLINE'

export type BusinessPrinter = {
  id: string
  station: PrepStation
  name: string
  host: string | null
  port: number
  enabled: boolean
  paperWidth: number
  connectionStatus: PrinterConnectionStatus
  lastSeenAt: string | null
  lastError: string | null
}

export type PrintSettings = {
  printExecutionMode: PrintExecutionMode
  agentLastSeenAt: string | null
  agentOnline: boolean
  printers: BusinessPrinter[]
}

export type DiscoveredPrinter = {
  host: string
  port: number
  latencyMs: number
}

export interface IPrintRepository {
  getSettings(businessId: string): Promise<PrintSettings>
  updateSettings(
    businessId: string,
    payload: { printExecutionMode: PrintExecutionMode },
  ): Promise<PrintSettings>
  upsertPrinter(
    businessId: string,
    station: PrepStation,
    payload: {
      name?: string
      host?: string | null
      port?: number
      enabled?: boolean
      paperWidth?: number
    },
  ): Promise<PrintSettings>
  discover(
    businessId: string,
    cidr?: string,
  ): Promise<{ printers: DiscoveredPrinter[]; mode: PrintExecutionMode }>
  probe(
    businessId: string,
    station: PrepStation,
  ): Promise<{ station: PrepStation; status: PrinterConnectionStatus; latencyMs?: number; error?: string }>
  testPrint(businessId: string, station: PrepStation): Promise<unknown>
}
