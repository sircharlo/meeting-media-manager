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
        <div class="col-shrink">
          <q-btn
            color="primary"
            flat
            icon="mmm-cloud-done"
            :loading="loading"
            round
            @click="
              loading = true;
              loadPlaylistItems();
            "
          />
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
            <div class="text-grey text-uppercase q-my-sm">
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
                      v-if="item.ThumbnailFilePath"
                      size="md"
                      :src="'file://' + item.ThumbnailFilePath"
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
              <q-icon color="grey" name="mmm-jwlplaylist" size="xl" />
              <div class="text-grey q-mt-md">
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
} from 'src/helpers/jw-media';
import { getTempPath } from 'src/utils/fs';
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
    ThumbnailFilePath: string;
    VerseNumbers: number[];
  })[]
>([]);
const selectedItems = ref<number[]>([]);
const playlistName = ref<string>('');

const currentState = useCurrentStateStore();
const { currentCongregation, selectedDateObject } = storeToRefs(currentState);
const jwStore = useJwStore();

const { decompress, executeQuery, fs, path } = window.electronApi;
const { pathExists, rename } = fs;
const { basename, extname, join } = path;

const loadPlaylistItems = async () => {
  try {
    loading.value = true;
    if (!props.jwPlaylistPath) return;

    const outputPath = join(
      await getTempPath(),
      basename(props.jwPlaylistPath),
    );
    await decompress(props.jwPlaylistPath, outputPath);
    const dbFile = await findDb(outputPath);
    if (!dbFile) return;

    // Get playlist name
    try {
      const playlistNameQuery = executeQuery<PlaylistTagItem>(
        dbFile,
        'SELECT Name FROM Tag ORDER BY TagId ASC LIMIT 1;',
      );
      if (playlistNameQuery[0]) {
        playlistName.value = playlistNameQuery[0].Name;
      }
    } catch (error) {
      errorCatcher(error);
    }

    // Get playlist items
    const items = executeQuery<JwPlaylistItem>(
      dbFile,
      `SELECT
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
      FROM
        PlaylistItem pi
      LEFT JOIN
        PlaylistItemIndependentMediaMap pim ON pi.PlaylistItemId = pim.PlaylistItemId
      LEFT JOIN
        IndependentMedia im ON pim.IndependentMediaId = im.IndependentMediaId
      LEFT JOIN
        PlaylistItemLocationMap plm ON pi.PlaylistItemId = plm.PlaylistItemId
      LEFT JOIN
        Location l ON plm.LocationId = l.LocationId`,
    );

    // Process items
    const processedItems = await Promise.all(
      items.map(async (item) => {
        // Handle thumbnail
        item.ThumbnailFilePath = item.ThumbnailFilePath
          ? join(outputPath, item.ThumbnailFilePath)
          : '';
        if (
          item.ThumbnailFilePath &&
          !JPG_EXTENSIONS.includes(
            extname(item.ThumbnailFilePath).toLowerCase().replace('.', ''),
          ) &&
          (await pathExists(item.ThumbnailFilePath))
        ) {
          try {
            await rename(
              item.ThumbnailFilePath,
              item.ThumbnailFilePath + '.jpg',
            );
            item.ThumbnailFilePath += '.jpg';
          } catch (error) {
            errorCatcher(error);
          }
        }

        // Get verse numbers
        const VerseNumbers = executeQuery<{ Label: string }>(
          dbFile,
          `SELECT Label FROM PlaylistItemMarker WHERE PlaylistItemId = ${item.PlaylistItemId}`,
        ).map((v) =>
          parseInt(
            Array.from(
              v.Label.matchAll(/\w+ (?:\d+:)?(\d+)/g),
              (m) => m[1],
            )[0] ?? '0',
          ),
        );

        return {
          ...item,
          ThumbnailFilePath: item.ThumbnailFilePath || '',
          VerseNumbers,
        };
      }),
    );

    playlistItems.value = processedItems;
  } catch (error) {
    errorCatcher(error);
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

const addSelectedItems = async () => {
  console.group('📋 JW Playlist Processing');
  try {
    loading.value = true;
    console.log(
      '📋 Adding selected items',
      selectedItems.value,
      selectedDateObject.value,
    );
    if (!selectedItems.value.length || !selectedDateObject.value) return;

    const selectedPlaylistItems = selectedItems.value
      .map((index) => playlistItems.value[index])
      .filter(Boolean);

    console.log('📋 Selected playlist items', selectedPlaylistItems);
    const outputPath = join(
      await getTempPath(),
      basename(props.jwPlaylistPath),
    );

    console.log('📁 Output path', outputPath);

    // Process items sequentially and wait for each to complete
    for (let i = 0; i < selectedPlaylistItems.length; i++) {
      const item = selectedPlaylistItems[i];
      if (!item) continue;

      const durationTicks = item?.BaseDurationTicks || item?.DurationTicks || 0;
      const EndTime =
        durationTicks &&
        item?.EndTrimOffsetTicks &&
        durationTicks >= item.EndTrimOffsetTicks
          ? (durationTicks - item.EndTrimOffsetTicks) / 10000 / 1000
          : null;

      const StartTime =
        item.StartTrimOffsetTicks && item.StartTrimOffsetTicks >= 0
          ? item.StartTrimOffsetTicks / 10000 / 1000
          : null;

      const playlistItemName = `${i + 1} - ${item.Label}`;
      const itemLabel = `${playlistName.value ? playlistName.value + ' - ' : ''}${playlistItemName}`;
      console.group(
        `🔄 Processing Item ${i + 1}/${selectedPlaylistItems.length} - ${item.Label}`,
      );
      console.log('📋 Item details:', item);

      if (!item.OriginalFilename) {
        // Handle video using downloadAdditionalRemoteVideo
        console.log('🎥 Processing video item:', itemLabel);

        // Create media link object for the video
        const lang = getJwLangCode(item.MepsLanguage) || 'E';
        const pubDownload = await getPubMediaLinks({
          booknum: item.BookNumber,
          docid: item.DocumentId,
          issue: item.IssueTagNumber,
          langwritten: lang,
          pub: item.KeySymbol,
          track: item.Track,
        });
        console.log('🔗 Pub download links:', pubDownload);

        if (
          !pubDownload?.files ||
          !pubDownload.files[lang] ||
          !pubDownload.files[lang]['MP4']
        ) {
          console.warn(
            `No download links found for ${item.KeySymbol} in language ${lang}`,
          );
          continue;
        }

        // Use custom duration if we have trim offsets
        const customDuration =
          StartTime !== null || EndTime !== null
            ? {
                max: EndTime || durationTicks / 10000 / 1000,
                min: StartTime || 0,
              }
            : undefined;

        await downloadAdditionalRemoteVideo(
          pubDownload?.files[lang]?.['MP4'],
          item.ThumbnailFilePath || undefined,
          false, // song parameter
          itemLabel,
          props.section,
          customDuration,
        );

        console.log('✅ Video item added:', itemLabel);
        console.groupEnd();
      } else {
        // Handle non-video items (images, audio, etc.) as before
        console.log('🖼️ Processing non-video item:', itemLabel);

        const multimediaItem: MultimediaItem = {
          BeginParagraphOrdinal: 0,
          BookNumber: item.BookNumber,
          Caption: '',
          CategoryType: 0,
          ChapterNumber: item.ChapterNumber,
          DocumentId: 0,
          EndTime: EndTime ?? undefined,
          FilePath: item.IndependentMediaFilePath
            ? join(outputPath, item.IndependentMediaFilePath)
            : '',
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

        // Process single item and wait for completion
        await processMissingMediaInfo([multimediaItem], true);

        if (multimediaItem.KeySymbol !== 'nwt') {
          const dynamicMediaItems = await dynamicMediaMapper(
            [multimediaItem],
            selectedDateObject.value.date,
            'playlist',
          );

          console.log(
            '📋 Adding dynamic media item:',
            dynamicMediaItems,
            props.section,
            currentCongregation.value,
            selectedDateObject.value,
          );

          jwStore.addToAdditionMediaMap(
            dynamicMediaItems,
            props.section,
            currentCongregation.value,
            selectedDateObject.value,
            isCoWeek(selectedDateObject?.value.date),
          );
        }

        console.log('✅ Non-video item added:', itemLabel);
        console.groupEnd();
      }
    }

    console.log('✅ All items processed successfully');
    dialogValue.value = false;
    emit('ok');
  } catch (error) {
    console.log('❌ Error processing playlist items:', error);
    errorCatcher(error);
  } finally {
    loading.value = false;
    resetSelection();
    console.groupEnd();
  }
};

const handleCancel = () => {
  // Reset loading states
  loading.value = false;
  resetSelection();
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
    if (!isOpen) {
      // Reset loading states when dialog closes
      loading.value = false;
    }
  },
);

// Initialize when component mounts
resetSelection();
console.log(
  '🎯 DialogJwPlaylist mounted with jwPlaylistPath:',
  props.jwPlaylistPath,
);
if (props.jwPlaylistPath) {
  console.log('🎯 Loading playlist items for path:', props.jwPlaylistPath);
  loadPlaylistItems();
}
</script>
