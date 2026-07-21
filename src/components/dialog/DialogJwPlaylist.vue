<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <div
      class="bg-secondary-contrast large-overlay q-px-none flex"
      style="flex-flow: column"
    >
      <div class="row q-px-md q-pt-lg text-h6">
        <div class="col">
          {{ t('jw-playlist-import') }}
        </div>
      </div>
      <div class="row q-px-md q-py-md">
        {{ t('jw-playlist-import-explain') }}
      </div>

      <div
        v-if="!loading && playlistItems.length"
        class="q-px-md q-gutter-x-md items-center"
      >
        <div class="row">
          <div class="col text-secondary text-uppercase q-my-sm">
            {{ t('item-names') }}
          </div>
        </div>
        <div class="row q-gutter-x-md">
          <q-checkbox
            v-model="includePrefix"
            :disable="isProcessing"
            :label="t('include-prefix')"
          />
          <q-input
            v-if="includePrefix"
            v-model="customPrefix"
            dense
            :disable="isProcessing"
            outlined
            style="min-width: 200px"
          />
        </div>
        <div class="row q-gutter-x-md">
          <q-checkbox
            v-model="includeNumbering"
            :disable="isProcessing"
            :label="t('include-numbering')"
          />
        </div>
      </div>

      <div
        class="q-pr-scroll overflow-auto col items-start q-pt-sm"
        :class="{ 'content-center': loading }"
      >
        <div
          v-if="loading && !playlistItems.length"
          class="col q-px-md full-width"
        >
          <div class="text-secondary text-uppercase q-my-sm">
            {{ t('playlist-items') }}
          </div>
          <div class="col full-width">
            <q-list class="full-width" separator>
              <q-item v-for="skeletonIndex in 8" :key="skeletonIndex">
                <q-item-section avatar>
                  <q-skeleton size="24px" type="QCheckbox" />
                </q-item-section>
                <q-item-section avatar>
                  <q-skeleton size="md" type="rect" />
                </q-item-section>
                <q-item-section>
                  <q-skeleton height="16px" type="text" width="80%" />
                  <q-skeleton
                    class="q-mt-xs"
                    height="14px"
                    type="text"
                    width="60%"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
        <template v-else>
          <div v-if="playlistItems.length" class="col q-px-md full-width">
            <div class="text-secondary text-uppercase q-my-sm">
              {{ t('playlist-items') }}
            </div>
            <div class="col full-width">
              <q-list class="full-width" separator>
                <q-item
                  v-for="(item, index) in playlistItems"
                  :key="item.PlaylistItemId"
                  clickable
                  :disable="isProcessing"
                  @click="toggleItem(index)"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      :disable="isProcessing"
                      :model-value="selectedItems.includes(index)"
                      @update:model-value="toggleItem(index)"
                    />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-img
                      v-if="item.ResolvedPreviewPath"
                      size="md"
                      :src="'file://' + item.ResolvedPreviewPath"
                    />
                    <q-icon
                      v-else
                      color="primary"
                      :name="getMediaIcon(item)"
                      size="md"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      <span
                        v-if="getItemLabelParts(index, item).prefix"
                        class="text-primary text-weight-bold"
                      >
                        {{ getItemLabelParts(index, item).prefix }}
                      </span>
                      {{ getItemLabelParts(index, item).rest }}
                    </q-item-label>
                    <q-item-label v-if="!item.OriginalFilename" caption>
                      {{ item.OriginalFilename }}
                      {{ formatDuration(item) }}
                      <span v-if="item.VerseNumbers?.length">
                        • {{ t('verses') }}: {{ item.VerseNumbers.join(', ') }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
          <div v-else-if="!loading" class="row q-px-md col flex-center">
            <div class="text-center">
              <q-icon color="secondary" name="mmm-jwlplaylist" size="xl" />
              <div class="text-secondary q-mt-md">
                {{ t('no-playlist-items-found') }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="row q-px-md q-py-md">
        <div class="col">
          <q-btn
            v-if="selectedItems.length < playlistItems.length"
            color="primary"
            :disable="isProcessing"
            flat
            :label="t('select-all')"
            @click="selectAll"
          />
          <q-btn
            v-else-if="
              selectedItems.length === playlistItems.length &&
              playlistItems.length > 0
            "
            color="primary"
            :disable="isProcessing"
            flat
            :label="t('deselect-all')"
            @click="deselectAll"
          />
        </div>
        <div class="col-shrink q-gutter-x-sm">
          <q-btn
            v-if="selectedItems.length"
            color="primary"
            :label="t('add') + ` (${selectedItems.length})`"
            :loading="isProcessing"
            @click="addSelectedItems"
          />
          <q-btn
            v-else
            color="negative"
            :disable="isProcessing"
            flat
            :label="t('cancel')"
            @click="handleCancel"
          />
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type {
  DialogImportPayload,
  JwPlaylistItem,
  MediaItem,
  MediaSectionIdentifier,
  MultimediaItem,
  PlaylistTagItem,
  PublicationFetcher,
} from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { JPG_EXTENSIONS } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  copyToDatedAdditionalMedia,
  downloadAdditionalRemoteVideo,
  dynamicMediaMapper,
  getJwLangCode,
  getPubMediaLinks,
  processMissingMediaInfo,
  resolveFilePath,
} from 'src/helpers/jw-media';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { getFilesystemErrorCode } from 'src/shared/filesystem-errors';
import { log } from 'src/shared/vanilla';
import { getTempPath } from 'src/utils/fs';
import { isImage } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
const props = defineProps<{
  dialogId: string;
  jwPlaylistPath: string;
  modelValue: boolean;
  section: MediaSectionIdentifier | undefined;
}>();

const emit = defineEmits<{
  cancel: [];
  import: [data: DialogImportPayload];
  ok: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const loading = ref<boolean>(false);
const isProcessing = ref<boolean>(false);
const playlistItems = ref<
  (JwPlaylistItem & {
    ResolvedPreviewPath?: string;
    ThumbnailFilePath: string;
    VerseNumbers: number[];
  })[]
>([]);
const selectedItems = ref<number[]>([]);
const playlistName = ref<string>('');

const includePrefix = ref(true);
const customPrefix = ref('');
const includeNumbering = ref(true);

const currentState = useCurrentStateStore();
const { selectedDate, selectedDateObject } = storeToRefs(currentState);

const {
  basename,
  dirname,
  executeQuery,
  extname,
  fs,
  join,
  pathToFileURL,
  readdir,
  unzip,
} = globalThis.electronApi;
const { pathExists, rename } = fs;

// The jwPlaylistPath watcher and the dialog-open watcher below can both
// fire for the same path change (path changes while the dialog opens),
// which would otherwise run this whole extraction/processing pipeline
// twice concurrently and race on the file renames further down.
let loadingPlaylistPath: string | undefined;

const loadPlaylistItems = async () => {
  if (!props.jwPlaylistPath || loadingPlaylistPath === props.jwPlaylistPath) {
    return;
  }
  loadingPlaylistPath = props.jwPlaylistPath;
  loading.value = true;

  try {
    // Extract package
    const tempDir = await getTempPath();
    const outputPath = join(tempDir, basename(props.jwPlaylistPath));

    try {
      await unzip(props.jwPlaylistPath, outputPath);
    } catch (err) {
      createTemporaryNotification({
        message: t('error-reading-playlist-file'),
        type: 'negative',
      });
      throw err;
    }

    const dbFile = await findDb(outputPath);
    if (!dbFile) {
      createTemporaryNotification({
        message: t('error-reading-playlist-file'),
        type: 'negative',
      });
      return;
    }

    // ---- Get Playlist Name ----
    try {
      const [tag] = executeQuery<PlaylistTagItem>(
        dbFile,
        'SELECT Name FROM Tag ORDER BY TagId ASC LIMIT 1;',
      );
      playlistName.value = tag?.Name ?? '';
      customPrefix.value = playlistName.value;
    } catch (err) {
      errorCatcher(err);
    }

    // ---- Get Playlist Items ----
    const rawItems = executeQuery<
      JwPlaylistItem & {
        ResolvedPreviewPath?: string;
        ThumbnailFilePath: string;
        VerseNumbers: number[];
      }
    >(
      dbFile,
      `
      SELECT
        pi.PlaylistItemId,
        pi.Label,
        pi.StartTrimOffsetTicks,
        pi.EndTrimOffsetTicks,
        pi.Accuracy,
        pi.EndAction,
        pi.ThumbnailFilePath,
        plm.BaseDurationTicks,
        pim.DurationTicks,
        im.OriginalFilename,
        im.FilePath AS IndependentMediaFilePath,
        im.MimeType,
        im.Hash,
        l.LocationId,
        l.BookNumber,
        l.ChapterNumber,
        l.DocumentId,
        l.Track,
        l.IssueTagNumber,
        l.KeySymbol,
        l.MepsLanguage,
        l.Type,
        l.Title
      FROM PlaylistItem pi
      LEFT JOIN PlaylistItemIndependentMediaMap pim ON pi.PlaylistItemId = pim.PlaylistItemId
      LEFT JOIN IndependentMedia im ON pim.IndependentMediaId = im.IndependentMediaId
      LEFT JOIN PlaylistItemLocationMap plm ON pi.PlaylistItemId = plm.PlaylistItemId
      LEFT JOIN Location l ON plm.LocationId = l.LocationId
      `,
    );

    // JW Library sometimes stores playlist image assets (thumbnails as well
    // as independent-media pictures) under a bare UUID filename with no
    // extension at all. Every consumer downstream (isImage(), the browser's
    // file:// mime lookup, etc.) keys off the extension, so an extensionless
    // asset silently fails to be recognized as an image — jpg is by far the
    // most common actual format for these, so rename to add it when missing.
    const ensureJpgExtension = async (absolutePath: string) => {
      const ext = extname(absolutePath).slice(1).toLowerCase();
      if (ext && JPG_EXTENSIONS.includes(ext)) return absolutePath;
      const newPath = absolutePath + '.jpg';
      try {
        await rename(absolutePath, newPath);
        return newPath;
      } catch (err) {
        // Playlist items are processed concurrently below and can share the
        // same thumbnail/independent-media file. If another item already
        // renamed it, the target now exists — that's a benign race, not an
        // error. `rename` is exposed straight through Electron's
        // contextBridge, so the thrown error's `code` doesn't survive the
        // crossing — getFilesystemErrorCode falls back to parsing it back
        // out of the message text.
        if (
          getFilesystemErrorCode(err) === 'ENOENT' &&
          (await pathExists(newPath))
        ) {
          return newPath;
        }
        // The source is genuinely missing rather than just already renamed
        // by a concurrent call — capture what's actually in the containing
        // directory to tell apart "never extracted" from "renamed to
        // something unexpected" next time this comes up in Sentry.
        const dirListing = await readdir(dirname(absolutePath));
        errorCatcher(err, {
          contexts: {
            fn: {
              dirListing: dirListing.map((entry) => entry.name),
              name: 'ensureJpgExtension rename',
            },
          },
        });
        return absolutePath;
      }
    };

    // ---- Process Items ----
    const processedItems = await Promise.all(
      rawItems.map(async (item) => {
        // Resolve thumbnail path
        let thumbnailPath = item.ThumbnailFilePath
          ? join(outputPath, item.ThumbnailFilePath)
          : '';

        if (thumbnailPath) {
          thumbnailPath = await ensureJpgExtension(thumbnailPath);
        }

        // The independent-media file itself can suffer from the same
        // missing-extension issue; only image assets get the jpg fallback,
        // since audio/video files must keep their real extension.
        let independentMediaFilePath = item.IndependentMediaFilePath;
        if (independentMediaFilePath && item.MimeType?.includes('image')) {
          const normalizedPath = await ensureJpgExtension(
            join(outputPath, independentMediaFilePath),
          );
          independentMediaFilePath = normalizedPath.slice(
            outputPath.length + 1,
          );
        }

        // Extract verse numbers (parameterized query to avoid SQL injection)
        const verseRows = executeQuery<{ Label: string }>(
          dbFile,
          `SELECT Label FROM PlaylistItemMarker WHERE PlaylistItemId = ?`,
          [item.PlaylistItemId],
        );

        const verseNumbers = verseRows.map((v) => {
          // Matches e.g. "John 3:16" or "Genesis 1", captures the verse number
          const match = v.Label.match(/^\S+ (?:\d+:)?(\d+)/);
          return match?.[1] ? Number.parseInt(match[1], 10) : 0;
        });

        // Determine best preview path
        const candidatePath =
          independentMediaFilePath && isImage(independentMediaFilePath)
            ? join(outputPath, independentMediaFilePath)
            : thumbnailPath;

        const resolvedPreviewPath = await resolveFilePath(candidatePath);

        return {
          ...item,
          IndependentMediaFilePath: independentMediaFilePath,
          ResolvedPreviewPath: resolvedPreviewPath,
          ThumbnailFilePath: thumbnailPath,
          VerseNumbers: verseNumbers,
        };
      }),
    );

    playlistItems.value = processedItems;
  } catch (err) {
    errorCatcher(err);
  } finally {
    loadingPlaylistPath = undefined;
    loading.value = false;
  }
};

const toggleItem = (index: number) => {
  const currentIndex = selectedItems.value.indexOf(index);
  if (currentIndex === -1) {
    selectedItems.value.push(index);
  } else {
    selectedItems.value.splice(currentIndex, 1);
  }
  selectedItems.value.sort((a, b) => a - b);
};

const selectAll = () => {
  selectedItems.value = playlistItems.value.map((_, index) => index);
};

const deselectAll = () => {
  selectedItems.value = [];
};

const getMediaIcon = (item: JwPlaylistItem) => {
  if (item.MimeType?.startsWith('video/')) return 'mmm-movie';
  if (item.MimeType?.startsWith('audio/')) return 'mmm-audio';
  if (item.MimeType?.startsWith('image/')) return 'mmm-image';
  return 'mmm-local-media';
};

const formatDuration = (item: JwPlaylistItem) => {
  const durationTicks = item?.BaseDurationTicks || item?.DurationTicks || 0;
  if (!durationTicks) return '';

  const seconds = Math.floor(durationTicks / 10000 / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

async function copyPlaylistAssetToAdditionalMedia(filepath?: string) {
  if (!filepath || !(await pathExists(filepath))) return '';
  return copyToDatedAdditionalMedia(filepath, props.section, false);
}

function getItemLabel(i: number, item: JwPlaylistItem) {
  const { prefix, rest } = getItemLabelParts(i, item);
  return prefix + rest;
}

function getItemLabelParts(i: number, item: JwPlaylistItem) {
  let prefix = '';
  const rest = item.Label;

  if (includePrefix.value && customPrefix.value) {
    prefix += `${customPrefix.value} - `;
  }

  if (includeNumbering.value) {
    prefix += `${i + 1} - `;
  }

  return { prefix, rest };
}

function getTrimmedTimes(item: JwPlaylistItem) {
  const durationTicks = item.BaseDurationTicks ?? item.DurationTicks ?? 0;

  const StartTime =
    item.StartTrimOffsetTicks && item.StartTrimOffsetTicks >= 0
      ? item.StartTrimOffsetTicks / 10000 / 1000
      : null;

  const EndTime =
    item.EndTrimOffsetTicks && durationTicks >= item.EndTrimOffsetTicks
      ? (durationTicks - item.EndTrimOffsetTicks) / 10000 / 1000
      : null;

  return { durationTicks, EndTime, StartTime };
}

async function processNonVideoItem(
  item: JwPlaylistItem & {
    ResolvedPreviewPath?: string;
    ThumbnailFilePath: string;
    VerseNumbers: number[];
  },
  itemLabel: string,
  outputPath: string,
  StartTime: null | number,
  EndTime: null | number,
) {
  const extractedFilePath = item.IndependentMediaFilePath
    ? join(outputPath, item.IndependentMediaFilePath)
    : '';
  const filePath = await copyPlaylistAssetToAdditionalMedia(extractedFilePath);
  const thumbnailPath = await copyPlaylistAssetToAdditionalMedia(
    item.ThumbnailFilePath,
  );

  const multimediaItem: MultimediaItem = {
    BeginParagraphOrdinal: 0,
    BookNumber: item.BookNumber,
    Caption: '',
    CategoryType: 0,
    ChapterNumber: item.ChapterNumber,
    DocumentId: 0,
    EndTime: EndTime ?? undefined,
    FilePath: filePath,
    IssueTagNumber: item.IssueTagNumber,
    KeySymbol: item.KeySymbol,
    Label: itemLabel,
    MajorType: 0,
    MepsLanguageIndex: item.MepsLanguage,
    MimeType: item.MimeType,
    MultimediaId: 0,
    Repeat: item.EndAction === 3,
    StartTime: StartTime ?? undefined,
    TargetParagraphNumberLabel: 0,
    ThumbnailFilePath: thumbnailPath || '',
    Track: item.Track,
    VerseNumbers: item.VerseNumbers,
  };

  await processMissingMediaInfo({
    allMedia: [multimediaItem],
    keepMediaLabels: true,
    meetingDate: selectedDate.value,
  });

  // nwt is excluded from mapping
  if (multimediaItem.KeySymbol === 'nwt') {
    return { mapped: [], type: 'nonVideo' };
  }

  if (!selectedDateObject.value) return { mapped: [], type: 'nonVideo' };

  const mapped = await dynamicMediaMapper(
    [multimediaItem],
    selectedDateObject.value.date,
    'playlist',
  );

  return {
    mapped,
    multimediaItem,
    type: 'nonVideo',
  };
}

async function processSingleItem(
  item: JwPlaylistItem & {
    ResolvedPreviewPath?: string;
    ThumbnailFilePath: string;
    VerseNumbers: number[];
  },
  index: number,
  outputPath: string,
) {
  const { durationTicks, EndTime, StartTime } = getTrimmedTimes(item);
  const itemLabel = getItemLabel(index, item);
  const isVideo = !item.OriginalFilename;

  if (isVideo) {
    const videoResult = await processVideoItem(
      item,
      itemLabel,
      outputPath,
      StartTime,
      EndTime,
      durationTicks,
    );
    return {
      item,
      itemLabel,
      mappedItems: videoResult.mediaItem
        ? [videoResult.mediaItem as MediaItem]
        : [],
      order: index,
    };
  }

  const result = await processNonVideoItem(
    item,
    itemLabel,
    outputPath,
    StartTime,
    EndTime,
  );
  return { item, itemLabel, mappedItems: result.mapped, order: index };
}
async function processVideoItem(
  item: JwPlaylistItem,
  itemLabel: string,
  outputPath: string,
  StartTime: null | number,
  EndTime: null | number,
  durationTicks: number,
  sectionToUse?: MediaSectionIdentifier,
) {
  const lang = getJwLangCode(item.MepsLanguage) || 'E';

  const mediaLookup: PublicationFetcher = {
    booknum: item.BookNumber,
    docid: item.DocumentId,
    issue: item.IssueTagNumber,
    langwritten: lang,
    pub: item.KeySymbol,
    track: item.Track,
  };

  const pubDownload = await getPubMediaLinks(mediaLookup);

  const videoLinks = pubDownload?.files?.[lang]?.['MP4'];
  if (!videoLinks) return { type: 'skip' };

  const customDuration =
    StartTime !== null || EndTime !== null
      ? {
          max: EndTime ?? durationTicks / 10000 / 1000,
          min: StartTime ?? 0,
        }
      : undefined;
  const thumbnailPath = await copyPlaylistAssetToAdditionalMedia(
    item.ThumbnailFilePath,
  );

  const mediaItem = await downloadAdditionalRemoteVideo({
    customDuration,
    mediaItemLinks: videoLinks,
    meetingDate: selectedDate.value,
    onlyCreateItem: true,
    section: sectionToUse || props.section,
    song: false,
    thumbnailLookup: mediaLookup,
    thumbnailUrl: thumbnailPath ? pathToFileURL(thumbnailPath) : undefined,
    title: itemLabel,
  });

  return { mediaItem, type: 'video' };
}

const addSelectedItems = async () => {
  try {
    if (!selectedItems.value.length || !selectedDateObject.value) return;

    const selectedPlaylistItems = selectedItems.value
      .map((i) => playlistItems.value[i])
      .filter((item): item is NonNullable<typeof item> => !!item);

    const outputPath = join(
      await getTempPath(),
      basename(props.jwPlaylistPath),
    );

    isProcessing.value = true;

    // Process all items in playlist order, keeping them all in one array
    const processedMediaItems: DialogImportPayload['items'] = [];

    for (const [idx, item] of selectedPlaylistItems.entries()) {
      const result = await processSingleItem(item, idx, outputPath);
      if (result?.mappedItems?.length) {
        processedMediaItems.push(...result.mappedItems);
      }
    }

    // ✅ Always emit processed items - parent handles section assignment
    emit('import', { items: processedMediaItems });

    emit('ok');
    log(
      '✅ All items processed (sequential) and applied (ordered).',
      'jwPlaylist',
      'info',
    );
  } catch (error) {
    errorCatcher(error);
  } finally {
    dialogValue.value = false;
    isProcessing.value = false;
  }
};

const handleCancel = () => {
  dialogValue.value = false;
  emit('cancel');
};

const resetSelection = () => {
  selectedItems.value = [];
  playlistItems.value = [];
  playlistName.value = '';
};

// Watch for changes in jwPlaylistPath
watch(
  () => props.jwPlaylistPath,
  (newPath: string) => {
    log(`🎯 jwPlaylistPath changed to: ${newPath}`, 'jwPlaylist', 'info');
    if (newPath) {
      loadPlaylistItems();
    }
  },
);

// Watch for dialog closing to reset loading states
watch(
  () => dialogValue.value,
  (isOpen) => {
    resetSelection();
    if (!isOpen) {
      // Reset loading states when dialog closes
      loading.value = false;
    } else if (props.jwPlaylistPath) {
      // Load items when dialog opens if path is present
      // This handles the case where the same file is dropped twice
      loadPlaylistItems();
    }
  },
);
</script>
