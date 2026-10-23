<template>
  <q-btn-toggle
    v-model="layout.enabled"
    class="zoom-layout__choice"
    no-caps
    :options="[
      { label: t('zoom-setup-layout-arrange'), value: true },
      { label: t('zoom-setup-layout-leave'), value: false },
    ]"
    rounded
    spread
    toggle-color="primary"
    unelevated
  />
  <p v-if="!layout.enabled" class="text-caption text-grey q-mt-sm">
    {{ t('zoom-setup-layout-left-alone') }}
  </p>
  <template v-else-if="zoomScreen">
    <div class="card-section-title text-dark-grey q-mt-md">
      {{ t('zoom-setup-layout-zoom-screen') }}
    </div>
    <div
      class="zoom-layout-map"
      :style="{
        aspectRatio: `${virtualBounds.width} / ${virtualBounds.height}`,
        maxWidth: `calc(190px * ${virtualBounds.width} / ${virtualBounds.height})`,
      }"
    >
      <q-btn
        v-for="(screen, index) in screens"
        :key="screen.id"
        class="zoom-layout-map__screen"
        :class="{ 'zoom-layout-map__screen--taken': taken(screen) }"
        color="primary"
        :disable="taken(screen)"
        no-caps
        :outline="screen.id !== zoomScreen.id"
        padding="xs"
        :style="screenStyle(index)"
        unelevated
        @click="pick(screen)"
      >
        <div class="column items-center no-wrap">
          <div class="text-weight-medium">{{ displayName(index) }}</div>
          <div class="zoom-layout-map__size">{{ resolution(screen) }}</div>
          <div class="row no-wrap q-gutter-x-xs q-mt-xs">
            <q-icon
              v-if="taken(screen)"
              name="mmm-media-display-active"
              size="16px"
            />
            <q-icon
              v-if="screen.id === zoomScreen.id"
              name="mmm-video-meeting"
              size="16px"
            />
            <q-icon
              v-if="
                screen.mainWindow && (screen.id !== zoomScreen.id || !alone)
              "
              name="mmm-logo"
              size="16px"
            />
          </div>
        </div>
        <q-tooltip v-if="taken(screen)" :delay="500">
          {{ t('zoom-setup-layout-media-screen') }}
        </q-tooltip>
      </q-btn>
    </div>
    <p class="text-caption text-grey q-mt-sm q-mb-none">{{ caption }}</p>

    <q-list v-if="aloneAllowed" class="q-mt-sm">
      <q-item
        v-for="choice in ALONE_CHOICES"
        :key="choice.label"
        class="q-px-none"
        tag="label"
      >
        <q-item-section avatar>
          <q-radio v-model="layout.alone" :val="choice.alone" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t(choice.label) }}</q-item-label>
          <q-item-label caption>
            {{
              t(`${choice.label}-explain`, {
                display: displayName(m3Index),
              })
            }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <div
      v-if="mediaIndex >= 0"
      class="row items-start no-wrap q-mt-sm text-caption text-grey"
    >
      <q-icon class="q-mr-xs q-mt-xs" name="mmm-info" size="14px" />
      <div class="col">
        {{
          t('zoom-setup-layout-dual-monitors', {
            display: displayName(mediaIndex),
          })
        }}
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { Display } from 'src/types';

import { useScreenLayout } from 'src/composables/useScreenLayout';
import { findZoomScreen, isPresentationScreen } from 'src/helpers/zoom-layout';
import { useAppSettingsStore } from 'stores/app-settings';
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';

// The setup assistant's first window layout step: whether M³ arranges its
// window and Zoom's, and on which screen Zoom goes (on its own, or next to
// M³), on a map of the screens as they're arranged. The screens the media
// window or the timer fill can't be picked.

const props = defineProps<{ screens: Display[] }>();

const ALONE_CHOICES = [
  { alone: true, label: 'zoom-setup-layout-alone' },
  { alone: false, label: 'zoom-setup-layout-next-to-m3' },
] as const;

const { t } = useI18n();
const layout = useAppSettingsStore().zoomLayout;

const { screenRects, virtualBounds } = useScreenLayout(toRef(props, 'screens'));

const taken = (screen: Display) => isPresentationScreen(screen, props.screens);

const zoomScreen = computed(() => findZoomScreen(props.screens, layout));
const m3Index = computed(() => props.screens.findIndex((s) => s.mainWindow));
const mediaIndex = computed(() =>
  props.screens.findIndex((s) => s.mediaWindow && taken(s)),
);
const usableCount = computed(
  () => props.screens.filter((s) => !taken(s)).length,
);

// Zoom gets a screen to itself only away from M³'s.
const aloneAllowed = computed(
  () => !!zoomScreen.value && !zoomScreen.value.mainWindow,
);
const alone = computed(() => aloneAllowed.value && layout.alone);

const displayName = (index: number) => `${t('display')} ${index + 1}`;

/** The screen's resolution in real pixels. */
const resolution = (screen: Display) =>
  `${Math.round(screen.bounds.width * screen.scaleFactor)} × ${Math.round(
    screen.bounds.height * screen.scaleFactor,
  )}`;

const screenStyle = (index: number) => {
  const rect = screenRects.value[index];
  if (!rect) return {};
  return {
    height: `calc(${rect.height}% - 2%)`,
    left: `calc(${rect.left}% + 1%)`,
    top: `calc(${rect.top}% + 1%)`,
    width: `calc(${rect.width}% - 2%)`,
  };
};

const pick = (screen: Display) => {
  if (taken(screen)) return;
  layout.display = screen.mainWindow
    ? null
    : { bounds: { ...screen.bounds }, id: screen.id };
};

const caption = computed(() => {
  if (props.screens.length < 2) return t('zoom-setup-layout-one-screen');
  if (usableCount.value < 2 && mediaIndex.value >= 0) {
    const zoomIndex = zoomScreen.value
      ? props.screens.indexOf(zoomScreen.value)
      : 0;
    return t('zoom-setup-layout-media-takes-other', {
      display: displayName(zoomIndex),
      media: displayName(mediaIndex.value),
    });
  }
  if (mediaIndex.value >= 0) {
    return t('zoom-setup-layout-pick-screen-media', {
      media: displayName(mediaIndex.value),
    });
  }
  return t('zoom-setup-layout-pick-screen');
});
</script>

<style scoped>
/* The choice not taken still reads as a button: a tinted, outlined track. */
.zoom-layout__choice {
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-primary) 35%, transparent);
}

.zoom-layout-map {
  margin: 0 auto;
  position: relative;
  width: 100%;
}

.zoom-layout-map__screen {
  border-radius: 6px;
  overflow: hidden;
  position: absolute;
}

.zoom-layout-map__screen--taken {
  background: repeating-linear-gradient(
    135deg,
    transparent 0 7px,
    rgba(128, 128, 128, 0.18) 7px 14px
  );
}

.zoom-layout-map__size {
  font-size: 0.72em;
  opacity: 0.8;
}
</style>
