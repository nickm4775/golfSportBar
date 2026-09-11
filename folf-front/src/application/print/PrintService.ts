import type {
  AgentPrinter,
  DiscoveredPrinter,
  IPrintRepository,
  PairingCodeResult,
  PrepStation,
  PrintAgent,
  PrintExecutionMode,
  PrintSettings,
} from '@/domain/print/Print'

export class PrintService {
  private readonly print: IPrintRepository

  constructor(print: IPrintRepository) {
    this.print = print
  }

  getSettings(businessId: string) {
    return this.print.getSettings(businessId)
  }

  updateSettings(businessId: string, payload: { printExecutionMode: PrintExecutionMode }) {
    return this.print.updateSettings(businessId, payload)
  }

  upsertPrinter(
    businessId: string,
    station: PrepStation,
    payload: Parameters<IPrintRepository['upsertPrinter']>[2],
  ) {
    return this.print.upsertPrinter(businessId, station, payload)
  }

  discover(businessId: string, cidr?: string) {
    return this.print.discover(businessId, cidr)
  }

  probe(businessId: string, station: PrepStation) {
    return this.print.probe(businessId, station)
  }

  testPrint(businessId: string, station: PrepStation) {
    return this.print.testPrint(businessId, station)
  }

  generateAgentPairingCode(businessId: string) {
    return this.print.generateAgentPairingCode(businessId)
  }

  listAgents(businessId: string) {
    return this.print.listAgents(businessId)
  }
}

export type {
  PrintSettings,
  DiscoveredPrinter,
  PrepStation,
  PrintExecutionMode,
  PrintAgent,
  AgentPrinter,
  PairingCodeResult,
}
