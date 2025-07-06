import { errorCatcher } from 'src/helpers/error-catcher';
class ElectronApiManager {
  private initPromise: null | Promise<void> = null;
  private pageName: string | undefined;

  constructor(pageName: string | undefined) {
    this.pageName = pageName;
  }
  async ensureReady(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // @ts-expect-error Assuming window.electronApi is defined in the Electron context
      if (window.electronApi?.path?.join) {
        console.debug(
          `[${this.pageName}] Electron API was available immediately.`,
        );
        resolve();
        return;
      }

      let attempts = 2;
      const check = () => {
        // @ts-expect-error Assuming window.electronApi is defined in the Electron context
        if (window.electronApi?.path?.join) {
          console.debug(
            `[${this.pageName}] Electron API became available after ${attempts} attempts.`,
          );
          resolve();
        } else if (attempts++ > 100) {
          // 10 seconds
          reject(
            // new Error(
            //   `Electron API not available. Platform: ${navigator.platform}, UserAgent: ${navigator.userAgent}`,
            // ),
            errorCatcher(
              new Error(
                `[${this.pageName}] Electron API not available after 10 seconds.`,
              ),
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
    console.debug(`[${pageName}] About to wait for Electron API...`);
    await apiManager.ensureReady();
  } catch (error) {
    console.error(`[${pageName}] Error waiting for Electron API:`, error);
  }
}
