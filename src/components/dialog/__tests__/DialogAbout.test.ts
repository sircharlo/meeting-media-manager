import type * as FsUtils from 'src/utils/fs';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it, vi } from 'vitest';

import DialogAbout from '../DialogAbout.vue';

const { fetchReleaseNotesMock } = vi.hoisted(() => ({
  fetchReleaseNotesMock: vi.fn<() => Promise<string>>(),
}));

vi.mock('src/utils/api', () => ({
  fetchReleaseNotes: fetchReleaseNotesMock,
}));

vi.mock('src/utils/fs', async (importOriginal) => ({
  ...(await importOriginal<typeof FsUtils>()),
  wasUpdateInstalled: vi.fn(async () => false),
}));

installQuasarPlugin();
installPinia();

interface Feature {
  text: string;
  title: string;
  version: string;
}

const parseReleaseNotes = async (releaseNotes: string) => {
  fetchReleaseNotesMock.mockResolvedValue(releaseNotes);
  const wrapper = mount(DialogAbout, {
    props: { dialogId: 'about', modelValue: false },
  });
  await flushPromises();
  const features = (wrapper.vm as unknown as { parsedFeatures: Feature[] })
    .parsedFeatures;
  wrapper.unmount();
  return features;
};

describe('DialogAbout release notes', () => {
  it('splits each bullet into its bold title and its text', async () => {
    const features = await parseReleaseNotes(
      [
        '## v26.10.1',
        '- ✨ **Plain colon**: First feature.',
        // French typography: a narrow no-break space before the colon.
        '- 🇫🇷 **Espace avant**\u202F: texte français.',
        '- **全角コロン**：日本語のテキスト',
        '- **No colon** text right after',
        '-   **Spaced title**   :   padded text   ',
        '- **Bold** with **more bold** later',
        '- A bullet without a title',
      ].join('\n'),
    );

    expect(features).toEqual([
      { text: 'First feature.', title: 'Plain colon', version: 'v26.10.1' },
      {
        text: 'texte français.',
        title: 'Espace avant',
        version: 'v26.10.1',
      },
      { text: '日本語のテキスト', title: '全角コロン', version: 'v26.10.1' },
      { text: 'text right after', title: 'No colon', version: 'v26.10.1' },
      { text: 'padded text', title: 'Spaced title', version: 'v26.10.1' },
      {
        text: 'with **more bold** later',
        title: 'Bold',
        version: 'v26.10.1',
      },
      {
        text: 'A bullet without a title',
        title: '',
        version: 'v26.10.1',
      },
    ]);
  });

  it('skips non-version sections and prefixes bare versions with "v"', async () => {
    const features = await parseReleaseNotes(
      [
        '## UPCOMING VERSION',
        '- **Unreleased**: not shown yet',
        '## 26.9.0',
        '- **Released**: shown',
      ].join('\n'),
    );

    expect(features).toEqual([
      { text: 'shown', title: 'Released', version: 'v26.9.0' },
    ]);
  });

  it('keeps an unclosed bold marker as plain text', async () => {
    const features = await parseReleaseNotes(
      ['## v1.0.0', '- **Unclosed title: text', '- ****: empty title'].join(
        '\n',
      ),
    );

    expect(features).toEqual([
      { text: '**Unclosed title: text', title: '', version: 'v1.0.0' },
      // `.+?` needs at least one character, so "****" isn't an empty title:
      // the title runs to the next "**" ("**: empty title" has none).
      { text: '****: empty title', title: '', version: 'v1.0.0' },
    ]);
  });
});
