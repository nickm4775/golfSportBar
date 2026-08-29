import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { CentrifugoPublisher } from './centrifugo.publisher';

describe('CentrifugoPublisher', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('logs JSON error payloads even when HTTP status is 200', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ error: { code: 102, message: 'unknown channel' } }),
    }) as unknown as typeof fetch;

    const publisher = new CentrifugoPublisher({
      get: (key: string) =>
        key === 'CENTRIFUGO_API_URL' ? 'http://centrifugo:8000/api' : 'test-key',
    } as ConfigService);

    await publisher.publish('business:x', { type: 'order.changed' });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Centrifugo publish error 102'),
    );
  });
});
