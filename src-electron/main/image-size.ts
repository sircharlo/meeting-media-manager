import { imageSizeFromFile } from '@carboneio/image-size/fromFile';
import { captureElectronError } from 'src-electron/main/utils';

// Image dimensions are read with `@carboneio/image-size`, a maintained fork
// that fixed `image-size`'s ICNS/JXL/HEIF infinite-loop DoS advisories
// (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq) plus several further
// out-of-bounds-read and quadratic-scan issues found during its own security
// audit (see its CHANGELOG) - the same advisories that previously had no
// fixed release and made this module isolate parsing in a disposable
// `utilityProcess` per call.
//
// `imageSizeFromFile` reads at most 512KB of the file (the header, never the
// whole image) and queues its own file reads behind an internal concurrency
// limit, so a hung/hostile parse can no longer be walled off from the rest
// of the app the way a killable child process could. In exchange, this
// drops the failure mode that actually produced Sentry MMM-V2-3J6..3JA: any
// single timeout nulled out the shared child, so the *next* call had to pay
// a fresh `utilityProcess.fork()` cold start before it could even open its
// file - and on a memory-starved machine that fork latency itself grew past
// the fixed 8s budget, cascading into repeated timeouts. Calling the parser
// in-process removes that recovery cost entirely.
const IMAGE_SIZE_TIMEOUT_MS = 8000;

export interface ImageSizeResult {
  height?: number;
  orientation?: number;
  width?: number;
}

// `imageSizeFromFile` has no built-in timeout, so a stalled read (a network
// drive, a cloud-storage placeholder file that hasn't downloaded yet) would
// otherwise hang the caller forever. This only guards ordinary slow I/O,
// unlike the old per-call child process, since a genuinely hung synchronous
// parse would still block this process's event loop no matter how the
// promise around it is raced.
const withTimeout = <T>(promise: Promise<T>, filePath: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Timed out reading image dimensions after ${IMAGE_SIZE_TIMEOUT_MS}ms: ${filePath}`,
        ),
      );
    }, IMAGE_SIZE_TIMEOUT_MS);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });

/**
 * Reads an image's dimensions/orientation, throwing (never hanging) on a
 * parse failure or a timeout.
 * @param filePath The image file to read
 */
export const getImageDimensions = async (
  filePath: string,
): Promise<ImageSizeResult> => {
  try {
    const { height, orientation, width } = await withTimeout(
      imageSizeFromFile(filePath),
      filePath,
    );
    return { height, orientation, width };
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { filePath, name: 'getImageDimensions' } },
    });
    throw e;
  }
};
