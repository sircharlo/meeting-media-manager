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
        class="q-pr-scroll overflow-auto col items-start q-pt-sm"
        :class="{ 'content-center': loading }"
      >
        <div
          v-if="loading"
          class="row q-px-md col flex-center"
          style="min-height: 100px"
        >
          <q-spinner color="primary" size="md" />
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
                  @click="toggleItem(index)"
                >
                  <q-item-section avatar>
                    <q-checkbox
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
                    <q-item-label>{{ item.Label }}</q-item-label>
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
            @click="addSelectedItems"
          />
          <q-btn
            v-else
            color="negative"
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
  JwPlaylistItem,
  MediaSectionIdentifier,
  MultimediaItem,
  PlaylistTagItem,
} from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { JPG_EXTENSIONS } from 'src/constants/media';
import { isCoWeek } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  downloadAdditionalRemoteVideo,
  dynamicMediaMapper,
  getJwLangCode,
  getPubMediaLinks,
  processMissingMediaInfo,
  resolveFilePath,
} from 'src/helpers/jw-media';
import { getTempPath } from 'src/utils/fs';
import { isImage } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
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
  ok: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const loading = ref<boolean>(false);
const playlistItems = ref<
  (JwPlaylistItem & {
    ResolvedPreviewPath?: string;
    ThumbnailFilePath: string;
    VerseNumbers: number[];
  })[]
>([]);
const selectedItems = ref<number[]>([]);
const playlistName = ref<string>('');

const currentState = useCurrentStateStore();
const { currentCongregation, selectedDate, selectedDateObject } =
  storeToRefs(currentState);
const jwStore = useJwStore();

const { decompress, executeQuery, fs, path } = window.electronApi;
const { pathExists, rename } = fs;
const { basename, extname, join } = path;

const loadPlaylistItems = async () => {
  loading.value = true;

  try {
    if (!props.jwPlaylistPath) return;

    // Extract package
    const tempDir = await getTempPath();
    const outputPath = join(tempDir, basename(props.jwPlaylistPath));
    await decompress(props.jwPlaylistPath, outputPath);

    const dbFile = await findDb(outputPath);
    if (!dbFile) return;

    // ---- Get Playlist Name ----
    try {
      const [tag] = executeQuery<PlaylistTagItem>(
        dbFile,
        'SELECT Name FROM Tag ORDER BY TagId ASC LIMIT 1;',
      );
      playlistName.value = tag?.Name ?? '';
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

    // ---- Process Items ----
    const processedItems = await Promise.all(
      rawItems.map(async (item) => {
        item.ThumbnailFilePath = item.ThumbnailFilePath
          ? join(outputPath, item.ThumbnailFilePath)
          : '';

        // Normalize thumbnail extension → JPG
        if (
          item.ThumbnailFilePath &&
          (await pathExists(item.ThumbnailFilePath))
        ) {
          const ext = extname(item.ThumbnailFilePath).slice(1).toLowerCase();
          if (!ext || !JPG_EXTENSIONS.includes(ext)) {
            try {
              const newPath = item.ThumbnailFilePath + '.jpg';
              await rename(item.ThumbnailFilePath, newPath);
              item.ThumbnailFilePath = newPath;
            } catch (err) {
              errorCatcher(err);
            }
          }
        }

        // Extract verse numbers
        const verseRows = executeQuery<{ Label: string }>(
          dbFile,
          `SELECT Label FROM PlaylistItemMarker WHERE PlaylistItemId = ${item.PlaylistItemId}`,
        );

        const VerseNumbers = verseRows.map((v) => {
          const match = v.Label.match(/\w+ (?:\d+:)?(\d+)/);
          return match?.[1] ? parseInt(match[1]) : 0;
        });

        // Determine best preview path
        const candidatePath =
          isImage(item.IndependentMediaFilePath) &&
          item.IndependentMediaFilePath
            ? join(outputPath, item.IndependentMediaFilePath)
            : item.ThumbnailFilePath;

        const ResolvedPreviewPath = await resolveFilePath(candidatePath);

        return {
          ...item,
          ResolvedPreviewPath,
          ThumbnailFilePath: item.ThumbnailFilePath || '',
          VerseNumbers,
        };
      }),
    );

    playlistItems.value = processedItems;
  } catch (err) {
    errorCatcher(err);
  } finally {
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

function getItemLabel(i: number, item: JwPlaylistItem) {
  const base = `${i + 1} - ${item.Label}`;
  return playlistName.value ? `${playlistName.value} - ${base}` : base;
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
  const filePath = item.IndependentMediaFilePath
    ? join(outputPath, item.IndependentMediaFilePath)
    : '';

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
    ThumbnailFilePath: item.ThumbnailFilePath || '',
    Track: item.Track,
    VerseNumbers: item.VerseNumbers,
  };

  await processMissingMediaInfo([multimediaItem], selectedDate.value, true);

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
    await processVideoItem(
      item,
      itemLabel,
      outputPath,
      StartTime,
      EndTime,
      durationTicks,
    );
    return { mappedItems: [], order: index }; // no addition map for video
  }

  const result = await processNonVideoItem(
    item,
    itemLabel,
    outputPath,
    StartTime,
    EndTime,
  );
  return { mappedItems: result.mapped, order: index };
}
async function processVideoItem(
  item: JwPlaylistItem,
  itemLabel: string,
  outputPath: string,
  StartTime: null | number,
  EndTime: null | number,
  durationTicks: number,
) {
  const lang = getJwLangCode(item.MepsLanguage) || 'E';

  const pubDownload = await getPubMediaLinks({
    booknum: item.BookNumber,
    docid: item.DocumentId,
    issue: item.IssueTagNumber,
    langwritten: lang,
    pub: item.KeySymbol,
    track: item.Track,
  });

  const videoLinks = pubDownload?.files?.[lang]?.['MP4'];
  if (!videoLinks) return { type: 'skip' };

  const customDuration =
    StartTime !== null || EndTime !== null
      ? {
          max: EndTime ?? durationTicks / 10000 / 1000,
          min: StartTime ?? 0,
        }
      : undefined;

  await downloadAdditionalRemoteVideo(
    videoLinks,
    selectedDate.value,
    item.ThumbnailFilePath || undefined,
    false,
    itemLabel,
    props.section,
    customDuration,
  );

  return { type: 'video' };
}

const addSelectedItems = async () => {
  console.group('📋 JW Playlist Processing');
  loading.value = true;

  try {
    if (!selectedItems.value.length || !selectedDateObject.value) return;

    const selectedPlaylistItems = selectedItems.value
      .map((i) => playlistItems.value[i])
      .filter(Boolean);

    const outputPath = join(
      await getTempPath(),
      basename(props.jwPlaylistPath),
    );

    // 🔥 Process all items *in parallel*
    const results = await Promise.all(
      selectedPlaylistItems
        .filter((item) => !!item)
        .map((item, idx) => processSingleItem(item, idx, outputPath)),
    );

    // 🔥 Apply mappings SEQUENTIALLY (preserves order)
    for (const result of results.sort((a, b) => a.order - b.order)) {
      if (!result?.mappedItems?.length) continue;

      jwStore.addToAdditionMediaMap(
        result.mappedItems,
        props.section,
        currentCongregation.value,
        selectedDateObject.value,
        isCoWeek(selectedDateObject.value.date),
      );
    }

    emit('ok');
    console.log('✅ All items processed (parallel) and applied (ordered).');
  } catch (error) {
    console.log('❌ Error processing playlist items:', error);
    errorCatcher(error);
  } finally {
    dialogValue.value = false;
    loading.value = false;
    console.groupEnd();
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
    console.log('🎯 jwPlaylistPath changed to:', newPath);
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
