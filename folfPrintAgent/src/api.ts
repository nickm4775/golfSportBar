import axios, { AxiosInstance } from 'axios';
import type { LocalPrinter } from './store';
import type { TicketPayload } from './escpos';

function apiErrorMessage(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg) && msg.length) return new Error(msg.join(', '));
    if (typeof msg === 'string' && msg.trim()) return new Error(msg);
    return new Error(error.message);
  }
  return error instanceof Error ? error : new Error(String(error));
}

export type PairResult = {
  agent: { id: string };
  agentToken: string;
  businessId: string;
  channel: string;
};

export type RemotePrinter = {
  id: string;
  name: string;
  connectionType: LocalPrinter['connectionType'];
  address: string;
  paperWidth: number;
  isOnline: boolean;
};

export type PrintJob = {
  id: string;
  printerId?: string | null;
  payload?: TicketPayload;
  status?: string;
  attempts?: number;
  station?: string;
};

export type HeartbeatResult = {
  agent?: { id: string };
  printers?: RemotePrinter[];
  pendingJobs?: PrintJob[];
};

export class PrintApiClient {
  private http: AxiosInstance;

  constructor(private apiBaseUrl: string, private agentToken: string | null = null) {
    this.http = this.buildHttp();
  }

  private buildHttp() {
    return axios.create({
      baseURL: this.apiBaseUrl.replace(/\/$/, ''),
      timeout: 15000,
      headers: this.agentToken
        ? { Authorization: `Bearer ${this.agentToken}` }
        : undefined,
    });
  }

  setConfig(apiBaseUrl: string, agentToken: string | null) {
    this.apiBaseUrl = apiBaseUrl;
    this.agentToken = agentToken;
    this.http = this.buildHttp();
  }

  async pair(input: {
    code: string;
    deviceId: string;
    deviceName: string;
    platform: string;
  }): Promise<PairResult> {
    try {
      const { data } = await this.http.post<PairResult>('/api/v1/print/agents/pair', input);
      return data;
    } catch (error) {
      throw apiErrorMessage(error);
    }
  }

  async heartbeat(agentId: string, printers: LocalPrinter[]): Promise<HeartbeatResult> {
    const { data } = await this.http.post('/api/v1/print/agents/heartbeat', {
      agentId,
      status: 'online',
      printers: printers.map((p) => ({
        name: p.name,
        connectionType: p.connectionType,
        address: p.address,
        paperWidth: p.paperWidth,
        isOnline: p.isOnline,
      })),
    });
    return data as HeartbeatResult;
  }

  async pendingJobs(businessId: string, agentId: string): Promise<PrintJob[]> {
    const { data } = await this.http.get('/api/v1/print/jobs/pending', {
      params: { businessId, agentId },
    });
    return (Array.isArray(data) ? data : []) as PrintJob[];
  }

  async ackJob(jobId: string, status: 'printed' | 'failed', agentId: string, error?: string) {
    await this.http.post(`/api/v1/print/jobs/${jobId}/ack`, {
      status,
      agentId,
      ...(error ? { error } : {}),
    });
  }
}
