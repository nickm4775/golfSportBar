import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CentrifugoPublisher {
  private readonly logger = new Logger(CentrifugoPublisher.name);
  private readonly apiUrl: string | null;
  private readonly apiKey: string | null;

  constructor(config: ConfigService) {
    this.apiUrl = config.get<string>('CENTRIFUGO_API_URL')?.replace(/\/$/, '') || null;
    this.apiKey = config.get<string>('CENTRIFUGO_API_KEY')?.trim() || null;
    if (!this.apiUrl || !this.apiKey) {
      this.logger.warn('Centrifugo API no configurada — publish desactivado');
    }
  }

  async publish(channel: string, data: unknown) {
    if (!this.apiUrl || !this.apiKey) return;
    try {
      const response = await fetch(`${this.apiUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({ channel, data }),
      });
      const body = await response.text();
      if (!response.ok) {
        this.logger.warn(`Centrifugo publish ${response.status}: ${body.slice(0, 200)}`);
        return;
      }
      const error = parseCentrifugoError(body);
      if (error) {
        this.logger.warn(
          `Centrifugo publish error ${error.code}: ${error.message} (${channel})`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Centrifugo publish failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}

function parseCentrifugoError(body: string): { code: number | string; message: string } | null {
  if (!body.trim()) return null;
  try {
    const json = JSON.parse(body) as {
      error?: { code?: number | string; message?: string };
    };
    if (!json.error) return null;
    return {
      code: json.error.code ?? 'unknown',
      message: json.error.message ?? 'unknown',
    };
  } catch {
    return null;
  }
}
