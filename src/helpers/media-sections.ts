import { standardSections } from 'src/constants/media';
import { useCurrentStateStore } from 'src/stores/current-state';

export const deleteSection = (uniqueId: string) => {
  const { selectedDateObject } = useCurrentStateStore();
  selectedDateObject?.customSections?.splice(
    selectedDateObject?.customSections.findIndex(
      (s) => s.uniqueId === uniqueId,
    ),
    1,
  );
};

export const isStandardSection = (section: string) => {
  if (!section) return false;
  return standardSections.includes(section);
};
