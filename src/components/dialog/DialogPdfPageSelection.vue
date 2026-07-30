<template>
  <BaseDialog v-model="promptOpen" :dialog-id="dialogId" persistent>
    <q-card class="modal-confirm round-card large-overlay pdf-page-picker-card">
      <q-card-section
        class="row items-center no-wrap text-bigger text-semibold q-pb-none text-primary"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-file" size="xs" />
        </div>
        {{ t('pdf-page-selection-title') }}
      </q-card-section>

      <q-card-section>
        <div class="text-body2 text-dark-grey">
          {{ t('pdf-page-selection-prompt-help', { totalPages }) }}
        </div>
      </q-card-section>

      <!-- Scrolls internally while the header above and the footer/action
      buttons below stay fixed - same "one flex-column dialog, one scrolling
      section" idiom as DialogRemoteVideo.vue. -->
      <q-card-section class="pdf-page-picker__grid-section q-py-none">
        <div class="pdf-page-grid row q-col-gutter-sm">
          <div
            v-for="page in visiblePageNumbers"
            :key="page"
            class="col-4 col-sm-3 col-md-2"
          >
            <div
              v-ripple
              class="pdf-page-thumb cursor-pointer rounded-borders-lg relative-position"
              :class="{ 'pdf-page-thumb--selected': selectedPages.has(page) }"
              @click="togglePage(page)"
            >
              <q-img
                v-if="thumbnails[page]"
                class="rounded-borders-lg"
                :ratio="THUMBNAIL_ASPECT_RATIO"
                :src="thumbnails[page]"
              />
              <div
                v-else-if="failedPages.has(page)"
                class="bg-accent-100 rounded-borders-lg flex items-center justify-center"
                :style="{ aspectRatio: THUMBNAIL_ASPECT_RATIO }"
              >
                <q-icon color="grey" name="mmm-image-broken" size="1.5em" />
              </div>
              <div
                v-else
                class="bg-accent-100 rounded-borders-lg flex items-center justify-center"
                :style="{ aspectRatio: THUMBNAIL_ASPECT_RATIO }"
              >
                <q-spinner color="primary" size="1.5em" />
              </div>

              <div v-if="selectedPages.has(page)" class="grid-select-check">
                <q-icon color="white" name="mmm-check" size="xs" />
              </div>

              <div class="pdf-page-thumb__number text-caption text-center">
                {{ page }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="totalGridPages > 1" class="q-pb-none">
        <div class="row justify-center">
          <q-pagination
            v-model="gridPage"
            active-color="primary"
            color="secondary"
            direction-links
            flat
            :max="totalGridPages"
            :max-pages="10"
          />
        </div>
      </q-card-section>

      <!-- Same footer shape as DialogJwPlaylist.vue/DialogJwpubMediaPicker.vue:
      the select-all/deselect-all toggle and the Cancel/Confirm buttons share
      one row instead of stacking, and the selection count rides on the
      Confirm button's label instead of sitting in its own separate line. -->
      <div class="row items-center q-px-md q-py-md">
        <div class="col">
          <q-btn
            v-if="selectedPages.size < totalPages"
            color="primary"
            flat
            :label="t('select-all')"
            @click="selectAll"
          />
          <q-btn
            v-else-if="selectedPages.size === totalPages && totalPages > 0"
            color="primary"
            flat
            :label="t('deselect-all')"
            @click="deselectAll"
          />
        </div>
        <div class="col-shrink q-gutter-x-sm">
          <q-btn flat :label="t('cancel')" @click="cancelSelection" />
          <q-btn
            v-if="selectedPages.size"
            color="primary"
            flat
            :label="`${t('confirm')} (${selectedPages.size})`"
            @click="confirmSelection"
          />
        </div>
      </div>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
// Centralizes the "which pages do you want?" guard for large PDFs so every
// PDF-import entry point (JW.org publication PDFs, drag-and-drop, the file
// browser) behaves the same way instead of each one deciding independently
// whether to prompt - previously only DialogPublicationMedia.vue had this
// guard, so a PDF dragged/dropped or browsed-in directly (MediaCalendarPage's
// processImportFile) always converted every page, no matter how many.
import BaseDialog from 'components/dialog/BaseDialog.vue';
import {
  getNrOfPdfPages,
  openPdfThumbnailSession,
  type PdfThumbnailSession,
} from 'src/utils/converters';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  dialogId: string;
}>();

const { t } = useI18n();

// PDFs at or under this many pages convert in full with no prompt.
const PAGE_PROMPT_THRESHOLD = 5;
// Only this many thumbnails are ever rendered/held at once - larger PDFs
// paginate instead, keeping both memory use and render time bounded no
// matter how many pages the document actually has.
const GRID_PAGE_SIZE = 32;
// A generic portrait approximation - actual publications vary slightly, but
// this keeps the grid from jumping around while thumbnails load in.
const THUMBNAIL_ASPECT_RATIO = 0.75;

const promptOpen = ref(false);
const totalPages = ref(0);
const gridPage = ref(1);
const selectedPages = ref<Set<number>>(new Set());
const thumbnails = ref<Record<number, string>>({});
const loadingPages = ref<Set<number>>(new Set());
const failedPages = ref<Set<number>>(new Set());
let resolveSelection: ((value: null | Set<number>) => void) | null = null;
let thumbnailSession: null | PdfThumbnailSession = null;
// Bumped on every new selectPdfPages() call so a session that resolves late
// (e.g. the user cancelled and immediately re-imported a different PDF
// before the first session finished opening) can tell it's no longer the
// current request, even though promptOpen is already back to true for the
// new PDF by the time it resolves.
let sessionRequestId = 0;
// Serializes loadVisibleThumbnails() calls: watch(gridPage) can fire again
// before a previous run finishes (a 32-thumbnail page can take a few
// seconds one-at-a-time), and two overlapping runs would both call
// session.getThumbnail() concurrently against the same PDFParse instance -
// the exact "DataCloneError: ArrayBuffer is detached" failure this
// one-at-a-time design exists to avoid. Chaining onto this promise instead
// of calling runLoadVisibleThumbnails() directly guarantees only one run is
// ever in flight; each run still reads visiblePageNumbers fresh when its
// turn actually comes up, so a rapid string of page flips doesn't get
// stale data.
let loadChain: Promise<void> = Promise.resolve();

const totalGridPages = computed(() =>
  Math.max(1, Math.ceil(totalPages.value / GRID_PAGE_SIZE)),
);

const visiblePageNumbers = computed(() => {
  const start = (gridPage.value - 1) * GRID_PAGE_SIZE + 1;
  const end = Math.min(start + GRID_PAGE_SIZE - 1, totalPages.value);
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function cancelSelection() {
  promptOpen.value = false;
  teardownSession();
  resolveSelection?.(null);
  resolveSelection = null;
}

function confirmSelection() {
  promptOpen.value = false;
  teardownSession();
  // An empty selection is treated the same as cancelling - nothing to
  // import either way.
  resolveSelection?.(
    selectedPages.value.size
      ? new Set([...selectedPages.value].map((n) => n - 1))
      : null,
  );
  resolveSelection = null;
}

function deselectAll() {
  selectedPages.value = new Set();
}

// Renders one page at a time, deliberately *not* concurrently: pdf-parse's
// worker messaging isn't safe to call concurrently on a single PDFParse
// instance - two getScreenshot() calls racing against each other can throw
// "DataCloneError: ... ArrayBuffer is detached" because they end up
// fighting over the same underlying transferable buffer (found via a real
// 30-page PDF where 2 pages failed this way under the previous 3-at-once
// pool). Still loads progressively without blocking the UI, since each
// `await` yields control back to the event loop between pages - just at a
// steady one-at-a-time pace instead of a few in parallel.
//
// Public entry point - always routes through loadChain so overlapping calls
// (e.g. rapid pagination) run one after another instead of concurrently.
function loadVisibleThumbnails() {
  loadChain = loadChain.then(runLoadVisibleThumbnails);
  return loadChain;
}

async function runLoadVisibleThumbnails() {
  const session = thumbnailSession;
  if (!session) return;

  const queue = visiblePageNumbers.value.filter(
    (page) =>
      !thumbnails.value[page] &&
      !loadingPages.value.has(page) &&
      !failedPages.value.has(page),
  );
  if (!queue.length) return;

  const retriedPages = new Set<number>();

  for (const page of queue) {
    // Bail if the session has since been torn down (dialog closed, or a
    // different PDF started a new session) - avoids writing a stale result
    // into the wrong session's state.
    if (thumbnailSession !== session) return;

    loadingPages.value.add(page);
    let dataUrl = await session.getThumbnail(page);
    // A single render can still fail transiently (e.g. the same worker
    // hiccup this whole one-at-a-time change is guarding against, just
    // less likely) - retry once before giving up on this page.
    if (!dataUrl && !retriedPages.has(page)) {
      retriedPages.add(page);
      dataUrl = await session.getThumbnail(page);
    }

    if (thumbnailSession === session) {
      if (dataUrl) {
        thumbnails.value[page] = dataUrl;
      } else {
        failedPages.value.add(page);
      }
    }
    loadingPages.value.delete(page);
  }
}

function selectAll() {
  selectedPages.value = new Set(
    Array.from({ length: totalPages.value }, (_, i) => i + 1),
  );
}

/**
 * Resolves which 0-indexed pages of a PDF should be converted, prompting the
 * user only when the page count exceeds the threshold. Returns null when the
 * PDF can't be read, or when the user cancels/empties the selection - both
 * of which callers should treat as "abort the import".
 */
async function selectPdfPages(pdfPath: string): Promise<null | Set<number>> {
  const total = await getNrOfPdfPages(pdfPath);
  if (!total) return null;

  if (total <= PAGE_PROMPT_THRESHOLD) {
    return new Set(Array.from({ length: total }, (_, i) => i));
  }

  teardownSession();
  totalPages.value = total;
  gridPage.value = 1;
  thumbnails.value = {};
  loadingPages.value = new Set();
  failedPages.value = new Set();
  selectedPages.value = new Set(Array.from({ length: total }, (_, i) => i + 1));
  promptOpen.value = true;

  // Opens (and starts rendering thumbnails for) the session without
  // blocking the dialog from appearing - the grid shows its loading
  // placeholders immediately and fills in as pages become ready.
  const requestId = ++sessionRequestId;
  openPdfThumbnailSession(pdfPath)
    .then((session) => {
      // Either the dialog was already cancelled by the time this resolves,
      // or a newer selectPdfPages() call has since superseded this one (e.g.
      // cancel-then-reimport-a-different-PDF before this session finished
      // opening) - either way, don't start rendering into an abandoned
      // session, and don't let it clobber whatever session the newer
      // request has since assigned.
      if (requestId !== sessionRequestId || !promptOpen.value) {
        void session.destroy();
        return;
      }
      thumbnailSession = session;
      void loadVisibleThumbnails();
    })
    .catch(() => {
      // getTempPath/readFile failures already go through errorCatcher
      // inside the session helpers - nothing extra to surface here.
    });

  return new Promise<null | Set<number>>((resolve) => {
    resolveSelection = resolve;
  });
}

function teardownSession() {
  const session = thumbnailSession;
  thumbnailSession = null;
  if (session) void session.destroy();
}

function togglePage(page: number) {
  if (selectedPages.value.has(page)) {
    selectedPages.value.delete(page);
  } else {
    selectedPages.value.add(page);
  }
}

watch(gridPage, () => {
  void loadVisibleThumbnails();
});

onBeforeUnmount(teardownSession);

defineExpose({ selectPdfPages });
</script>

<style lang="scss" scoped>
// Turns the card into a flex column so the header/footer stay their natural
// size while only .pdf-page-picker__grid-section (marked overflow-y below)
// shrinks to fit and scrolls internally - same "one scrolling section,
// everything else fixed" idiom DialogRemoteVideo.vue uses. Quasar already
// caps this card's height and sets overflow: auto on it directly
// (.q-dialog__inner > div), so once this section absorbs the excess via its
// own scrollbar, that outer overflow never actually engages.
//
// A plain scoped selector (no :deep()/:global() needed) is enough here: the
// q-card is written directly in this component's own template rather than a
// child component's (that was the earlier ConfirmDialog-based version's
// problem - Vue's scoped attribute travels with the element regardless of
// where QDialog's teleport later relocates it in the live DOM, so this
// isn't affected by that at all).
.pdf-page-picker-card {
  display: flex;
  flex-flow: column;
}

.pdf-page-picker__grid-section {
  overflow-y: auto;
}

.pdf-page-thumb {
  border: 2px solid transparent;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.pdf-page-thumb--selected {
  border-color: var(--q-primary);
}

.pdf-page-thumb__number {
  bottom: 0;
  left: 0;
  padding: 2px 0;
  position: absolute;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  color: white;
}
</style>
