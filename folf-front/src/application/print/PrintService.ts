import type {
  DiscoveredPrinter,
  IPrintRepository,
  PrepStation,
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
}

export type { PrintSettings, DiscoveredPrinter, PrepStation, PrintExecutionMode }
