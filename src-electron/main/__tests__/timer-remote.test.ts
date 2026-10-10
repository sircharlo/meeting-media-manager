import { getHttpServer } from 'app/test/vitest/mocks/http';
import { http, passthrough } from 'msw';
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src-electron/main/utils', () => ({ captureElectronError: vi.fn() }));

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });

const get = async (port: number, path: string) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  return { body: await response.text(), response };
};

/** Reads server-sent events until one carries JSON data. */
const readFirstEvent = async (port: number, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/events`, {
      signal: controller.signal,
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body');
    let buffer = '';
    const decoder = new TextDecoder();
    while (!buffer.includes('data: ')) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
    }
    const line = buffer.split('\n').find((l) => l.startsWith('data: '));
    return line ? (JSON.parse(line.slice(6)) as Record<string, unknown>) : null;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
};

// The tests talk to the real local server: let MSW pass those requests on.
beforeEach(() => {
  getHttpServer()?.use(
    http.all(/^http:\/\/127\.0\.0\.1:/, () => passthrough()),
  );
});

afterEach(async () => {
  const { stopTimerRemote } = await import('../timer-remote');
  stopTimerRemote();
});

describe('timer remote', () => {
  it('refuses ports outside the unprivileged range', async () => {
    const { isValidTimerRemotePort, startTimerRemote } =
      await import('../timer-remote');
    expect(isValidTimerRemotePort(80)).toBe(false);
    expect(isValidTimerRemotePort(8787)).toBe(true);
    expect(isValidTimerRemotePort('8787')).toBe(false);
    expect(isValidTimerRemotePort(70_000)).toBe(false);
    expect(await startTimerRemote(80)).toEqual({
      error: 'invalid-port',
      running: false,
      urls: [],
    });
  });

  it('serves the page, its assets and a live event stream', async () => {
    const { setTimerRemoteText, startTimerRemote, updateTimerRemote } =
      await import('../timer-remote');
    const port = await freePort();
    setTimerRemoteText({
      lang: 'fr',
      meetingStartsIn: 'La réunion commence dans',
    });

    const status = await startTimerRemote(port);
    expect(status.running).toBe(true);

    const page = await get(port, '/');
    expect(page.response.status).toBe(200);
    expect(page.response.headers.get('content-type')).toContain('text/html');
    expect(page.response.headers.get('content-security-policy')).toContain(
      "script-src 'self'",
    );
    expect(page.body).toContain('lang="fr"');
    expect(page.body).toContain('La réunion commence dans');
    expect(page.body).toContain('/app.js');

    expect((await get(port, '/app.js')).response.status).toBe(200);
    expect((await get(port, '/app.css')).response.status).toBe(200);
    expect((await get(port, '/nope')).response.status).toBe(404);

    updateTimerRemote({
      mode: 'countdown',
      paused: false,
      running: true,
      time: '04:59',
      timerCurrentPartLabel: 'Public Talk',
    });
    // A page connecting later still gets the latest state straight away.
    const event = await readFirstEvent(port);
    expect(event).toMatchObject({ running: true, time: '04:59' });
  });

  it('reports a port already in use', async () => {
    const { startTimerRemote } = await import('../timer-remote');
    const port = await freePort();
    const blocker = createServer();
    await new Promise<void>((resolve) => {
      blocker.listen(port, resolve);
    });
    try {
      expect(await startTimerRemote(port)).toEqual({
        error: 'port-in-use',
        running: false,
        urls: [],
      });
    } finally {
      await new Promise<void>((resolve) => {
        blocker.close(() => resolve());
      });
    }
  });

  it('stops serving and forgets the last state', async () => {
    const { startTimerRemote, stopTimerRemote, updateTimerRemote } =
      await import('../timer-remote');
    const port = await freePort();
    await startTimerRemote(port);
    updateTimerRemote({
      mode: 'countup',
      paused: false,
      running: false,
      time: '',
    });
    stopTimerRemote();
    await expect(fetch(`http://127.0.0.1:${port}/`)).rejects.toThrow();
  });
});
