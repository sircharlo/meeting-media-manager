<template>
  <template v-if="screen">
    <div class="row items-center no-wrap">
      <div class="card-section-title text-dark-grey col">
        {{ t('display') }} {{ screenIndex + 1 }} · {{ resolution }}
      </div>
      <q-btn
        v-if="!alone"
        color="primary"
        dense
        flat
        icon="mmm-mirror"
        :label="t('zoom-setup-layout-swap')"
        no-caps
        @click="layout.m3First = !layout.m3First"
      />
    </div>

    <!-- The screen as it is, with the two windows on it -->
    <div class="zoom-layout-preview">
      <div
        class="zoom-layout-preview__screen"
        :class="{
          'zoom-layout-preview__screen--vertical': range.vertical,
          'zoom-layout-preview__screen--dragging': dragging,
        }"
        :style="{
          aspectRatio: `${screen.bounds.width} / ${screen.bounds.height}`,
          width: `min(100%, calc(250px * ${screen.bounds.width} / ${screen.bounds.height}))`,
        }"
      >
        <div
          ref="workArea"
          class="zoom-layout-preview__work"
          :style="{ height: `${workShare * 100}%` }"
        >
          <ZoomLayoutWindowMock
            v-if="alone"
            :height="screen.workArea.height"
            kind="zoom"
            :label="`Zoom · ${resolution}`"
            :participants="layout.openParticipants"
            :width="screen.workArea.width"
          />
          <template v-else>
            <div
              v-for="zone in noGoZones"
              :key="zone.at"
              class="zoom-layout-preview__no-go"
              :style="place(zone.at, zone.size)"
            />
            <div
              class="zoom-layout-preview__window"
              :style="place(m3At, share)"
            >
              <ZoomLayoutWindowMock
                :height="m3Size.height"
                kind="m3"
                :label="`M³ · ${percent(share)}`"
                :width="m3Size.width"
              />
            </div>
            <div
              class="zoom-layout-preview__window"
              :style="place(zoomAt, 1 - share)"
            >
              <ZoomLayoutWindowMock
                :height="zoomSize.height"
                kind="zoom"
                :label="`Zoom · ${percent(1 - share)}`"
                :participants="layout.openParticipants"
                :width="zoomSize.width"
              />
            </div>
            <i
              v-for="point in snapPoints"
              :key="point"
              class="zoom-layout-preview__tick"
              :style="edge(layout.m3First ? point : 1 - point)"
            />
            <!-- The divider: this input for the keyboard and screen readers,
                 the handle drawn next to it for the mouse -->
            <input
              ref="dividerInput"
              :aria-label="t('zoom-setup-layout-divider')"
              :aria-orientation="range.vertical ? 'vertical' : 'horizontal'"
              :aria-valuetext="`M³ ${percent(share)}, Zoom ${percent(1 - share)}`"
              class="zoom-layout-preview__divider-input"
              :max="dividerBounds.max"
              :min="dividerBounds.min"
              step="1"
              type="range"
              :value="Math.round(dividerAt * 100)"
              @input="onInput"
              @keydown="onKey"
            />
            <div
              aria-hidden="true"
              class="zoom-layout-preview__divider"
              :style="edge(dividerAt)"
              @lostpointercapture="dragging = false"
              @pointerdown="startDrag"
              @pointermove="drag"
              @pointerup="dragging = false"
            >
              <span><i /><i /></span>
            </div>
          </template>
        </div>
        <div
          v-if="taskbarShare > 0"
          class="zoom-layout-preview__taskbar"
          :style="{ height: `${taskbarShare * 100}%` }"
        />
      </div>
    </div>

    <div
      v-if="!alone && !fitsBoth(range)"
      class="row items-center no-wrap q-mt-sm text-caption text-warning"
    >
      <q-icon class="q-mr-xs" name="mmm-warning" size="14px" />
      <div class="col">{{ t('zoom-setup-layout-too-small') }}</div>
    </div>
    <div v-if="alone" class="row items-center q-gutter-sm q-mt-sm">
      <div class="text-caption text-grey">
        {{ t('zoom-setup-layout-m3-window') }}
      </div>
      <q-btn
        v-for="choice in M3_PLACES"
        :key="choice.label"
        :color="layout.m3Fills === choice.fills ? 'primary' : 'grey'"
        :label="t(choice.label, { display: `${t('display')} ${m3Index + 1}` })"
        no-caps
        outline
        padding="2px 12px"
        rounded
        @click="layout.m3Fills = choice.fills"
      />
    </div>

    <div class="card-section-title text-dark-grey q-mt-md">
      {{ t('zoom-setup-layout-during-meeting') }}
    </div>
    <q-item
      v-for="option in options"
      :key="option.key"
      class="q-px-none"
      tag="label"
    >
      <q-item-section>
        <q-item-label>{{ t(option.label) }}</q-item-label>
        <q-item-label caption>{{ t(`${option.label}-explain`) }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-toggle v-model="layout[option.key]" />
      </q-item-section>
    </q-item>

    <div class="row items-center q-gutter-sm q-mt-sm">
      <q-btn
        class="btn-tonal"
        color="primary"
        flat
        :label="t('zoom-setup-layout-arrange-now')"
        :loading="arranging"
        no-caps
        @click="arrangeNow"
      />
      <StatusRow
        v-if="arrangeStatus"
        class="col"
        :status="arrangeStatus"
        :text="
          arrangeStatus === 'passed'
            ? t('zoom-setup-layout-arranged')
            : t('zoom-setup-layout-arrange-failed')
        "
      />
    </div>
  </template>
</template>

<script setup lang="ts">
import type { Display } from 'src/types';

import ZoomLayoutWindowMock from 'components/dialog/ZoomLayoutWindowMock.vue';
import StatusRow from 'components/dialog/ZoomSetupStatusRow.vue';
import { arrangeZoomWindows, findZoomScreen } from 'src/helpers/zoom-layout';
import {
  clampM3Share,
  fitsBoth,
  m3ShareRange,
  snapM3Share,
  ZOOM_LAYOUT_SNAP_POINTS,
} from 'src/shared/zoom-layout';
import { useAppSettingsStore } from 'stores/app-settings';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// The setup assistant's second window layout step: how M³ and Zoom share
// Zoom's screen, on a drawing of that screen at its real shape, by dragging
// the divider between them. It clicks onto the usual proportions (Alt drags
// it freely; the arrow keys move it by 1 %), and never leaves a window
// smaller than it can be. With Zoom on a screen of its own, it shows Zoom
// filling it.

const props = defineProps<{ screens: Display[] }>();

const M3_PLACES = [
  { fills: true, label: 'zoom-setup-layout-m3-fills' },
  { fills: false, label: 'zoom-setup-layout-m3-stays' },
] as const;

const { t } = useI18n();
const layout = useAppSettingsStore().zoomLayout;

const screen = computed(() => findZoomScreen(props.screens, layout));
const screenIndex = computed(() =>
  screen.value ? props.screens.indexOf(screen.value) : 0,
);
const m3Index = computed(() => props.screens.findIndex((s) => s.mainWindow));
const alone = computed(
  () => !!screen.value && !screen.value.mainWindow && layout.alone,
);

const resolution = computed(() => {
  const s = screen.value;
  if (!s) return '';
  return `${Math.round(s.bounds.width * s.scaleFactor)} × ${Math.round(
    s.bounds.height * s.scaleFactor,
  )}`;
});

const range = computed(() =>
  m3ShareRange(
    screen.value?.workArea ?? { height: 1080, width: 1920 },
    layout.openParticipants,
  ),
);

// Within range whatever the screen or Zoom's participants list.
const share = computed(() => clampM3Share(layout.m3Share, range.value));

const percent = (value: number) => `${Math.round(value * 100)} %`;

// The work area (above the taskbar) as a share of the whole screen's height.
const workShare = computed(() => {
  const s = screen.value;
  if (!s) return 1;
  return (s.workArea.y - s.bounds.y + s.workArea.height) / s.bounds.height;
});
const taskbarShare = computed(() => 1 - workShare.value);

const m3At = computed(() => (layout.m3First ? 0 : 1 - share.value));
const zoomAt = computed(() => (layout.m3First ? share.value : 0));

// The divider's position from the left (or the top), and where it can go,
// in whole percent.
const dividerAt = computed(() =>
  layout.m3First ? share.value : 1 - share.value,
);
const dividerBounds = computed(() => {
  const { max, min } = range.value;
  const [from, to] = layout.m3First ? [min, max] : [1 - max, 1 - min];
  return { max: Math.round(to * 100), min: Math.round(from * 100) };
});

/** The real size of a window taking part of the work area. */
const sizeOf = (part: number) => {
  const area = screen.value?.workArea ?? { height: 1080, width: 1920 };
  return range.value.vertical
    ? { height: area.height * part, width: area.width }
    : { height: area.height, width: area.width * part };
};
const m3Size = computed(() => sizeOf(share.value));
const zoomSize = computed(() => sizeOf(1 - share.value));

const place = (at: number, size: number) =>
  range.value.vertical
    ? { height: `${size * 100}%`, left: 0, right: 0, top: `${at * 100}%` }
    : { bottom: 0, left: `${at * 100}%`, top: 0, width: `${size * 100}%` };

const edge = (at: number) =>
  range.value.vertical ? { top: `${at * 100}%` } : { left: `${at * 100}%` };

// Where the divider can't go: too little room left for M³ on its side, or
// for Zoom on the other.
const noGoZones = computed(() => {
  const m3Zone = Math.max(0, range.value.min);
  const zoomZone = Math.max(0, 1 - range.value.max);
  const first = layout.m3First ? m3Zone : zoomZone;
  const last = layout.m3First ? zoomZone : m3Zone;
  return [
    { at: 0, size: first },
    { at: 1 - last, size: last },
  ];
});

const snapPoints = computed(() =>
  ZOOM_LAYOUT_SNAP_POINTS.filter(
    (point) => point >= range.value.min && point <= range.value.max,
  ),
);

// --- Dragging the divider ------------------------------------------------------

const workArea = useTemplateRef<HTMLElement>('workArea');
const dividerInput = useTemplateRef<HTMLInputElement>('dividerInput');
const dragging = ref(false);

const startDrag = (event: PointerEvent) => {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  dragging.value = true;
  dividerInput.value?.focus({ preventScroll: true });
  event.preventDefault();
};

const drag = (event: PointerEvent) => {
  if (!dragging.value || !workArea.value) return;
  const rect = workArea.value.getBoundingClientRect();
  const position = range.value.vertical
    ? (event.clientY - rect.top) / rect.height
    : (event.clientX - rect.left) / rect.width;
  layout.m3Share = snapM3Share(
    layout.m3First ? position : 1 - position,
    range.value,
    event.altKey,
  );
};

const KEY_STEPS: Record<string, number> = {
  ArrowDown: 0.01,
  ArrowLeft: -0.01,
  ArrowRight: 0.01,
  ArrowUp: -0.01,
  PageDown: 0.1,
  PageUp: -0.1,
};

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Home' || event.key === 'End') {
    const toStart = event.key === 'Home';
    layout.m3Share =
      toStart === layout.m3First ? range.value.min : range.value.max;
  } else if (event.key in KEY_STEPS) {
    const step = (KEY_STEPS[event.key] ?? 0) * (layout.m3First ? 1 : -1);
    layout.m3Share = snapM3Share(share.value + step, range.value, true);
  } else {
    return;
  }
  event.preventDefault();
};

// A value set some other way, such as by a screen reader.
const onInput = (event: Event) => {
  const position = Number((event.target as HTMLInputElement).value) / 100;
  layout.m3Share = snapM3Share(
    layout.m3First ? position : 1 - position,
    range.value,
    true,
  );
};

// --- Options and trying it --------------------------------------------------------

const options = computed(() => [
  { key: 'openParticipants' as const, label: 'zoom-setup-layout-participants' },
  ...(alone.value || range.value.vertical
    ? []
    : [{ key: 'snapWithWindows' as const, label: 'zoom-setup-layout-snap' }]),
  { key: 'keepInPlace' as const, label: 'zoom-setup-layout-keep' },
  {
    key: 'showParticipantsWhileSharing' as const,
    label: 'zoom-setup-layout-share-participants',
  },
]);

const arranging = ref(false);
const arrangeStatus = ref<'' | 'failed' | 'passed'>('');

const arrangeNow = async () => {
  arranging.value = true;
  try {
    layout.m3Share = share.value;
    arrangeStatus.value = (await arrangeZoomWindows()) ? 'passed' : 'failed';
  } finally {
    arranging.value = false;
  }
};

// A change of layout makes the last try's result stale.
watch(
  () => [layout.m3Share, layout.m3First, layout.alone, layout.m3Fills],
  () => {
    arrangeStatus.value = '';
  },
);
</script>

<style scoped>
.zoom-layout-preview {
  display: flex;
  justify-content: center;
}

.zoom-layout-preview__screen {
  background: #3a4150;
  border: 2px solid #4a5263;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  touch-action: none;
  user-select: none;
}

.zoom-layout-preview__work {
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.zoom-layout-preview__taskbar {
  background: #20242c;
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
}

.zoom-layout-preview__window {
  position: absolute;
  transition:
    left 160ms ease,
    width 160ms ease,
    top 160ms ease,
    height 160ms ease;
}

.zoom-layout-preview__screen--dragging .zoom-layout-preview__window,
.zoom-layout-preview__screen--dragging .zoom-layout-preview__divider {
  transition: none;
}

.zoom-layout-preview__no-go {
  background: repeating-linear-gradient(
    135deg,
    transparent 0 6px,
    rgba(229, 72, 77, 0.3) 6px 12px
  );
  opacity: 0;
  pointer-events: none;
  position: absolute;
  transition: opacity 150ms;
  z-index: 1;
}

.zoom-layout-preview__screen:hover .zoom-layout-preview__no-go,
.zoom-layout-preview__screen--dragging .zoom-layout-preview__no-go {
  opacity: 1;
}

.zoom-layout-preview__tick {
  background: rgba(255, 255, 255, 0.55);
  border-radius: 1px;
  height: 7px;
  margin-left: -1px;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 2px;
  z-index: 1;
}

.zoom-layout-preview__divider {
  align-items: center;
  bottom: 0;
  cursor: ew-resize;
  display: flex;
  justify-content: center;
  margin-left: -11px;
  position: absolute;
  top: 0;
  transition:
    left 160ms ease,
    top 160ms ease;
  width: 22px;
  z-index: 2;
}

.zoom-layout-preview__divider::before {
  background: var(--q-primary);
  bottom: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
  content: '';
  position: absolute;
  top: 0;
  width: 3px;
}

.zoom-layout-preview__divider span {
  align-items: center;
  background: var(--q-primary);
  border-radius: 7px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  display: flex;
  gap: 2px;
  height: 40px;
  justify-content: center;
  position: relative;
  width: 14px;
}

.zoom-layout-preview__divider span i {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 1px;
  height: 16px;
  width: 2px;
}

.zoom-layout-preview__divider-input {
  height: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  width: 1px;
}

.zoom-layout-preview__divider-input:focus-visible
  + .zoom-layout-preview__divider {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* A portrait screen: top and bottom */
.zoom-layout-preview__screen--vertical .zoom-layout-preview__tick {
  height: 2px;
  left: 0;
  margin: -1px 0 0;
  top: auto;
  width: 7px;
}

.zoom-layout-preview__screen--vertical .zoom-layout-preview__divider {
  bottom: auto;
  cursor: ns-resize;
  height: 22px;
  left: 0;
  margin: -11px 0 0;
  right: 0;
  width: auto;
}

.zoom-layout-preview__screen--vertical .zoom-layout-preview__divider::before {
  bottom: auto;
  height: 3px;
  left: 0;
  right: 0;
  top: auto;
  width: auto;
}

.zoom-layout-preview__screen--vertical .zoom-layout-preview__divider span {
  flex-direction: column;
  height: 14px;
  width: 40px;
}

.zoom-layout-preview__screen--vertical .zoom-layout-preview__divider span i {
  height: 2px;
  width: 16px;
}
</style>
