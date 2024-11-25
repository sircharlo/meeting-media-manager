<template>
  <q-dialog v-model="open">
    <div
      class="items-center q-pb-lg q-px-sm q-gutter-y-lg bg-secondary-contrast"
    >
      <div class="text-h6 row q-px-md">{{ $t('import-media-from-s34mp') }}</div>
      <div class="row q-px-md">
        {{ $t('select-s34mp-to-add-public-talk-media') }}
      </div>
      <div class="row items-center q-gutter-x-md q-px-md">
        <q-icon name="mmm-file" size="md" />
        <div class="col text-subtitle2">
          {{
            s34mpDb
              ? path.basename(s34mpDb, path.extname(s34mpDb))
              : $t('select-s34mp')
          }}
        </div>
        <div v-if="s34mpDb || s34mpFile" class="col-grow text-caption">
          <template
            v-if="s34mpDb && s34mpInfo && filteredPublicTalks.length > 0"
          >
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
        <div class="row q-px-md">
          <q-input
            v-model="filter"
            class="col"
            clearable
            debounce="100"
            dense
            :label="$t('search')"
            outlined
            spellcheck="false"
          >
            <template #prepend>
              <q-icon name="mmm-search" />
            </template>
          </q-input>
        </div>
        <div class="row custom-scroll" style="max-height: 30vh">
          <template v-for="publicTalk in filteredPublicTalks" :key="publicTalk">
            <q-item
              v-ripple
              class="items-center q-mx-md"
              clickable
              @click="addPublicTalkMedia(publicTalk)"
            >
              {{ publicTalk.Title }}
            </q-item>
          </template>
        </div>
      </template>
      <div class="row justify-end q-px-md">
        <q-btn
          color="negative"
          flat
          :label="$t('cancel')"
          @click="dismissPopup"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { DocumentItem, MediaSection, PublicationInfo } from 'src/types';

import { storeToRefs } from 'pinia';
import { getPublicationsPath } from 'src/helpers/fs';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { decompressJwpub, findDb } from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, ref, watch } from 'vue';

const { executeQuery, fs, openFileDialog, path } = window.electronApi;

const props = defineProps<{
  section?: MediaSection;
}>();

const open = defineModel<boolean>({ required: true });

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const filter = ref('');
const publicTalks = ref<DocumentItem[]>([]);
const filteredPublicTalks = computed((): DocumentItem[] => {
  if (filter.value) {
    const searchTerms = filter.value
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term);
    return publicTalks.value.filter((s) =>
      searchTerms.every((term) => s.Title.toLowerCase().includes(term)),
    );
  }
  return publicTalks.value;
});

const s34mpBasename = ref<string | undefined>();
const s34mpFile = ref<string | undefined>();
const s34mpDir = ref<string | undefined>();
const s34mpDb = ref<string | undefined>();
const s34mpInfo = ref<null | PublicationInfo>(null);

const populatePublicTalks = async () => {
  s34mpDb.value = await findDb(s34mpDir.value);
  if (!s34mpDb.value) return;
  publicTalks.value = executeQuery<DocumentItem>(
    s34mpDb.value,
    'SELECT DISTINCT Document.DocumentId, Title FROM Document INNER JOIN DocumentMultimedia ON Document.DocumentId = DocumentMultimedia.DocumentId',
  );
  const PublicationInfos = executeQuery<PublicationInfo>(
    s34mpDb.value,
    'SELECT DISTINCT VersionNumber, Year FROM Publication',
  );
  if (PublicationInfos.length) s34mpInfo.value = PublicationInfos[0];
};

const browse = async () => {
  const s34mpFileSelection = await openFileDialog(true, 'jwpub');
  if (!s34mpFileSelection || !s34mpFileSelection.filePaths.length) return;
  s34mpFile.value = s34mpFileSelection.filePaths[0];
  if (s34mpDir.value) await fs.ensureDir(s34mpDir.value);
  await decompressJwpub(s34mpFile.value, s34mpDir.value, true);
  populatePublicTalks();
};

const dismissPopup = () => {
  open.value = false;
};

const addPublicTalkMedia = (publicTalkDocId: DocumentItem) => {
  if (!s34mpDb.value || !publicTalkDocId) return;
  addJwpubDocumentMediaToFiles(
    s34mpDb.value,
    publicTalkDocId,
    props.section,
  ).then(dismissPopup);
};

const setS34mp = async () => {
  s34mpBasename.value = 'S-34mp_' + currentSettings.value?.lang + '_0';
  s34mpDir.value = path.join(await getPublicationsPath(), s34mpBasename.value);
};

watch(open, () => {
  if (currentSettings.value?.lang) {
    setS34mp().then(() => {
      populatePublicTalks();
    });
  }
});
</script>
