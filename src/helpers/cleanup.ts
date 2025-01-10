import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useJwStore } from 'src/stores/jw';
//import { getSpecificWeekday, isInPast } from 'src/utils/date';

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

// const cleanDateRecord = (record?: Partial<Record<string, unknown>>) => {
//   if (!record) return;
//   Object.keys(record).forEach((dateKey) => {
//     if (isInPast(getSpecificWeekday(dateKey, 6))) {
//       // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//       delete record[dateKey];
//     }
//   });
// };

export const cleanPersistedStores = () => {
  const jwStore = useJwStore();
  const congregationStore = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregationStore.congregations));

  // Cleanup old congregation records
  const congregationRecords: (keyof typeof jwStore.$state)[] = ['lookupPeriod'];
  congregationRecords.forEach((r) =>
    cleanCongregationRecord(jwStore[r], congIds),
  );
};
