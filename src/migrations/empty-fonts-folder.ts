import { errorCatcher } from 'src/helpers/error-catcher';

import type { MigrationFunction } from './types';

export const emptyFontsFolder: MigrationFunction = async () => {
  try {
    const { fs, getSharedDataPath, getUserDataPath, join } =
      globalThis.electronApi;
    const { emptyDir, exists } = fs;

    const userDataPath = await getUserDataPath();
    const sharedDataPath = await getSharedDataPath();

    const pathsToCheck = [userDataPath, sharedDataPath].filter(
      (value): value is string => !!value,
    );

    for (const basePath of new Set(pathsToCheck)) {
      const fontsPath = join(basePath, 'Fonts');
      if (!(await exists(fontsPath))) continue;
      await emptyDir(fontsPath);
    }

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
