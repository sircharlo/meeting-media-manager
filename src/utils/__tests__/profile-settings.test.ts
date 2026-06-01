import { defaultSettings } from 'src/constants/settings';
import { exportProfileSettingsToFile } from 'src/utils/profile-settings';
import { describe, expect, it, vi } from 'vitest';

const exportSettings = {
  ...defaultSettings,
  congregationName: '  Main Hall / Downtown  ',
};

describe('profile settings utilities', () => {
  it('sanitizes the exported filename without regex backtracking risks', async () => {
    const saveFileDialog = vi
      .spyOn(globalThis.electronApi, 'saveFileDialog')
      .mockResolvedValue({
        canceled: true,
        filePath: '',
      });

    await expect(exportProfileSettingsToFile(exportSettings)).resolves.toBe(
      false,
    );

    expect(saveFileDialog).toHaveBeenCalledWith(
      'main-hall-downtown-profile-settings.json',
      'json',
    );
  });

  it('ignores untrusted leading and trailing separators in linear time', async () => {
    const saveFileDialog = vi
      .spyOn(globalThis.electronApi, 'saveFileDialog')
      .mockResolvedValue({
        canceled: true,
        filePath: '',
      });

    await expect(
      exportProfileSettingsToFile({
        ...exportSettings,
        congregationName: `${'-'.repeat(10_000)}A${'!'.repeat(10_000)}`,
      }),
    ).resolves.toBe(false);

    expect(saveFileDialog).toHaveBeenCalledWith(
      'a-profile-settings.json',
      'json',
    );
  });
});
