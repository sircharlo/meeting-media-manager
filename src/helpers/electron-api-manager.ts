import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
class ElectronApiManager {
  private initPromise: null | Promise<void> = null;
  private readonly pageName: string | undefined;

  constructor(pageName: string | undefined) {
    this.pageName = pageName;
  }
  async ensureReady(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // @ts-expect-error Assuming globalThis.electronApi is defined in the Electron context
      if (globalThis.electronApi?.path?.join) {
        log(
          `[${this.pageName}] Electron API was available immediately.`,
          'electron',
          'debug',
        );
        resolve();
        return;
      }

      let attempts = 2;
      const check = () => {
        // @ts-expect-error Assuming globalThis.electronApi is defined in the Electron context
        if (globalThis.electronApi?.path?.join) {
          log(
            `[${this.pageName}] Electron API became available after ${attempts} attempts.`,
            'electron',
            'debug',
          );
          resolve();
        } else if (attempts++ > 100) {
          // 10 seconds
          reject(
            new Error(
              `[${this.pageName}] Electron API not available after 10 seconds.`,
            ),
          );
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });

    return this.initPromise;
  }
}

export async function initializeElectronApi(pageName: string) {
  try {
    const apiManager = new ElectronApiManager(pageName);
    log(`[${pageName}] About to wait for Electron API...`, 'electron', 'debug');
    await apiManager.ensureReady();
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            pageName,
          },
          name: 'initializeElectronApi',
        },
      },
    });
  }
}
