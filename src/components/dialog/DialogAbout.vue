<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId">
    <div
      class="items-center q-pb-lg q-px-lg q-gutter-y-md bg-secondary-contrast"
    >
      <div class="row items-center">
        <div class="col-shrink q-mr-md">
          <q-img
            v-if="isBetaVersion"
            loading="lazy"
            src="~assets/img/beta-logo.svg"
            width="48px"
          />
          <q-img
            v-else
            loading="lazy"
            src="~assets/img/logo.svg"
            width="48px"
          />
        </div>
        <div class="col">
          <div class="row text-h6">
            {{ t('meeting-media-manager') }}
          </div>
          <div class="row items-center">
            <div class="col">v{{ appVersion }}</div>
          </div>
        </div>
        <div class="col-shrink">
          <q-btn flat icon="mmm-clear" round @click="handleHide">
            <q-tooltip :delay="500">
              {{ t('close') }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <div class="row">
        <p>
          {{ t('app-description') }}
        </p>
        <p>
          {{ t('here-are-some-of-the-newest-features') }}
        </p>
        <q-carousel
          v-if="parsedFeatures.length > 0"
          ref="carousel"
          v-model="spotlitFeature"
          animated
          :autoplay="autoplayDelay"
          class="bg-accent-100 full-width rounded-borders"
          infinite
          padding
          style="height: 220px"
          vertical
          @mouseenter="autoplayDelay = false"
          @mouseleave="autoplayDelay = 5000"
        >
          <q-carousel-slide
            v-for="(feature, index) in parsedFeatures"
            :key="index"
            class="column no-wrap q-pa-md"
            :name="index + 1"
          >
            <div class="row items-center no-wrap q-mb-sm q-gutter-x-sm">
              <q-icon
                v-if="feature.title"
                color="primary"
                name="mmm-shimmer"
                size="18px"
              />
              <div
                v-if="feature.title"
                class="col text-subtitle2 text-weight-bold text-primary ellipsis-2-lines"
              >
                {{ feature.title }}
              </div>
              <q-space v-else />
              <q-badge
                class="text-weight-medium"
                color="accent-400"
                :label="feature.version"
                text-color="white"
              />
            </div>
            <div
              class="col feature-carousel__scroll scroll full-width text-body2"
            >
              {{ feature.text }}
            </div>
          </q-carousel-slide>
          <template #control>
            <q-carousel-control
              class="q-gutter-xs"
              :offset="[18, 18]"
              position="bottom-right"
            >
              <q-btn
                color="primary"
                dense
                icon="mmm-up"
                round
                size="sm"
                text-color="white"
                @click="carousel?.previous()"
              >
                <q-tooltip :delay="500">
                  {{ t('previous') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                color="primary"
                dense
                icon="mmm-down"
                round
                size="sm"
                text-color="white"
                @click="carousel?.next()"
              >
                <q-tooltip :delay="500">
                  {{ t('next') }}
                </q-tooltip>
              </q-btn>
            </q-carousel-control>
          </template>
        </q-carousel>
      </div>
      <p>
        {{ t('app-issues') }}
      </p>
      <div class="row q-gutter-x-md">
        <div class="col">
          <q-btn
            class="btn-tonal q-pa-md full-width"
            color="primary"
            flat
            no-caps
            rounded
            @click="openExternal('repo')"
          >
            <div class="row q-gutter-x-md full-width items-center">
              <div class="col-shrink text-primary q-ml-none">
                <q-icon name="mmm-github" />
              </div>
              <div class="col-shrink text-primary">
                {{ t('github-repo') }}
              </div>
              <div class="col text-right text-primary">
                <q-icon name="mmm-arrow-outward" />
              </div>
            </div>
          </q-btn>
        </div>
        <div class="col">
          <q-btn
            class="btn-tonal q-pa-md full-width"
            color="primary"
            flat
            no-caps
            rounded
            @click="openExternal('docs')"
          >
            <div class="row q-gutter-x-md full-width items-center">
              <div class="col-shrink text-primary q-ml-none">
                <q-icon name="mmm-guide" />
              </div>
              <div class="col-shrink text-primary">
                {{ t('user-guide') }}
              </div>
              <div class="col text-right text-primary">
                <q-icon name="mmm-arrow-outward" />
              </div>
            </div>
          </q-btn>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>
<script setup lang="ts">
import { watchImmediate, whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { QCarousel } from 'quasar';
import { fetchReleaseNotes } from 'src/utils/api';
import { wasUpdateInstalled } from 'src/utils/fs';
import { camelToKebabCase, sleep } from 'src/utils/general';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { openExternal } = globalThis.electronApi;

interface Props {
  dialogId: string;
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  hide: [];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleHide = () => {
  emit('hide');
};

const { locale, t } = useI18n();
const appVersion = import.meta.env.version;
const isBetaVersion = import.meta.env.IS_BETA;

const checkLastVersion = async (congId: string) => {
  if (await wasUpdateInstalled(congId)) {
    await sleep(1000);

    if (releaseNotes.value) {
      releaseNotesExpansionItem.value = true;
    }
  }
};

const { currentCongregation } = storeToRefs(useCurrentStateStore());

const releaseNotes = ref('');
const releaseNotesExpansionItem = ref(false);
const parsedFeatures = ref<{ text: string; title: string; version: string }[]>(
  [],
);
const spotlitFeature = ref(1);
const autoplayDelay = ref<false | number>(5000);

const carousel = ref<QCarousel>();

// Older release notes prefix bullets with a variety of emoji (flags, tools, etc.),
// not just ✨, before the bold title - strip any of them so the title still parses.
const LEADING_EMOJI =
  /^(?:\p{Extended_Pictographic}\uFE0F?|\p{Regional_Indicator})+\s*/u;

const parseReleaseNotes = () => {
  const md = releaseNotes.value;
  if (!md) return;

  parsedFeatures.value = [];
  const lines = md.split('\n');
  let currentVersion = '';

  for (const line of lines) {
    const versionMatch = line.match(/^## (.+)$/);
    if (versionMatch) {
      currentVersion = versionMatch[1] || '';
      if (!currentVersion.startsWith('v')) {
        currentVersion = `v${currentVersion}`;
      }
    } else if (line.startsWith('- ')) {
      const raw = line.replace(/^-\s*/, '').replace(LEADING_EMOJI, '');
      const titleMatch = raw.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
      parsedFeatures.value.push({
        text: (titleMatch ? (titleMatch[2] ?? '') : raw).trim(),
        title: (titleMatch?.[1] ?? '').trim(),
        version: currentVersion,
      });
    }
  }
};

const loadReleaseNotes = async () => {
  const result = await fetchReleaseNotes(camelToKebabCase(locale.value));
  releaseNotes.value = result ?? '';
  parseReleaseNotes();
};

whenever(dialogValue, () => {
  spotlitFeature.value = 1;
});

watch(currentCongregation, (val) => {
  if (val) checkLastVersion(val);
});

watchImmediate(locale, () => {
  loadReleaseNotes();
});
</script>

<style scoped>
/* Hints that the feature description keeps going below the fold instead of
   hard-clipping the last visible line when it overflows the fixed-height slide. */
.feature-carousel__scroll {
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 calc(100% - 18px),
    transparent
  );
  line-height: 1.4;
  mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent);
}
</style>
