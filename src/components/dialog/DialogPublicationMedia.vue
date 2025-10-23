<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId">
    <div
      class="bg-secondary-contrast flex large-overlay q-px-none medium-overlay"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg">
        <div class="col">{{ t('publication-media') }}</div>
        <div class="col-shrink">
          <q-spinner v-if="loading" color="primary" />
          <!-- <q-icon v-else color="accent-400" name="mmm-cloud-done" /> -->
        </div>
      </div>
      <div class="text-subtitle2 q-pb-sm q-px-md">
        <q-breadcrumbs>
          <q-breadcrumbs-el
            v-for="(crumb, i) in breadcrumbs"
            :key="i"
            :label="crumb"
          />
        </q-breadcrumbs>
      </div>

      <div class="q-px-md overflow-auto row" style="flex: 1 1 auto">
        <div class="col-12">
          <div v-if="step === 'category'" class="row q-pt-sm q-pb-sm">
            <q-list class="full-width">
              <q-item
                v-for="cat in categoryItems"
                :key="cat.key"
                v-ripple
                clickable
                :disable="loading"
                @click="selectCategory(cat.key)"
              >
                <q-item-section avatar class="jw-icon">
                  <q-avatar>{{ cat.icon }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(cat.key) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-else-if="step === 'magazineType'" class="row q-pt-sm q-pb-sm">
            <q-list class="full-width">
              <q-item
                v-for="choice in magazineChoices"
                :key="choice.optionValue"
                v-ripple
                clickable
                :disable="loading"
                @click="selectMagazine(choice)"
              >
                <q-item-section avatar class="jw-icon">
                  <q-avatar>
                    {{ magazineTypeIcons.get(choice.optionValue.toString()) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ choice.optionName }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div
            v-else-if="step === 'publicationListing'"
            class="row q-pt-sm q-pb-sm"
          >
            <q-list class="full-width">
              <q-item v-if="loading && publicationItems.length === 0" disable>
                <q-item-section avatar>
                  <q-spinner color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('loading') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-else-if="publicationItems.length === 0" disable>
                <q-item-section>
                  <q-item-label>{{ t('no-media-for-this-item') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                v-for="choice in publicationItems"
                :key="choice.optionValue"
                v-ripple
                clickable
                :disable="loading || !choice.available"
                @click="selectPublication(choice)"
              >
                <q-item-section>
                  <q-item-label>{{
                    decodeEntities(choice.optionName)
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    :color="choice.downloaded ? 'positive' : 'grey'"
                    :name="
                      choice.available
                        ? choice.downloaded
                          ? 'mmm-cloud-done'
                          : 'mmm-cloud-outline'
                        : 'mmm-cloud-error-outline'
                    "
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-else-if="step === 'year'" class="row q-pt-sm q-pb-sm">
            <q-list class="full-width">
              <q-item v-if="loading && yearChoices.length === 0" disable>
                <q-item-section avatar>
                  <q-spinner color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('loading') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-else-if="yearChoices.length === 0" disable>
                <q-item-section>
                  <q-item-label>{{ t('no-years-found') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                v-for="choice in yearChoices"
                :key="choice.optionValue"
                v-ripple
                clickable
                :disable="loading"
                @click="selectYear(choice)"
              >
                <q-item-section>
                  <q-item-label>{{
                    decodeEntities(choice.optionName)
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-else-if="step === 'month'" class="row q-pt-sm q-pb-sm">
            <q-list class="full-width">
              <q-item v-if="loading && monthChoices.length === 0" disable>
                <q-item-section avatar>
                  <q-spinner color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t('loading') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-else-if="monthChoices.length === 0" disable>
                <q-item-section>
                  <q-item-label>{{ t('no-months-found') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                v-for="m in monthChoices"
                :key="m.value"
                v-ripple
                clickable
                :disable="loading || !m.available"
                @click="selectMonth(m.value)"
              >
                <q-item-section>
                  <q-item-label>
                    {{
                      selection.category === 'magazines'
                        ? m.label + ' ' + selection.year
                        : m.label
                    }}
                  </q-item-label>
                  <q-item-label v-if="m.available === false" caption>
                    {{ t('no-issue-found') }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    :color="m.downloaded ? 'positive' : 'grey'"
                    :name="
                      m.downloaded
                        ? 'mmm-cloud-done'
                        : m.available
                          ? 'mmm-cloud-outline'
                          : 'mmm-cloud-error-outline'
                    "
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-else-if="step === 'article'" class="row q-pt-sm q-pb-sm">
            <q-list class="full-width">
              <q-item
                v-for="doc in documents"
                :key="doc.DocumentId"
                v-ripple
                clickable
                :disable="loading || !docHasMedia.has(doc.DocumentId)"
                @click="importDocument(doc)"
              >
                <q-item-section avatar>
                  <q-avatar
                    v-if="docPreviews[doc.DocumentId]"
                    class="rounded-borders"
                    square
                  >
                    <img :src="docPreviews[doc.DocumentId]" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ doc.Title }}</q-item-label>
                </q-item-section>
                <q-item-section v-if="!docHasMedia.has(doc.DocumentId)" side>
                  <q-icon color="grey" name="mmm-info">
                    <q-tooltip>{{ t('no-media-for-this-item') }}</q-tooltip>
                  </q-icon>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>

      <div class="row q-px-md q-py-md justify-between">
        <div>
          <q-btn
            v-if="canGoBack"
            color="primary"
            flat
            :label="t('back')"
            @click="goBack"
          />
        </div>
        <div class="q-gutter-sm">
          <q-btn
            color="negative"
            flat
            :label="t('cancel')"
            @click="cancelDialog"
          />
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import type {
  DocumentItem,
  JwLangCode,
  MediaSectionIdentifier,
  PublicationFetcher,
} from 'src/types';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addJwpubDocumentMediaToFiles,
  getDbFromJWPUB,
} from 'src/helpers/jw-media';
import { fetchJson, fetchPubMediaLinks } from 'src/utils/api';
import { getLocalDate } from 'src/utils/date';
import { getPublicationDirectoryContents } from 'src/utils/fs';
import { decodeEntities } from 'src/utils/general';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface FilterChoice {
  optionName: string;
  optionValue: number | string;
}

const props = defineProps<{
  dialogId: string;
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

const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentLangObject, currentSettings } = storeToRefs(currentState);

const { t } = useI18n();
const { dateLocale } = useLocale();

const step = ref<
  | 'article'
  | 'category'
  | 'magazineType'
  | 'month'
  | 'publicationListing'
  | 'year'
>('category');
const loading = ref(false);
const canGoBack = computed(() => step.value !== 'category');

const magazineChoices = ref<FilterChoice[]>([]);
const publicationItems = ref<
  (FilterChoice & { available?: boolean; downloaded?: boolean })[]
>([]);
const yearChoices = ref<FilterChoice[]>([]);
const monthChoices = ref<
  { available?: boolean; downloaded?: boolean; label: string; value: number }[]
>([]);

const selection = reactive({
  brochureLabel: '' as string,
  category: '' as string,
  dbPath: '' as string,
  month: 0 as number,
  publication: '' as string,
  year: '' as number | string,
});

const documents = ref<DocumentItem[]>([]);
const docPreviews = ref<Record<number, string>>({});
const docHasMedia = ref<Set<number>>(new Set());

watch(
  () => dialogValue.value,
  async (isOpen) => {
    if (isOpen) {
      resetState();
    }
  },
);

const breadcrumbs = computed(() => {
  const items: string[] = [];
  if (selection.category) {
    items.push(t(selection.category));
  }
  if (selection.publication) {
    const label = magazineChoices.value.find(
      (c) => String(c.optionValue) === selection.publication,
    )?.optionName;
    if (label) items.push(label);
  }
  if (selection.brochureLabel) items.push(selection.brochureLabel);
  if (selection.year) items.push(String(selection.year));
  if (selection.month) {
    const y = Number(selection.year) || new Date().getFullYear();
    const mLabel = getLocalDate(
      new Date(y, selection.month - 1, 1),
      dateLocale.value,
      'MMMM',
    );
    if (mLabel) items.push(mLabel);
  }

  return items;
});

async function buildDocumentHasMedia(db: string) {
  try {
    const { executeQuery } = window.electronApi;
    const hasDocMM = !!executeQuery<{ name: string }>(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
    )?.length;

    let ids: { DocumentId: number }[] = [];
    if (hasDocMM) {
      ids =
        executeQuery<{ DocumentId: number }>(
          db,
          `SELECT DISTINCT DocumentMultimedia.DocumentId as DocumentId
           FROM DocumentMultimedia
           JOIN Multimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId`,
        ) || [];
    } else {
      ids =
        executeQuery<{ DocumentId: number }>(
          db,
          `SELECT DISTINCT DocumentId FROM Multimedia WHERE DocumentId IS NOT NULL`,
        ) || [];
    }
    docHasMedia.value = new Set(ids.map((r) => r.DocumentId));
  } catch (e) {
    errorCatcher(e);
    docHasMedia.value = new Set();
  }
}

async function buildDocumentPreviews(db: string) {
  try {
    docPreviews.value = {};
    if (!db || !documents.value?.length) return;
    const { executeQuery, path, pathToFileURL } = window.electronApi;
    // Check if DocumentMultimedia table exists
    const hasDocMM = !!executeQuery<{ name: string }>(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
    )?.length;

    const baseDir = path.dirname(db);
    for (const doc of documents.value) {
      if (!doc?.DocumentId) continue;
      let previewPath: string | undefined;
      if (hasDocMM) {
        // Prefer first image via DocumentMultimedia link
        const res = executeQuery<{ FilePath: string }>(
          db,
          `SELECT Multimedia.FilePath
           FROM DocumentMultimedia
           JOIN Multimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
           WHERE DocumentMultimedia.DocumentId = ${doc.DocumentId}
             AND Multimedia.MimeType LIKE '%image%'
           ORDER BY DocumentMultimedia.BeginParagraphOrdinal
           LIMIT 1`,
        );
        previewPath = res?.[0]?.FilePath;
      }
      if (!previewPath) {
        // Fallback: any image directly linked to this Document
        const res2 = executeQuery<{ FilePath: string }>(
          db,
          `SELECT FilePath
           FROM Multimedia
           WHERE DocumentId = ${doc.DocumentId}
             AND MimeType LIKE '%image%'
           ORDER BY MultimediaId
           LIMIT 1`,
        );
        previewPath = res2?.[0]?.FilePath;
      }
      if (!previewPath) continue;
      try {
        const abs = path.join(baseDir, previewPath);
        const url = pathToFileURL(abs)?.toString();
        if (url) docPreviews.value[doc.DocumentId] = url;
      } catch (err) {
        errorCatcher(err);
      }
    }
  } catch (e) {
    errorCatcher(e);
  }
}

const magazineTypeIcons = new Map([
  ['g', '\ue61b'],
  ['w', '\ue6ea'],
  ['wp', '\ue6ea'],
  ['ws', '\ue6eb'],
]);

const categoryItems: readonly {
  icon: string;
  key: string;
}[] = [
  { icon: '\ue67c', key: 'magazines' },
  { icon: '\ue680', key: 'meeting-workbooks' },
  { icon: '\ue62d', key: 'brochures-and-booklets' },
  { icon: '\ue6dc', key: 'tracts-and-invitations' },
  { icon: '\ue601', key: 'programs' },
];

async function buildMonthChoices() {
  try {
    loading.value = true;
    const lang = (currentSettings.value?.lang || 'E') as JwLangCode;
    const pub = selection.publication;
    const year = selection.year;
    const promises = Array.from({ length: 12 }, async (_, idx) => {
      const m = idx + 1;
      const issueBase = `${year}${m.toString().padStart(2, '0')}`;
      const issue =
        Number(year) <= 2015 && pub === 'w'
          ? `${issueBase}15`
          : Number(year) <= 2015 && pub === 'wp'
            ? `${issueBase}01`
            : `${issueBase}00`;
      const pubFetcher: PublicationFetcher = {
        fileformat: 'JWPUB',
        issue,
        langwritten: lang,
        pub,
      };
      const info = await fetchPubMediaLinks(
        pubFetcher,
        urlVariables.value.pubMedia,
        true,
      );
      const available = !!info?.files?.[lang]?.JWPUB?.length;
      let downloaded = false;
      if (available) {
        const files = await getPublicationDirectoryContents(pubFetcher);
        downloaded = (files?.length || 0) > 0;
      }
      const y = Number(year) || new Date().getFullYear();
      const label = getLocalDate(
        new Date(y, m - 1, 1),
        dateLocale.value,
        'MMMM',
      );
      return { available, downloaded, label: label || String(m), value: m };
    });
    const checks = await Promise.all(promises);
    monthChoices.value = checks.filter((c) => c.available);
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
}

async function buildPublicationItemsWithStatus(
  raw: FilterChoice[],
): Promise<(FilterChoice & { available?: boolean; downloaded?: boolean })[]> {
  const lang = (currentSettings.value?.lang || 'E') as JwLangCode;
  return Promise.all(
    raw.map(async (c) => {
      const pubFetcher: PublicationFetcher = {
        fileformat: 'JWPUB',
        issue: 0,
        langwritten: lang,
        pub: String(c.optionValue),
      };
      const info = await fetchPubMediaLinks(
        pubFetcher,
        urlVariables.value.pubMedia,
        true,
      );
      const available = !!info?.files?.[lang]?.JWPUB?.length;
      let downloaded = false;
      if (available) {
        const files = await getPublicationDirectoryContents(pubFetcher);
        downloaded = (files?.length || 0) > 0;
      }
      return { ...c, available, downloaded };
    }),
  );
}

function cancelDialog() {
  resetState();
  dialogValue.value = false;
  emit('cancel');
}

function goBack() {
  if (step.value === 'article') {
    documents.value = [];
    docPreviews.value = {};
    docHasMedia.value = new Set();
    selection.dbPath = '';
    if (
      selection.category === 'brochures-and-booklets' ||
      selection.category === 'tracts-and-invitations' ||
      selection.category === 'programs'
    ) {
      step.value = 'publicationListing';
      selection.brochureLabel = '';
    } else {
      step.value = 'month';
      selection.month = 0;
    }
    return;
  }
  if (step.value === 'month') {
    documents.value = [];
    docPreviews.value = {};
    docHasMedia.value = new Set();
    selection.dbPath = '';
    selection.month = 0;
    selection.year = '';
    step.value = 'year';
    return;
  }
  if (step.value === 'year') {
    documents.value = [];
    docPreviews.value = {};
    docHasMedia.value = new Set();
    selection.dbPath = '';
    selection.year = '';
    selection.publication = '';
    selection.category = '';

    selection.month = 0;
    step.value =
      selection.category === 'magazines' ? 'magazineType' : 'category';
    return;
  }
  if (step.value === 'magazineType' || step.value === 'publicationListing') {
    documents.value = [];
    docPreviews.value = {};
    docHasMedia.value = new Set();
    selection.dbPath = '';
    selection.publication = '';
    selection.brochureLabel = '';
    selection.year = '';
    selection.month = 0;
    selection.category = '';
    step.value = 'category';
  }
}

async function importDocument(doc: DocumentItem) {
  try {
    if (!selection.dbPath) return;
    dialogValue.value = false;
    emit('ok');
    await addJwpubDocumentMediaToFiles(selection.dbPath, doc, props.section);
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
}

function resetState() {
  step.value = 'category';
  loading.value = false;
  selection.category = '';
  selection.publication = '';
  selection.brochureLabel = '';
  selection.year = '';
  selection.month = 0;
  selection.dbPath = '';
  documents.value = [];
  magazineChoices.value = [];
  publicationItems.value = [];
  yearChoices.value = [];
  monthChoices.value = [];
}

async function selectCategory(key: string) {
  try {
    selection.category = key;
    if (key === 'magazines') {
      magazineChoices.value = [
        { optionName: t('magazine-watchtower-study'), optionValue: 'w' },
        {
          optionName: t('magazine-watchtower-study-simplified'),
          optionValue: 'ws',
        },
        { optionName: t('magazine-watchtower-public'), optionValue: 'wp' },
        { optionName: t('magazine-awake'), optionValue: 'g' },
      ];
      step.value = 'magazineType';
      loading.value = false;
    } else if (key === 'meeting-workbooks') {
      // Meeting Workbooks: fixed publication symbol 'mwb'
      selection.publication = 'mwb';
      step.value = 'year';
      loading.value = true;
      // Fetch years for Meeting Workbook
      const url = `https://www.jw.org/en/library/jw-meeting-workbook/json/filters/IssueYearViewsFilter/`;
      const result = await fetchJson<{ choices: FilterChoice[]; id: string }>(
        url,
        new URLSearchParams({
          contentLanguageFilter: currentLangObject.value?.symbol || 'en',
          pubFilter: 'mwb',
          yearFilter: '',
        }),
      );
      yearChoices.value = (result?.choices || []).filter(
        (c) => c.optionName && c.optionValue !== '',
      );
    } else if (key === 'brochures-and-booklets') {
      // Fetch brochure/booklet list
      step.value = 'publicationListing';
      loading.value = true;
      const url = `https://www.jw.org/en/library/brochures/json/filters/PseudoSearchViewsFilter/`;
      const result = await fetchJson<{ choices: FilterChoice[]; id: string }>(
        url,
        new URLSearchParams({
          contentLanguageFilter: currentLangObject.value?.symbol || 'en',
          pubFilter: '',
          sortBy: '1',
        }),
      );
      publicationItems.value = await buildPublicationItemsWithStatus(
        (result?.choices || []).filter(
          (c) => c.optionName && c.optionValue !== '',
        ),
      );
    } else if (key === 'tracts-and-invitations') {
      // Fetch tracts and invitations list
      step.value = 'publicationListing';
      loading.value = true;
      const url = `https://www.jw.org/en/library/tracts/json/filters/PseudoSearchViewsFilter/`;
      const result = await fetchJson<{ choices: FilterChoice[]; id: string }>(
        url,
        new URLSearchParams({
          contentLanguageFilter: currentLangObject.value?.symbol || 'en',
          pubFilter: '',
          sortBy: '1',
        }),
      );
      publicationItems.value = await buildPublicationItemsWithStatus(
        (result?.choices || []).filter(
          (c) => c.optionName && c.optionValue !== '',
        ),
      );
    } else if (key === 'programs') {
      // Fetch programs list
      step.value = 'publicationListing';
      loading.value = true;
      const url = `https://www.jw.org/en/library/programs/json/filters/PseudoSearchViewsFilter/`;
      const result = await fetchJson<{ choices: FilterChoice[]; id: string }>(
        url,
        new URLSearchParams({
          contentLanguageFilter: currentLangObject.value?.symbol || 'en',
          pubFilter: '',
          sortBy: '1',
        }),
      );
      publicationItems.value = await buildPublicationItemsWithStatus(
        (result?.choices || []).filter(
          (c) => c.optionName && c.optionValue !== '',
        ),
      );
    }
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
}

async function selectMagazine(choice: FilterChoice) {
  try {
    selection.publication = String(choice.optionValue);
    step.value = 'year';
    loading.value = true;
    // Fetch year list for selected magazine
    const url = `https://www.jw.org/en/library/magazines/json/filters/IssueYearViewsFilter/`;
    const result = await fetchJson<{ choices: FilterChoice[]; id: string }>(
      url,
      new URLSearchParams({
        contentLanguageFilter: currentLangObject.value?.symbol || 'en',
        pubFilter: selection.publication,
        yearFilter: '',
      }),
    );
    yearChoices.value = (result?.choices || []).filter(
      (c) => c.optionName && c.optionValue !== '',
    );
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
}

async function selectMonth(m: number) {
  try {
    selection.month = m;
    loading.value = true;
    // Download jwpub and open DB
    const lang = currentSettings.value?.lang || 'E';
    const pub = selection.publication;
    const baseIssue = `${selection.year}${m.toString().padStart(2, '0')}`;
    const issue =
      Number(selection.year) <= 2015 && pub === 'w'
        ? `${baseIssue}15`
        : Number(selection.year) <= 2015 && pub === 'wp'
          ? `${baseIssue}01`
          : `${baseIssue}00`;

    const db = await getDbFromJWPUB({
      fileformat: 'JWPUB',
      issue,
      langwritten: lang,
      pub,
    });
    if (!db) {
      loading.value = false;
      return;
    }
    selection.dbPath = db;
    console.log(' [selectMonth] DB path:', db);
    // Load articles (documents)
    const docs = window.electronApi.executeQuery<DocumentItem>(
      db,
      `SELECT DocumentId, Title FROM Document WHERE Type <> 1 ORDER BY DocumentId`,
    );
    documents.value = docs;
    await buildDocumentHasMedia(db);
    await buildDocumentPreviews(db);
    step.value = 'article';
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
}

async function selectPublication(choice: FilterChoice) {
  try {
    loading.value = true;
    selection.publication = String(choice.optionValue);
    selection.brochureLabel = decodeEntities(choice.optionName);
    // Fetch media links to discover a valid JWPUB issue for the brochure
    const lang = (currentSettings.value?.lang || 'E') as JwLangCode;
    const info = await fetchPubMediaLinks(
      { fileformat: 'JWPUB', langwritten: lang, pub: selection.publication },
      urlVariables.value.pubMedia,
      true,
    );
    console.log(
      '🔄 [selectPublication] info:',
      info,
      selection.publication,
      lang,
    );
    const jwpubList = info?.files?.[lang]?.JWPUB as
      | undefined
      | { issue?: string }[];
    console.log('🔄 [selectPublication] jwpubList:', jwpubList);
    // Download jwpub and open DB
    const db = await getDbFromJWPUB({
      fileformat: 'JWPUB',
      issue: 0,
      langwritten: lang,
      pub: selection.publication,
    });
    console.log('🔄 [selectPublication] db:', db);
    if (!db) {
      loading.value = false;
      return;
    }
    selection.dbPath = db;
    const docs = window.electronApi.executeQuery<DocumentItem>(
      db,
      `SELECT DocumentId, Title FROM Document WHERE Type <> 1 ORDER BY DocumentId`,
    );
    console.log('🔄 [selectPublication] docs:', docs);
    documents.value = docs;
    await buildDocumentHasMedia(db);
    await buildDocumentPreviews(db);
    step.value = 'article';
  } catch (e) {
    errorCatcher(e);
  } finally {
    loading.value = false;
  }
}

async function selectYear(choice: FilterChoice) {
  selection.year = String(choice.optionValue);
  step.value = 'month';
  // Build months and probe availability
  await buildMonthChoices();
}
</script>
