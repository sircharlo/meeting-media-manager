<template>
  <q-dialog v-model="localValue">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="text-h6 row">{{ $t('import-media-from-s34mp') }}</div>
      <div class="row">{{ $t('select-s34mp-to-add-public-talk-media') }}</div>
      <div class="row items-center q-gutter-x-md">
        <q-icon name="mmm-file" size="md" />
        <div class="col text-subtitle2">
          {{
            s34mpDb
              ? path.basename(s34mpDb, path.extname(s34mpDb))
              : $t('select-s34mp')
          }}
        </div>
        <div v-if="s34mpDb || s34mpFile" class="col-grow text-caption">
          <template v-if="s34mpDb && filteredPublicTalks.length > 0">
            {{ s34mpInfo.Year }}, v{{ s34mpInfo.VersionNumber }}
          </template>
          <q-spinner v-else color="primary" size="sm" />
        </div>
        <q-btn color="primary" outline @click="browse">
          <q-icon class="q-mr-sm" name="mmm-local-media" />
          {{ s34mpDb ? $t('replace') : $t('browse') }}
        </q-btn>
      </div>
      <template v-if="s34mpDb">
        <div class="row">
          <q-input
            v-model="filter"
            :label="$t('search')"
            class="col"
            clearable
            debounce="100"
            dense
            outlined
            spellcheck="false"
          >
            <template #prepend>
              <q-icon name="mmm-search" />
            </template>
          </q-input>
        </div>
        <div class="row">
          <q-scroll-area
            :bar-style="barStyle()"
            :thumb-style="thumbStyle()"
            style="height: 30vh; width: -webkit-fill-available"
          >
            <template
              v-for="publicTalk in filteredPublicTalks"
              :key="publicTalk"
            >
              <q-item
                v-ripple
                class="items-center"
                clickable
                @click="addPublicTalkMedia(publicTalk)"
              >
                {{ publicTalk.Title }}
              </q-item>
            </template>
          </q-scroll-area>
        </div>
      </template>
      <div class="row justify-end">
        <q-btn color="negative" flat @click="dismissPopup">{{
          $t('cancel')
        }}</q-btn>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DocumentItem, PublicationInfo } from 'src/types';

import { storeToRefs } from 'pinia';
import { barStyle, thumbStyle } from 'src/boot/globals';
import { electronApi } from 'src/helpers/electron-api';
import { getPublicationsPath } from 'src/helpers/fs';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { decompressJwpub, findDb } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { executeQuery, fs, openFileDialog, path } = electronApi;

const props = defineProps<{
  modelValue: boolean | null;
}>();

const emit = defineEmits(['update:modelValue']);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const localValue = ref(props.modelValue);

const filter = ref('');
const publicTalks = ref<DocumentItem[]>([]);
const filteredPublicTalks = computed((): DocumentItem[] => {
  return filter.value
    ? publicTalks.value.filter((s) =>
        s.Title.toLowerCase().includes(filter.value.toLowerCase()),
      )
    : publicTalks.value;
});

const s34mpBasename = ref();
const s34mpFile = ref();
const s34mpDir = ref();
const s34mpDb = ref();
const s34mpInfo = ref({} as PublicationInfo);

const populatePublicTalks = () => {
  s34mpDb.value = findDb(s34mpDir.value);
  if (!s34mpDb.value) return;
  publicTalks.value = executeQuery(
    s34mpDb.value,
    'SELECT DISTINCT Document.DocumentId, Title FROM Document INNER JOIN DocumentMultimedia ON Document.DocumentId = DocumentMultimedia.DocumentId',
  ) as DocumentItem[];
  const PublicationInfos = executeQuery(
    s34mpDb.value,
    'SELECT DISTINCT VersionNumber, Year FROM Publication',
  ) as PublicationInfo[];
  if (PublicationInfos.length) s34mpInfo.value = PublicationInfos[0];
};

const browse = async () => {
  const s34mpFileSelection = await openFileDialog(true, ['jwpub']);
  if (!s34mpFileSelection || !s34mpFileSelection.filePaths.length) return;
  s34mpFile.value = s34mpFileSelection.filePaths[0];
  fs.ensureDirSync(s34mpDir.value);
  await decompressJwpub(s34mpFile.value, s34mpDir.value, true);
  populatePublicTalks();
};

const dismissPopup = () => {
  localValue.value = false;
};

const { t } = useI18n();

const addPublicTalkMedia = (publicTalkDocId: DocumentItem) => {
  if (!s34mpDb.value || !publicTalkDocId) return;
  addJwpubDocumentMediaToFiles(s34mpDb.value, publicTalkDocId).then(
    (errors) => {
      if (errors?.length)
        errors.forEach((e) =>
          createTemporaryNotification({
            caption: [e.pub, e.issue, e.track, e.langwritten, e.fileformat]
              .filter(Boolean)
              .join('_'),
            icon: 'mmm-error',
            message: t('file-not-available'),
            timeout: 15000,
            type: 'negative',
          }),
        );
    },
  );
  dismissPopup();
};

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
    if (currentSettings.value?.lang) {
      s34mpBasename.value = 'S-34mp_' + currentSettings.value?.lang + '_0';
      s34mpDir.value = path.join(getPublicationsPath(), s34mpBasename.value);
      populatePublicTalks();
    }
  },
);
</script>
