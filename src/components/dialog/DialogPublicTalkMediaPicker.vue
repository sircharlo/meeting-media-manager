<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId">
    <div
      class="bg-secondary-contrast flex medium-overlay q-px-none"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg">
        {{ t('import-media-from-s34mp') }}
      </div>
      <div class="row q-px-md q-pt-md">
        {{
          s34Db ? t('select-s34mp-media') : t('select-s34mp-to-add-pt-media')
        }}
      </div>
      <div class="row q-px-md q-pt-md row items-center q-gutter-x-sm">
        <div class="row">
          <q-icon name="mmm-file" size="md" />
        </div>
        <div class="col text-subtitle2">
          {{ s34DisplayName }}
        </div>
        <div v-if="s34Db || s34File" class="col-grow text-caption">
          <template v-if="s34Db && s34Info && filteredPublicTalks.length > 0">
            {{ s34Info.Year }}, v{{ s34Info.VersionNumber }}
          </template>
          <q-spinner v-else color="primary" size="sm" />
        </div>
        <q-btn color="primary" outline @click="browse">
          <q-icon class="q-mr-sm" name="mmm-local-media" />
          {{ s34Db ? t('replace') : t('browse') }}
        </q-btn>
      </div>
      <template v-if="s34Db">
        <div class="row q-px-md q-py-md">
          <q-input
            v-model="filter"
            class="col"
            clearable
            debounce="100"
            dense
            :label="t('search')"
            outlined
            spellcheck="false"
          >
            <template #prepend>
              <q-icon name="mmm-search" />
            </template>
          </q-input>
        </div>
        <div class="col overflow-auto">
          <!-- Loading skeletons -->
          <template v-if="filteredPublicTalks.length === 0">
            <q-item
              v-for="skeletonIndex in 6"
              :key="skeletonIndex"
              class="items-center q-mx-md"
            >
              <q-item-section>
                <q-skeleton height="20px" type="text" width="100%" />
              </q-item-section>
            </q-item>
          </template>
          <!-- Actual talks -->
          <template v-else>
            <q-item
              v-for="publicTalk in filteredPublicTalks"
              :key="publicTalk.DocumentId"
              v-ripple
              class="items-center q-mx-md"
              clickable
              :disable="isProcessing"
              @click="addPublicTalkMedia(publicTalk)"
            >
              {{ publicTalk.Title }}
            </q-item>
          </template>
        </div>
      </template>
      <div class="row q-px-md q-py-md justify-end">
        <q-btn
          color="negative"
          flat
          :label="t('cancel')"
          @click="dismissPopup"
        />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  MediaSectionIdentifier,
  PublicationInfo,
} from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addJwpubDocumentMediaToFiles } from 'src/helpers/jw-media';
import { unzipJwpub } from 'src/helpers/mediaPlayback';
import { getPublicationsPath } from 'src/utils/fs';
import { findDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
  section: MediaSectionIdentifier | undefined;
}>();

const emit = defineEmits<{
  cancel: [];
  import: [data: { dbPath: string; doc: DocumentItem }];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const currentState = useCurrentStateStore();
const { currentCongregation, currentSettings } = storeToRefs(currentState);

const filter = ref('');
const publicTalks = ref<DocumentItem[]>([]);
const filteredPublicTalks = computed((): DocumentItem[] => {
  if (filter.value) {
    const searchTerms = filter.value.toLowerCase().split(/\s+/).filter(Boolean);
    return publicTalks.value.filter((s) =>
      searchTerms.every((term) => s.Title.toLowerCase().includes(term)),
    );
  }
  return publicTalks.value;
});

const s34Basename = ref<string | undefined>();
const s34File = ref<string | undefined>();
const s34Dir = ref<string | undefined>();
const s34Db = ref<string | undefined>();
const s34Info = ref<null | PublicationInfo>(null);
const isProcessing = ref<boolean>(false);

const { executeQuery, fs, openFileDialog, path } = globalThis.electronApi;
const { basename, extname, join } = path;

const { ensureDir } = fs;

const populatePublicTalks = async () => {
  s34Db.value = await findDb(s34Dir.value);
  if (!s34Db.value) return;
  publicTalks.value = executeQuery<DocumentItem>(
    s34Db.value,
    'SELECT DISTINCT Document.DocumentId, Title FROM Document INNER JOIN DocumentMultimedia ON Document.DocumentId = DocumentMultimedia.DocumentId',
  );
  const PublicationInfos = executeQuery<PublicationInfo>(
    s34Db.value,
    'SELECT DISTINCT VersionNumber, Year FROM Publication',
  );
  if (PublicationInfos[0]) s34Info.value = PublicationInfos[0];
};

const browse = async () => {
  const s34FileSelection = await openFileDialog(true, 'jwpub');
  if (!s34FileSelection || !s34FileSelection.filePaths.length) return;
  s34File.value = s34FileSelection.filePaths[0];
  if (!s34Dir.value) {
    await setS34Info();
  }
  if (s34Dir.value && s34File.value) {
    try {
      await ensureDir(s34Dir.value);
      await unzipJwpub(s34File.value, s34Dir.value, true);
      populatePublicTalks();
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'DialogPublicTalkMediaPicker browse ensureDir',
            s34Dir: s34Dir.value,
          },
        },
      });
    }
  }
};

const dismissPopup = () => {
  // Reset state when dialog is cancelled
  resetDialogState();
  dialogValue.value = false;
  emit('cancel');
};

const addPublicTalkMedia = async (publicTalkDocId: DocumentItem) => {
  if (!s34Db.value || !publicTalkDocId) return;

  if (!props.section) {
    emit('import', { dbPath: s34Db.value, doc: publicTalkDocId });
    dismissPopup();
    return;
  }

  isProcessing.value = true;
  try {
    await addJwpubDocumentMediaToFiles(
      s34Db.value,
      publicTalkDocId,
      props.section,
      {
        issue: currentCongregation.value,
        langwritten: '',
        pub: 'S-34',
      },
    );
    dismissPopup();
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'DialogPublicTalkMediaPicker addPublicTalkMedia',
          publicTalkDocId,
        },
      },
    });
  } finally {
    isProcessing.value = false;
  }
};

const setS34Info = async () => {
  s34Basename.value = `S-34_${currentCongregation.value}`;
  const publicationsPath = await getPublicationsPath();
  s34Dir.value = join(publicationsPath, s34Basename.value);
};

const s34DisplayName = computed((): string => {
  try {
    if (s34Db.value) return basename(s34Db.value, extname(s34Db.value));
    return t('select-s34mp');
  } catch (e) {
    errorCatcher(e, {
      contexts: {
        fn: {
          name: 'DialogPublicTalkMediaPicker s34DisplayName',
          s34Db: s34Db.value,
        },
      },
    });
    return t('select-s34mp');
  }
});

const resetDialogState = () => {
  // Reset all dialog state
  filter.value = '';
  publicTalks.value = [];
  s34File.value = undefined;
  s34Dir.value = undefined;
  s34Db.value = undefined;
  s34Info.value = null;
};

const initialize = async () => {
  if (currentSettings.value?.lang) {
    await setS34Info();
    await populatePublicTalks();
  }
};

// Watch for dialog closing to reset state
watch(
  () => dialogValue.value,
  (isOpen) => {
    if (isOpen) {
      // Initialize when dialog opens
      initialize();
    } else {
      // Reset state when dialog closes
      resetDialogState();
    }
  },
);
</script>
