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
  agentPrinterId: string | null
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

export type PrinterConnectionType = 'network' | 'usb' | 'bluetooth'

export type AgentPrinter = {
  id: string
  name: string
  connectionType: PrinterConnectionType
  address: string
  paperWidth: number
  isOnline: boolean
  lastSeenAt: string | null
}

export type PrintAgent = {
  id: string
  deviceName: string
  platform: string
  lastSeenAt: string | null
  online: boolean
  printers: AgentPrinter[]
}

export type PairingCodeResult = {
  code: string
  expiresAt: string
  ttlSeconds: number
}

export type UpsertPrinterPayload = {
  name?: string
  host?: string | null
  port?: number
  enabled?: boolean
  paperWidth?: number
  agentPrinterId?: string | null
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
    payload: UpsertPrinterPayload,
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
  generateAgentPairingCode(businessId: string): Promise<PairingCodeResult>
  listAgents(businessId: string): Promise<PrintAgent[]>
}
