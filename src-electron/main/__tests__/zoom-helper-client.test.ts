import { describe, expect, it, vi } from 'vitest';

import {
  isZoomCommand,
  runZoomCommand,
  ZOOM_HELPER_TOKEN_HEADER,
} from '../zoom-helper-client';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });

describe('isZoomCommand', () => {
  it('accepts known commands and rejects anything else', () => {
    expect(isZoomCommand({ type: 'meeting' })).toBe(true);
    expect(isZoomCommand({ allowSelfUnmute: true, type: 'mute-all' })).toBe(
      true,
    );
    expect(isZoomCommand({ type: 'format-c-drive' })).toBe(false);
    expect(isZoomCommand({ type: 'toString' })).toBe(false);
    expect(isZoomCommand('meeting')).toBe(false);
    expect(isZoomCommand(null)).toBe(false);
  });
});

describe('runZoomCommand', () => {
  const connection = (fetchMock: typeof fetch) => ({
    baseUrl: 'http://127.0.0.1:5000',
    fetch: fetchMock,
    token: 'secret',
  });

  it('sends POST commands as JSON, with the helper token', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ changed: true, ok: true }),
    );

    const result = await runZoomCommand(connection(fetchMock), {
      allowSelfUnmute: false,
      type: 'mute-all',
    });

    expect(result).toEqual({ changed: true, ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/participants/mute-all',
      {
        body: JSON.stringify({ allowSelfUnmute: false }),
        headers: {
          'Content-Type': 'application/json',
          [ZOOM_HELPER_TOKEN_HEADER]: 'secret',
        },
        method: 'POST',
      },
    );
  });

  it('sends GET commands without a body', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ meeting: { found: false, sharing: false }, ok: true }),
    );

    await runZoomCommand(connection(fetchMock), { type: 'meeting' });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:5000/meeting', {
      headers: { [ZOOM_HELPER_TOKEN_HEADER]: 'secret' },
      method: 'GET',
    });
  });

  it('turns a non-JSON or malformed answer into a failed result', async () => {
    const fetchMock = vi.fn(
      async () => new Response('Internal Server Error', { status: 500 }),
    );

    expect(
      await runZoomCommand(connection(fetchMock), { type: 'stop-share' }),
    ).toEqual({ error: 'http-500', ok: false });
  });

  it("passes through the helper's own failure reason", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: 'unauthorized', ok: false }, 401),
    );

    expect(
      await runZoomCommand(connection(fetchMock), { type: 'join-audio' }),
    ).toEqual({ error: 'unauthorized', ok: false });
  });
});
