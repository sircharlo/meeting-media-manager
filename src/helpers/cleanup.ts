import { getSpecificWeekday, isInPast } from 'src/utils/date';
import { congPreferencesPath, getAdditionalMediaPath } from 'src/utils/fs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

const { fs, path } = window.electronApi;
const { exists, readdir, remove } = fs;
const { join } = path;

const cleanCongregationRecord = (
  record: Partial<Record<string, unknown>>,
  congIds: Set<string>,
) => {
  if (!record || !congIds) return;
  Object.keys(record).forEach((congId) => {
    if (!congIds.has(congId)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete record[congId];
    }
  });
};

export const cleanPersistedStores = () => {
  const congregationStore = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregationStore.congregations));

  // Cleanup old congregation records
  const jwStore = useJwStore();
  const congregationRecords: (keyof typeof jwStore.$state)[] = ['lookupPeriod'];
  congregationRecords.forEach((r) =>
    cleanCongregationRecord(jwStore[r], congIds),
  );
};

const cleanCongregationFolders = async (root: string, congIds: Set<string>) => {
  if (!root || !congIds || !(await exists(root))) return;
  const folders = await readdir(root);
  await Promise.allSettled(
    folders.filter((f) => !congIds.has(f)).map((f) => remove(join(root, f))),
  );
};

const cleanPublicTalkPubs = async (folder: string, congIds: Set<string>) => {
  if (!folder || !congIds || !(await exists(folder))) return;
  const files = await readdir(folder);

  await Promise.allSettled(
    files
      .filter((f) => f.startsWith('S-34mp_'))
      .map((f) => {
        const congIdOrLang = f.split('_')[1];
        if (!congIdOrLang?.includes('-') || congIds.has(congIdOrLang))
          return Promise.resolve();
        return remove(join(folder, f));
      }),
  );
};

const cleanDateFolders = async (root?: string) => {
  if (!root || !(await exists(root))) return;

  const folders = await readdir(root);

  await Promise.allSettled(
    folders
      .filter((f) => !f.includes('.jwlplaylist'))
      .filter((f) => isInPast(getSpecificWeekday(f, 6)))
      .map((f) => remove(join(root, f))),
  );
};

export const cleanCache = async () => {
  const congregationStore = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregationStore.congregations));

  const settings = useCurrentStateStore().currentSettings;

  const additionalMediaPath = await getAdditionalMediaPath(
    settings?.cacheFolder,
  );

  cleanPublicTalkPubs(additionalMediaPath, congIds);
  cleanCongregationFolders(additionalMediaPath, congIds);
  cleanCongregationFolders(await congPreferencesPath(), congIds);

  congIds.forEach((congId) => {
    cleanDateFolders(join(additionalMediaPath, congId));
  });

  if (settings?.enableMediaAutoExport && settings?.mediaAutoExportFolder) {
    cleanDateFolders(settings.mediaAutoExportFolder);
  }
};
