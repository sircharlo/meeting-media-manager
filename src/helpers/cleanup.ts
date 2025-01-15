import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { getSpecificWeekday, isInPast } from 'src/utils/date';
import { getAdditionalMediaPath } from 'src/utils/fs';

const cleanCongregationRecord = (
  record: Partial<Record<string, unknown>>,
  congIds: Set<string>,
) => {
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
  const folders = await window.electronApi.fs.readdir(root);
  folders.forEach((f) => {
    if (!congIds.has(f)) {
      window.electronApi.fs.remove(window.electronApi.path.join(root, f));
    }
  });
};

const cleanPublicTalkPubs = async (folder: string, congIds: Set<string>) => {
  const files = await window.electronApi.fs.readdir(folder);
  files.forEach((f) => {
    if (!f.startsWith('S-34mp_')) return;
    const congIdOrLang = f.split('_')[1];
    if (!congIdOrLang?.includes('-') || congIds.has(congIdOrLang)) return;
    window.electronApi.fs.remove(window.electronApi.path.join(folder, f));
  });
};

const cleanDateFolders = async (root?: string) => {
  if (!root) return;

  const folders = await window.electronApi.fs.readdir(root);
  folders.forEach((f) => {
    if (isInPast(getSpecificWeekday(f, 6))) {
      window.electronApi.fs.remove(window.electronApi.path.join(root, f));
    }
  });
};

export const cleanCache = async () => {
  const congregationStore = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregationStore.congregations));

  const additionalMediaPath = await getAdditionalMediaPath(
    useCurrentStateStore().currentSettings?.cacheFolder,
  );

  cleanPublicTalkPubs(additionalMediaPath, congIds);
  cleanCongregationFolders(additionalMediaPath, congIds);

  congIds.forEach((congId) => {
    cleanDateFolders(window.electronApi.path.join(additionalMediaPath, congId));
  });
};
