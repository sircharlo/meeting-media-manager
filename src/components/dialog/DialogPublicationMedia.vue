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

      <!-- Search Input -->
      <div
        v-if="step === 'search' || step === 'category'"
        class="q-px-md q-pb-md"
      >
        <q-input
          v-model="searchQuery"
          clearable
          dense
          :loading="loading"
          outlined
          :placeholder="t('search-placeholder')"
          @clear="clearSearch"
          @keyup="onSearchInput"
        >
          <!-- <template #append>
            <q-btn
              :disable="!searchQuery.trim() || loading"
              flat
              icon="search"
              @click="performSearch"
            />
          </template> -->
        </q-input>
      </div>

      <div class="q-px-md overflow-auto row" style="flex: 1 1 auto">
        <div class="col-12">
          <template v-if="searchQuery && step === 'search'">
            <!-- No Results -->
            <div
              v-if="!loading && searchResults.length === 0"
              class="row q-pt-sm q-pb-sm"
            >
              <q-list class="full-width">
                <q-item disable>
                  <q-item-section>
                    <q-item-label>{{ t('no-search-results') }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Search Results Grid -->
            <div
              v-else-if="searchResults.length > 0 || loading"
              class="row q-pt-sm q-pb-sm"
            >
              <div class="col-12">
                <div v-if="!loading" class="text-subtitle2 q-pb-sm">
                  {{
                    t('search-results-count', { count: searchResults.length })
                  }}
                </div>
                <div class="row q-col-gutter-md">
                  <!-- Loading skeletons -->
                  <template v-if="loading && searchResults.length === 0">
                    <div
                      v-for="skeletonIndex in 6"
                      :key="skeletonIndex"
                      class="col-xs-6 col-sm-4 col-md-3 col-lg-2 col-xl-1"
                    >
                      <div class="rounded-borders-lg overflow-hidden">
                        <q-skeleton
                          :ratio="1"
                          style="height: 96px"
                          type="rect"
                        />
                        <div class="q-pa-sm">
                          <q-skeleton
                            class="q-mb-xs"
                            height="12px"
                            type="text"
                            width="60%"
                          />
                          <q-skeleton
                            class="q-mb-xs"
                            height="14px"
                            type="text"
                            width="90%"
                          />
                          <q-skeleton height="12px" type="text" width="70%" />
                        </div>
                      </div>
                    </div>
                  </template>
                  <!-- Actual results -->
                  <template v-else>
                    <div
                      v-for="result in searchResults"
                      :key="`${result.type}-${result.subtype}-${result.insight.rank}`"
                      class="col-xs-6 col-sm-4 col-md-3 col-lg-2 col-xl-1"
                    >
                      <q-card
                        class="search-result-card cursor-pointer overflow-hidden"
                        :class="{
                          disabled: loading,
                        }"
                        @click="!loading && selectSearchResult(result)"
                      >
                        <!-- {{ result }} -->
                        <q-card-section class="q-pa-none">
                          <q-img
                            :alt="result.title"
                            class="search-result-image"
                            fit="contain"
                            :ratio="1 / 1"
                            :src="result.image.url || 'error'"
                          >
                            <template #error>
                              <div
                                class="absolute-full flex flex-center text-secondary"
                              >
                                <q-icon name="mmm-image-broken" size="10vw" />
                              </div>
                            </template>
                          </q-img>
                        </q-card-section>
                        <q-card-section class="q-pt-md">
                          <div class="text-caption text-grey-6 q-mb-xs">
                            {{ decodeEntities(result.context) }}
                          </div>
                          <div class="text-body2 text-weight-medium q-mb-sm">
                            {{ decodeEntities(result.title) }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{ decodeEntities(result.snippet) }}
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>
          <div
            v-if="step === 'category' || (step === 'search' && !searchQuery)"
            class="row q-pt-sm q-pb-sm"
          >
            <q-list class="full-width">
              <q-item
                v-for="category in categoryItems"
                :key="category"
                v-ripple
                clickable
                :disable="loading"
                @click="selectCategory(category)"
              >
                <q-item-section avatar class="jw-icon">
                  <q-avatar>{{ jwIcons[category] }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ t(category) }}</q-item-label>
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
                    {{ jwIcons[choice.optionValue.toString()] }}
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
                :disable="isProcessing || !docHasMedia.has(doc.DocumentId)"
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

          <div v-else-if="step === 'media'" class="row q-pt-sm q-pb-sm">
            <!-- Loading skeletons -->
            <template v-if="loading && mediaItems.length === 0">
              <div
                v-for="skeletonIndex in 12"
                :key="skeletonIndex"
                class="col col-xs-6 col-sm-4 col-md-3 col-lg-2"
              >
                <div class="rounded-borders-lg overflow-hidden">
                  <q-skeleton :ratio="1" type="rect" />
                  <div class="q-pa-sm">
                    <q-skeleton height="14px" type="text" width="90%" />
                  </div>
                </div>
              </div>
            </template>
            <!-- Actual media -->
            <template v-else>
              <div
                v-for="video in mediaItems"
                :key="video.file.url"
                class="col col-xs-6 col-sm-4 col-md-3 col-lg-2"
              >
                <div
                  v-ripple
                  :class="{
                    'cursor-pointer': !isProcessing,
                    'rounded-borders-lg': true,
                    'full-height': true,
                    'bg-accent-100': hoveredRemoteVideo === video.file.url,
                    disabled: isProcessing,
                  }"
                  flat
                  @click="!isProcessing && downloadMediaItem(video)"
                  @mouseout="hoveredRemoteVideo = ''"
                  @mouseover="hoveredRemoteVideo = video.file.url"
                >
                  <q-card-section class="q-pa-sm">
                    <q-img
                      class="rounded-borders"
                      :ratio="1"
                      :src="video.trackImage.url"
                    >
                      <q-badge
                        class="q-mt-sm q-ml-sm bg-semi-black rounded-borders-sm"
                        style="padding: 5px !important"
                      >
                        <q-icon class="q-mr-xs" color="white" name="mmm-play" />
                        {{ formatTime(video.duration) }}
                      </q-badge>
                      <div
                        class="absolute-bottom text-caption gradient-transparent-to-black"
                      >
                        {{ video.title }}
                      </div>
                    </q-img>
                  </q-card-section>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="row q-px-md q-py-md justify-between">
        <div>
          <q-btn
            v-if="canGoBack"
            color="primary"
            :disable="isProcessing"
            flat
            :label="t('back')"
            @click="goBack"
          />
        </div>
        <div class="q-gutter-sm">
          <q-btn
            color="negative"
            :disable="isProcessing"
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
  PublicationFiles,
  SearchResultItem,
  SearchResults,
} from 'src/types';
import type { MediaLink } from 'src/types/jw/publications';

import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { jwIcons } from 'src/constants/jw-icons';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addJwpubDocumentMediaToFiles,
  downloadAdditionalRemoteVideo,
  getDbFromJWPUB,
  getJwMediaInfo,
  getPubMediaLinks,
} from 'src/helpers/jw-media';
import { fetchJson, fetchPubMediaLinks } from 'src/utils/api';
import { getLocalDate } from 'src/utils/date';
import { getPublicationDirectoryContents } from 'src/utils/fs';
import { decodeEntities } from 'src/utils/general';
import { findBestResolutions } from 'src/utils/jw';
import { tableExists } from 'src/utils/sqlite';
import { formatTime } from 'src/utils/time';
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
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const jwStore = useJwStore();
const { urlVariables } = storeToRefs(jwStore);

const currentState = useCurrentStateStore();
const { currentLangObject, currentSettings, selectedDate } =
  storeToRefs(currentState);

const { executeQuery, path, pathToFileURL } = window.electronApi;

const { t } = useI18n();
const { dateLocale } = useLocale();

const loading = ref(false);
const isProcessing = ref(false);
const step = ref<
  | 'article'
  | 'category'
  | 'magazineType'
  | 'media'
  | 'month'
  | 'publicationListing'
  | 'search'
  | 'year'
>('category');
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

// Search state
const searchQuery = ref('');
const searchResults = ref<SearchResultItem[]>([]);
const searchTimeout = ref<NodeJS.Timeout | null>(null);

// JWT token management
const jwtToken = ref<null | string>(null);
const tokenExpiry = ref<null | number>(null);

// Media items for search results (when no JWPUB available)
const mediaItems = ref<MediaLink[]>([]);
const hoveredRemoteVideo = ref('');

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
  if (
    searchQuery.value &&
    (step.value === 'search' || step.value === 'media')
  ) {
    items.push(t('search'));
    if (selection.brochureLabel) {
      items.push(selection.brochureLabel);
    }
    return items;
  }
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

    const baseDir = path.dirname(db);
    const hasDocMM = tableExists(db, 'DocumentMultimedia');

    const getFirstLinkedImage = (docId: number) => {
      if (!hasDocMM) return null;

      const sql = `
        SELECT Multimedia.FilePath
        FROM DocumentMultimedia
        JOIN Multimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
        WHERE DocumentMultimedia.DocumentId = ${docId}
          AND Multimedia.MimeType LIKE '%image%'
        ORDER BY DocumentMultimedia.BeginParagraphOrdinal
        LIMIT 1
      `;

      return executeQuery<{ FilePath: string }>(db, sql)?.[0]?.FilePath;
    };

    const getFallbackImage = (docId: number) => {
      const join = hasDocMM
        ? 'INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId'
        : '';

      const whereField = hasDocMM
        ? 'DocumentMultimedia.DocumentId'
        : 'Multimedia.DocumentId';

      const sql = `
        SELECT Multimedia.FilePath
        FROM Multimedia
        ${join}
        WHERE ${whereField} = ${docId}
          AND Multimedia.MimeType LIKE '%image%'
        ORDER BY Multimedia.MultimediaId
        LIMIT 1
      `;

      return executeQuery<{ FilePath: string }>(db, sql)?.[0]?.FilePath;
    };

    for (const doc of documents.value) {
      const docId = doc?.DocumentId;
      if (!docId) continue;

      const previewPath = getFirstLinkedImage(docId) || getFallbackImage(docId);

      if (!previewPath) continue;

      try {
        const abs = path.join(baseDir, previewPath);
        const url = pathToFileURL(abs)?.toString();
        if (url) docPreviews.value[docId] = url;
      } catch (err) {
        errorCatcher(err);
      }
    }
  } catch (err) {
    errorCatcher(err);
  }
}

// Search endpoints configuration
const searchEndpoints = ref([
  {
    enabled: true,
    name: 'Publications',
    queryParam: 'q',
    url: `https://b.jw-cdn.org/apis/search/results/${currentSettings.value?.lang}/publications`,
  },
]);

const categoryItems = [
  'magazines',
  'meeting-workbooks',
  'brochures-and-booklets',
  'tracts-and-invitations',
  'programs',
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
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
  loading.value = false;
  step.value = 'category';
}

async function downloadMediaItem(media: MediaLink) {
  try {
    isProcessing.value = true;

    // Use downloadAdditionalRemoteVideo to download the media
    await downloadAdditionalRemoteVideo(
      [media],
      selectedDate.value,
      media.trackImage.url,
      false,
      media.title || selection.brochureLabel,
      props.section,
    );
  } catch (error) {
    errorCatcher(error);
  } finally {
    isProcessing.value = false;
    dialogValue.value = false;
  }
}

async function fetchJwtToken(): Promise<boolean> {
  try {
    // Check if we have a valid token that hasn't expired
    if (jwtToken.value && tokenExpiry.value && Date.now() < tokenExpiry.value) {
      return true;
    }

    const response = await fetch('https://b.jw-cdn.org/tokens/jworg.jwt', {
      headers: {
        Accept: 'text/plain',
      },
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`JWT token fetch failed: ${response.status}`);
    }

    const token = await response.text();
    if (!token || token.length < 10) {
      throw new Error('Invalid JWT token received');
    }

    jwtToken.value = token;
    // Set expiry to 1 hour from now (tokens typically expire in 1 hour)
    tokenExpiry.value = Date.now() + 60 * 60 * 1000;

    return true;
  } catch (error) {
    jwtToken.value = null;
    tokenExpiry.value = null;
    errorCatcher(error);
    return false;
  }
}

function goBack() {
  if (step.value === 'article') {
    documents.value = [];
    docPreviews.value = {};
    docHasMedia.value = new Set();
    selection.dbPath = '';
    if (searchQuery.value) {
      step.value = 'search';
    } else if (
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
  } else if (step.value === 'search') {
    searchQuery.value = '';
    searchResults.value = [];
    step.value = 'category';
    return;
  } else if (step.value === 'media') {
    // Go back to search results
    mediaItems.value = [];
    step.value = 'search';
    return;
  } else if (step.value === 'month') {
    documents.value = [];
    docPreviews.value = {};
    docHasMedia.value = new Set();
    selection.dbPath = '';
    selection.month = 0;
    selection.year = '';
    step.value = 'year';
    return;
  } else if (step.value === 'year') {
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
  } else if (
    step.value === 'magazineType' ||
    step.value === 'publicationListing'
  ) {
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
    isProcessing.value = true;
    await addJwpubDocumentMediaToFiles(selection.dbPath, doc, props.section);
  } catch (e) {
    errorCatcher(e);
  } finally {
    isProcessing.value = false;
    dialogValue.value = false;
  }
}

function onSearchInput() {
  // Debounce search input
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    loading.value = false;
    return;
  }

  searchTimeout.value = setTimeout(() => {
    performSearch();
  }, 500);
}

async function performAuthenticatedSearch(
  url: string,
  params: URLSearchParams,
): Promise<SearchResults> {
  // Ensure we have a valid token
  const hasValidToken = await fetchJwtToken();
  if (!hasValidToken || !jwtToken.value) {
    throw new Error('Failed to obtain authentication token');
  }

  const searchUrl = `${url}?${params.toString()}`;

  const response = await fetch(searchUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${jwtToken.value}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });

  if (!response.ok) {
    // If token is expired (401), try to refresh and retry once
    if (response.status === 401) {
      jwtToken.value = null;
      tokenExpiry.value = null;

      const retrySuccess = await fetchJwtToken();
      if (retrySuccess && jwtToken.value) {
        const retryResponse = await fetch(searchUrl, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${jwtToken.value}`,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        });

        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
    }
    throw new Error(`Search request failed: ${response.status}`);
  }

  return await response.json();
}

async function performSearch() {
  if (!searchQuery.value.trim() || loading.value) return;

  loading.value = true;
  searchResults.value = [];
  step.value = 'search';

  try {
    const query = searchQuery.value.trim();
    const enabledEndpoints = searchEndpoints.value.filter(
      (endpoint) => endpoint.enabled && endpoint.url,
    );

    // Search all enabled endpoints in parallel
    const searchPromises = enabledEndpoints.map(async (endpoint) => {
      const params = new URLSearchParams({
        [endpoint.queryParam]: query,
      });

      const result = await performAuthenticatedSearch(endpoint.url, params);

      return result?.results || [];
    });

    const resultsArrays = await Promise.all(searchPromises);
    searchResults.value = resultsArrays.flat();

    // Sort results by rank
    searchResults.value.sort((a, b) => a.insight.rank - b.insight.rank);
  } catch (error) {
    console.error('Search error:', error);
    // Handle search error - could show a notification
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
  // Reset search state
  searchQuery.value = '';
  searchResults.value = [];
  mediaItems.value = [];
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
    searchTimeout.value = null;
  }
  // Clear JWT token on reset
  jwtToken.value = null;
  tokenExpiry.value = null;
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
    // Load articles (documents)
    const docs = executeQuery<DocumentItem>(
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
    // Download jwpub and open DB
    const lang = (currentSettings.value?.lang || 'E') as JwLangCode;
    const db = await getDbFromJWPUB({
      fileformat: 'JWPUB',
      issue: 0,
      langwritten: lang,
      pub: selection.publication,
    });
    if (!db) {
      loading.value = false;
      return;
    }
    selection.dbPath = db;
    const docs = executeQuery<DocumentItem>(
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

async function selectSearchResult(result: SearchResultItem) {
  try {
    loading.value = true;
    const jwOrgLink = result.links['jw.org'];
    if (!jwOrgLink) {
      loading.value = false;
      return;
    }
    const url = new URL(jwOrgLink);
    let publication = url.searchParams.get('pub');

    let issue = url.searchParams.get('issue');
    if (!publication) {
      loading.value = false;
      return;
    }

    // if pub format is g##, ws##, wp## or w##, strip the digits
    if (
      publication.startsWith('g') ||
      publication.startsWith('ws') ||
      publication.startsWith('wp') ||
      publication.startsWith('w')
    ) {
      publication = publication.replace(/\d+/, '');
    }

    if (!issue) {
      issue = '0';
    }

    // Special handling for wp
    if (
      publication === 'w' &&
      issue &&
      parseInt(issue.toString()) >= 20080101 &&
      issue.toString().slice(-2) === '01'
    ) {
      publication = 'wp';
    }

    // Special issue handling for w, wp and ws
    if (['w', 'wp', 'ws'].includes(publication)) {
      if (issue?.length < 8) {
        if (parseInt(issue?.slice(0, 4) || '0') <= 2015) {
          if (['w', 'ws'].includes(publication)) {
            issue = `${issue}15`;
          } else {
            issue = `${issue}01`;
          }
        } else {
          issue = `${issue}00`;
        }
      }
    }

    selection.publication = publication;
    selection.brochureLabel = result.title;
    const lang = (currentSettings.value?.lang || 'E') as JwLangCode;

    const mediaFetcher: PublicationFetcher = {
      issue,
      langwritten: lang,
      pub: publication,
    };

    const pubMediaLinks = await getPubMediaLinks(mediaFetcher);

    const jwpubFileArray = pubMediaLinks?.files?.[lang]?.JWPUB;
    const jwpubFileIsPresent = jwpubFileArray?.length;
    if (!jwpubFileIsPresent) {
      // Find the best media format (prefer MP4, then others)
      let mediaFiles: MediaLink[] = [];
      const formatPriority: (keyof PublicationFiles)[] = ['MP4', 'M4V', 'MP3'];

      for (const format of formatPriority) {
        const mediaFileLookup = pubMediaLinks?.files?.[lang]?.[
          format as keyof PublicationFiles
        ] as MediaLink[] | undefined;
        if (mediaFileLookup) {
          for (const mediaFile of mediaFileLookup) {
            if (pubMediaLinks?.pubImage?.url) {
              mediaFile.trackImage.url = pubMediaLinks.pubImage.url;
            } else {
              const mediaFetcherCopy: PublicationFetcher = { ...mediaFetcher };
              mediaFetcherCopy.fileformat = format;
              mediaFetcherCopy.track = mediaFile.track;
              const mediaInfo = await getJwMediaInfo(mediaFetcherCopy);
              mediaFile.trackImage.url = mediaInfo.thumbnail;
            }
          }
          mediaFiles = mediaFileLookup;
          break;
        }
      }

      mediaFiles = findBestResolutions(
        mediaFiles,
        currentSettings.value?.maxRes,
      );

      if (mediaFiles.length > 0) {
        // Set media items and switch to media step
        mediaItems.value = mediaFiles.map((mediaLink, index) => ({
          ...mediaLink,
          downloaded: false, // TODO: Check if already downloaded
          title: mediaLink.title || result.title || `Media ${index + 1}`,
        }));
        step.value = 'media';
        loading.value = false;
        return;
      } else {
        // No media files available
        console.log('❌ No media files available for:', publication);
        loading.value = false;
        return;
      }
    } else {
      const dbPath = await getDbFromJWPUB({
        fileformat: 'JWPUB',
        issue,
        langwritten: lang,
        pub: selection.publication,
      });
      if (!dbPath) {
        loading.value = false;
        return;
      }
      selection.dbPath = dbPath;
      const docs = executeQuery<DocumentItem>(
        dbPath,
        `SELECT DocumentId, Title FROM Document WHERE Type <> 1 ORDER BY DocumentId`,
      );
      documents.value = docs;
      await buildDocumentHasMedia(dbPath);
      await buildDocumentPreviews(dbPath);
      step.value = 'article';
    }
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
