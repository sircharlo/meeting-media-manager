import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ utilityProcess: { fork: vi.fn() } }));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

import { workerSource } from '../image-size';

// Behavior contract for the dimension-reader worker: real fixture files in,
// `{ width, height, orientation? }` out (or a posted error for unrecognized
// input). These expectations were recorded against `image-size` and verified
// unchanged against its `probe-image-size` replacement - only the specifier
// below changes with the implementation; everything under it is the pinned
// contract. See `../image-size.ts` for the worker source under test.
const LIB_SPEC = 'probe-image-size/sync';

interface ValidFixture {
  base64: string;
  expected: {
    height: number;
    orientation?: number;
    width: number;
  };
}

interface WorkerResponse {
  error?: { message: string };
  id: number;
  result?: {
    height?: number;
    orientation?: number;
    width?: number;
  };
}

// Minimal valid files (generated once via sharp, except the hand-built BMP
// and SVG), plus the edge cases callers depend on: EXIF orientation is
// reported pre-transform (ffmpeg.ts swaps dimensions itself for
// orientation >= 5), and unrecognized input rejects instead of hanging.
const VALID_FIXTURES: Record<string, ValidFixture> = {
  'bmp-4x4.bmp': {
    base64:
      'Qk1mAAAAAAAAADYAAAAoAAAABAAAAAQAAAABABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA',
    expected: { height: 4, width: 4 },
  },
  'gif-2x9.gif': {
    base64: 'R0lGODlhAgAJAIAAAExpcQkJCSH5BAUAAAAALAAAAAACAAkAAAIEjI95BQA7',
    expected: { height: 9, width: 2 },
  },
  'jpg-7x4-exif6.jpg': {
    base64:
      '/9j/4QC8RXhpZgAASUkqAAgAAAAGABIBAwABAAAABgAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAZgAAAAAAAAA4YwAA6AMAADhjAADoAwAABgAAkAcABAAAADAyMTABkQcABAAAAAECAwAAoAcABAAAADAxMDABoAMAAQAAAP//AAACoAQAAQAAAAcAAAADoAQAAQAAAAQAAAAAAAAA/+IB8ElDQ19QUk9GSUxFAAEBAAAB4GxjbXMEIAAAbW50clJHQiBYWVogB+IAAwAUAAkADgAdYWNzcE1TRlQAAAAAc2F3c2N0cmwAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1oYW5keem/Vlo+AbaDI4VVRvdPqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKZGVzYwAAAPwAAAAkY3BydAAAASAAAAAid3RwdAAAAUQAAAAUY2hhZAAAAVgAAAAsclhZWgAAAYQAAAAUZ1hZWgAAAZgAAAAUYlhZWgAAAawAAAAUclRSQwAAAcAAAAAgZ1RSQwAAAcAAAAAgYlRSQwAAAcAAAAAgbWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABzAFIARwBCbWx1YwAAAAAAAAABAAAADGVuVVMAAAAGAAAAHABDAEMAMAAAWFlaIAAAAAAAAPbWAAEAAAAA0y1zZjMyAAAAAAABDD8AAAXd///zJgAAB5AAAP2S///7of///aIAAAPcAADAcVhZWiAAAAAAAABvoAAAOPIAAAOPWFlaIAAAAAAAAGKWAAC3iQAAGNpYWVogAAAAAAAAJKAAAA+FAAC2xHBhcmEAAAAAAAMAAAACZmkAAPKnAAANWQAAE9AAAApb/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgABAAHAwEiAAIRAQMRAf/EABUAAQEAAAAAAAAAAAAAAAAAAAAE/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/EABUBAQEAAAAAAAAAAAAAAAAAAAcI/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AkAB6kH//2Q==',
    expected: { height: 4, orientation: 6, width: 7 },
  },
  'jpg-7x4-q90.jpg': {
    base64:
      '/9j/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAEAAcDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABwj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCQAHqQf//Z',
    expected: { height: 4, width: 7 },
  },
  'png-3x5.png': {
    base64:
      'iVBORw0KGgoAAAANSUhEUgAAAAMAAAAFCAIAAAAPE8H1AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWPgEpGDIAYiWQBW6gOFZcmsMgAAAABJRU5ErkJggg==',
    expected: { height: 5, width: 3 },
  },
  'svg-11x12.svg': {
    base64:
      'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMSIgaGVpZ2h0PSIxMiI+PHJlY3Qgd2lkdGg9IjExIiBoZWlnaHQ9IjEyIi8+PC9zdmc+',
    expected: { height: 12, width: 11 },
  },
  'tiff-8x3.tiff': {
    base64:
      'SUkqADQAAAD/2P/AABEIAAMACAMBIgACEQEDEQH/2gAMAwEAAhEDEQA/APluiiigD//ZABEAAAEDAAEAAAAIAAAAAQEDAAEAAAADAAAAAgEDAAMAAAAWAQAAAwEDAAEAAAAHAAAABgEDAAEAAAAGAAAAEQEEAAEAAAAIAAAAEgEDAAEAAAABAAAAFQEDAAEAAAADAAAAFgEDAAEAAAAAAQAAFwEEAAEAAAArAAAAGgEFAAEAAAAGAQAAGwEFAAEAAAAOAQAAHAEDAAEAAAABAAAAKAEDAAEAAAACAAAAUwEDAAMAAAAcAQAAWwEHAD4CAABSAQAAFAIFAAYAAAAiAQAAAAAAADMzywAAAAgAMzPLAAAACAAIAAgACAABAAEAAQAAAAAAAQAAAP8AAAABAAAAgAAAAAEAAAD/AAAAAQAAAIAAAAABAAAA/wAAAAEAAAD/2P/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/Z',
    expected: { height: 3, width: 8 },
  },
  'webp-6x2.webp': {
    base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoGAAIAAUAmJaQAA3AA/v0gUAA=',
    expected: { height: 2, width: 6 },
  },
};

// Bytes no image parser recognizes: the worker must post an error (which the
// main-process side rejects with) rather than hanging or resolving garbage.
const ERROR_FIXTURES: Record<string, string> = {
  'garbage.bin': 'AAECAwQFBgcICQ==',
};

const runRealWorkerOnce = async (filePath: string): Promise<WorkerResponse> => {
  const posted: WorkerResponse[] = [];
  // Container (not a bare `let`): assignments made inside the sandbox's `on`
  // callback are invisible to control-flow analysis, so a plain variable
  // would narrow to its `null` initializer here and the call below wouldn't
  // type-check. Property reads reset narrowing after the `vm` call above.
  const subscription: {
    handler: ((message: { filePath: string; id: number }) => unknown) | null;
  } = { handler: null };
  const sandbox = {
    process: {
      // Mirrors a real fork: [execPath, scriptPath, libPath] - the worker
      // requires its parsing library from argv[2].
      argv: [
        process.execPath,
        'image-size-worker.cjs',
        createRequire(import.meta.url).resolve(LIB_SPEC),
      ],
      parentPort: {
        on: (
          event: string,
          callback: (message: { filePath: string; id: number }) => unknown,
        ) => {
          if (event === 'message') subscription.handler = callback;
        },
        postMessage: (message: WorkerResponse) => {
          posted.push(message);
        },
      },
    },
    require: createRequire(import.meta.url),
  };
  vm.createContext(sandbox);
  vm.runInContext(workerSource, sandbox);
  const activeHandler = subscription.handler;
  if (!activeHandler) throw new Error('worker did not subscribe to messages');
  await activeHandler({ filePath, id: 1 });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
  expect(posted).toHaveLength(1);
  const response = posted[0];
  if (!response) throw new Error('worker posted no response');
  return response;
};

describe('image worker behavior contract', () => {
  it.each(Object.entries(VALID_FIXTURES))(
    'reads %s with identical dimensions',
    async (fileName, fixture) => {
      const dir = mkdtempSync(join(tmpdir(), 'mmm-imgdim-contract-'));
      try {
        const filePath = join(dir, fileName);
        writeFileSync(filePath, Buffer.from(fixture.base64, 'base64'));
        const response = await runRealWorkerOnce(filePath);
        expect(response.error).toBeUndefined();
        expect(response.result).toMatchObject(fixture.expected);
      } finally {
        rmSync(dir, { force: true, recursive: true });
      }
    },
  );
  it.each(Object.entries(ERROR_FIXTURES))(
    'reports an error for unrecognized %s instead of hanging',
    async (fileName, base64) => {
      const dir = mkdtempSync(join(tmpdir(), 'mmm-imgdim-contract-'));
      try {
        const filePath = join(dir, fileName);
        writeFileSync(filePath, Buffer.from(base64, 'base64'));
        const response = await runRealWorkerOnce(filePath);
        expect(response.result).toBeUndefined();
        expect(response.error?.message).toBeTruthy();
      } finally {
        rmSync(dir, { force: true, recursive: true });
      }
    },
  );
});
