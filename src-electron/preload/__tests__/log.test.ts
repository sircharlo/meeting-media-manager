import { captureException } from '@sentry/electron/renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { capturePreloadError } from '../log';

vi.mock('@sentry/electron/renderer', () => ({
  captureException: vi.fn(),
}));

// The electron test setup mocks src-electron/preload/log (so tests of other
// preload modules don't hit Sentry); restore the real implementation here so
// capturePreloadError itself is what's under test.
vi.mock('src-electron/preload/log', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return { ...mod };
});

describe('capturePreloadError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports an error without a cause once', () => {
    const error = new Error('outer only');

    capturePreloadError(error);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error, undefined);
  });

  it('reports only the cause when an error wraps another error', () => {
    const cause = new Error('the actual failure');
    const outer = new Error('wrapper', { cause });

    capturePreloadError(outer);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(cause, undefined);
  });

  it('recurses through nested causes without reporting any wrapper', () => {
    const root = new Error('root cause');
    const middle = new Error('middle', { cause: root });
    const outer = new Error('outer', { cause: middle });

    capturePreloadError(outer);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(root, undefined);
  });

  it('passes the context through to the reported cause', () => {
    const cause = new Error('the actual failure');
    const outer = new Error('wrapper', { cause });
    const context = { contexts: { fn: { name: 'somePreloadFn' } } };

    capturePreloadError(outer, context);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(cause, context);
  });

  it('drops raw DOM events', () => {
    capturePreloadError(new Event('error'));

    expect(captureException).not.toHaveBeenCalled();
  });

  it('drops an event used as a cause', () => {
    const outer = new Error('wrapper', { cause: new Event('error') });

    capturePreloadError(outer);

    expect(captureException).not.toHaveBeenCalled();
  });
});
