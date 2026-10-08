import type { DateInfo } from 'src/types';

import { tmpdir } from 'node:os';
import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { formatDate } from 'src/utils/date';
import { registerCachePathProvider } from 'src/utils/fs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { join } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// copySpy is created before export-media loads, since the module grabs
// fs.copy once at import time. It calls through unless a test overrides it.
const { copySpy, createTemporaryNotificationMock, errorCatcherMock } =
  vi.hoisted(() => ({
    copySpy: vi.spyOn(globalThis.electronApi.fs, 'copy'),
    createTemporaryNotificationMock: vi.fn(),
    errorCatcherMock: vi.fn(),
  }));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: createTemporaryNotificationMock,
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

import { addDayToExportQueue, pendingDays } from '../export-media';

registerCachePathProvider(() => undefined);

const CONGREGATION_ID = 'test-cong';

// addDayToExportQueue() enqueues fire-and-forget work on a module-level
// PQueue (shared across tests, since it isn't reset between them) and
// returns as soon as the task is queued, not once it's done - poll
// pendingDays (cleared in the queued task's own `finally`) instead of a
// fixed setTimeout, which under full-suite load was too short and let one
// test's assertion run before its export actually finished.
const waitForExportToSettle = async (dateStr: string, maxAttempts = 100) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (!pendingDays.has(dateStr)) return;
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
  throw new Error('waitForExportToSettle: export never finished');
};

const setupCongregationDay = (targetDate: Date) => {
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;
  // The default electronApi mock's createVideoFromNonVideo always throws
  // "Function not implemented." - exactly the genuine-failure path these
  // tests exercise. Setting ffmpegPath directly skips setupFFmpeg()'s real
  // network/download logic entirely.
  currentState.ffmpegPath = '/fake/ffmpeg';

  const jwStore = useJwStore();
  jwStore.lookupPeriod[CONGREGATION_ID] = [
    {
      date: targetDate,
      mediaSections: [
        {
          config: { uniqueId: 'test-section' },
          items: [
            {
              fileUrl: import.meta.url,
              title: 'Test Item',
              type: 'media',
              uniqueId: 'item-1',
            },
          ],
        },
      ],
      status: 'complete',
    } as unknown as DateInfo,
  ];
};

// FE-9 (full-audit-2026-09-04.md): a genuine ffmpeg conversion failure
// during auto-export previously only went to errorCatcher (Sentry/log) -
// the user found out only by later noticing the file missing from the
// export folder.
describe('export-media conversion failure notification', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows one grouped notification when a conversion genuinely fails during export', async () => {
    const targetDate = new Date('2026-08-17T00:00:00');
    setupCongregationDay(targetDate);

    const congregationSettings = useCongregationSettingsStore();
    congregationSettings.congregations[CONGREGATION_ID] = {
      ...defaultSettings,
      convertFilesToMp4: true,
      enableMediaAutoExport: true,
      mediaAutoExportFolder: 'C:/export-test',
    };

    await addDayToExportQueue(targetDate);
    await waitForExportToSettle(formatDate(targetDate, 'YYYY-MM-DD'));

    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' }),
    );
  });

  it('does not notify when file conversion is disabled (nothing to convert)', async () => {
    const targetDate = new Date('2026-08-18T00:00:00');
    setupCongregationDay(targetDate);

    const congregationSettings = useCongregationSettingsStore();
    congregationSettings.congregations[CONGREGATION_ID] = {
      ...defaultSettings,
      convertFilesToMp4: false,
      enableMediaAutoExport: true,
      mediaAutoExportFolder: 'C:/export-test',
    };

    await addDayToExportQueue(targetDate);
    await waitForExportToSettle(formatDate(targetDate, 'YYYY-MM-DD'));

    expect(createTemporaryNotificationMock).not.toHaveBeenCalled();
  });
});

// MMM-V2-3KX: a cloud sync client briefly holding an already-exported file
// made copy() fail with UNKNOWN. The next export run retries it.
describe('export-media copy failures', () => {
  const unknownLstatError = () =>
    Object.assign(new Error("UNKNOWN: unknown error, lstat 'x.png'"), {
      code: 'UNKNOWN',
      syscall: 'lstat',
    });

  const exportDayTo = async (targetDate: Date, folder: string) => {
    setupCongregationDay(targetDate);
    const congregationSettings = useCongregationSettingsStore();
    congregationSettings.congregations[CONGREGATION_ID] = {
      ...defaultSettings,
      convertFilesToMp4: false,
      enableMediaAutoExport: true,
      mediaAutoExportFolder: folder,
    };

    await addDayToExportQueue(targetDate);
    await waitForExportToSettle(formatDate(targetDate, 'YYYY-MM-DD'));
  };

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not report a transient failure in a cloud-synced export folder', async () => {
    copySpy.mockRejectedValueOnce(unknownLstatError());

    await exportDayTo(
      new Date('2026-08-19T00:00:00'),
      join(tmpdir(), 'Nextcloud', 'm3-export-test'),
    );

    expect(copySpy).toHaveBeenCalledTimes(1);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('still reports the same failure in a local export folder, with context', async () => {
    copySpy.mockRejectedValueOnce(unknownLstatError());
    const folder = join(tmpdir(), 'm3-export-test');

    await exportDayTo(new Date('2026-08-20T00:00:00'), folder);

    expect(errorCatcherMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNKNOWN' }),
      {
        contexts: {
          fn: expect.objectContaining({
            destFolder: join(folder, '2026-08-20'),
            name: 'processSectionItems',
          }),
        },
      },
    );
  });
});
