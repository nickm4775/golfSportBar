import { apiRequest } from '@/infrastructure/http/apiClient'
import type {
  DiscoveredPrinter,
  IPrintRepository,
  PrepStation,
  PrintExecutionMode,
  PrintSettings,
  PrinterConnectionStatus,
} from '@/domain/print/Print'

export class HttpPrintRepository implements IPrintRepository {
  getSettings(businessId: string) {
    return apiRequest<PrintSettings>(`/businesses/${businessId}/settings/print`, { businessId })
  }

  updateSettings(businessId: string, payload: { printExecutionMode: PrintExecutionMode }) {
    return apiRequest<PrintSettings>(`/businesses/${businessId}/settings/print`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }

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
  ) {
    return apiRequest<PrintSettings>(
      `/businesses/${businessId}/settings/print/printers/${station}`,
      {
        method: 'PATCH',
        businessId,
        body: JSON.stringify(payload),
      },
    )
  }

  discover(businessId: string, cidr?: string) {
    return apiRequest<{ printers: DiscoveredPrinter[]; mode: PrintExecutionMode }>(
      `/businesses/${businessId}/settings/print/discover`,
      {
        method: 'POST',
        businessId,
        body: JSON.stringify(cidr ? { cidr } : {}),
      },
    )
  }

  probe(businessId: string, station: PrepStation) {
    return apiRequest<{
      station: PrepStation
      status: PrinterConnectionStatus
      latencyMs?: number
      error?: string
    }>(`/businesses/${businessId}/settings/print/printers/${station}/probe`, {
      method: 'POST',
      businessId,
    })
  }

  testPrint(businessId: string, station: PrepStation) {
    return apiRequest(`/businesses/${businessId}/settings/print/printers/${station}/test`, {
      method: 'POST',
      businessId,
    })
  }
}
