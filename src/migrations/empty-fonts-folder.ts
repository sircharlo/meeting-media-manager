import { errorCatcher } from 'src/helpers/error-catcher';

import type { MigrationFunction } from './types';

export const emptyFontsFolder: MigrationFunction = async () => {
  try {
    const { fs, getSharedDataPath, getUserDataPath, join } =
      globalThis.electronApi;
    const { emptyDir, pathExists } = fs;

    const userDataPath = await getUserDataPath();
    const sharedDataPath = await getSharedDataPath();

    const pathsToCheck = [userDataPath, sharedDataPath].filter(
      (value): value is string => !!value,
    );

    const emptyFontsDir = async (basePath: string) => {
      const fontsPath = join(basePath, 'Fonts');
      if (!(await pathExists(fontsPath))) return;
      await emptyDir(fontsPath);
    };

    await Promise.all([...new Set(pathsToCheck)].map(emptyFontsDir));

    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'emptyFontsFolder',
        },
      },
    });
    return false;
  }
};
