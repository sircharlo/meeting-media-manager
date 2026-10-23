<template>
  <div class="layout-mock" :class="`layout-mock--${kind}`">
    <div class="layout-mock__bar">
      <q-icon :name="kind === 'm3' ? 'mmm-logo' : 'mmm-video-meeting'" />
      <span>{{ kind === 'm3' ? 'M³' : 'Zoom' }}</span>
    </div>
    <div v-if="kind === 'm3'" class="layout-mock__body">
      <div class="layout-mock__side"><i v-for="n in 4" :key="n" /></div>
      <div class="layout-mock__main">
        <div class="layout-mock__heading" />
        <div v-for="n in 7" :key="n" class="layout-mock__row">
          <span class="layout-mock__thumb" />
          <span
            class="layout-mock__line"
            :style="{ maxWidth: `${55 + ((n * 17) % 40)}%` }"
          />
        </div>
      </div>
    </div>
    <template v-else>
      <div class="layout-mock__body">
        <div
          class="layout-mock__gallery"
          :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }"
        >
          <div v-for="n in tiles" :key="n" class="layout-mock__tile">
            <i :style="{ background: avatar(n) }" />
          </div>
        </div>
        <div
          v-if="participants"
          class="layout-mock__panel"
          :style="{ width: `${panelShare * 100}%` }"
        >
          <div v-for="n in 9" :key="n" class="layout-mock__person">
            <i :style="{ background: avatar(n + 3) }" />
            <b :style="{ maxWidth: `${45 + ((n * 23) % 45)}%` }" />
          </div>
        </div>
      </div>
      <div class="layout-mock__toolbar">
        <i v-for="n in 6" :key="n" :class="{ 'layout-mock__share': n === 4 }" />
        <i class="layout-mock__end" />
      </div>
    </template>
    <div v-if="label" class="layout-mock__label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// A drawing of M³'s or Zoom's window for the setup assistant's layout
// preview, scaled to the space it's given: Zoom's gallery takes more
// columns as it gets wider, and its participants list its real share.

const props = defineProps<{
  /** How big the real window would be, in DIPs. */
  height: number;
  kind: 'm3' | 'zoom';
  label?: string;
  /** Zoom's participants list docked on its right. */
  participants?: boolean;
  width: number;
}>();

// The width of Zoom's docked participants list, in DIPs.
const PANEL_WIDTH = 368;

const AVATARS = [
  '#6b7bd6',
  '#d6876b',
  '#5fb38a',
  '#c46bd6',
  '#d6c46b',
  '#6bb8d6',
  '#d66b8f',
  '#8fd66b',
  '#9a8fd6',
  '#d6a36b',
  '#6bd6c4',
];

const avatar = (n: number) => AVATARS[n % AVATARS.length];

const panelShare = computed(() =>
  Math.min(0.5, PANEL_WIDTH / Math.max(1, props.width)),
);

const columns = computed(() => {
  const gallery = props.width * (props.participants ? 1 - panelShare.value : 1);
  if (gallery > 1600) return 4;
  return gallery > 900 ? 3 : 2;
});

const tiles = computed(
  () => columns.value * (props.height > 900 && columns.value < 4 ? 3 : 2),
);
</script>

<style scoped>
.layout-mock {
  container-type: size;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.layout-mock--m3 {
  background: #fff;
  border: 1px solid rgba(120, 130, 150, 0.35);
}

:global(.body--dark) .layout-mock--m3 {
  background: #2a2f3a;
}

.layout-mock--zoom {
  background: #1c1d21;
  border: 1px solid #000;
}

.layout-mock__bar {
  align-items: center;
  display: flex;
  font-size: max(7px, 2.6cqh);
  font-weight: 600;
  gap: 1.5cqw;
  height: max(9px, 4.2cqh);
  padding: 0 2cqw;
  white-space: nowrap;
}

.layout-mock--m3 .layout-mock__bar {
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
  color: var(--q-primary);
}

.layout-mock--zoom .layout-mock__bar {
  background: #16171a;
  color: #9aa3b2;
}

.layout-mock__body {
  bottom: 0;
  display: flex;
  left: 0;
  position: absolute;
  right: 0;
  top: max(9px, 4.2cqh);
}

.layout-mock--zoom .layout-mock__body {
  bottom: max(12px, 7cqh);
}

.layout-mock__side {
  align-items: center;
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  display: flex;
  flex-direction: column;
  gap: 3cqh;
  max-width: 26px;
  padding-top: 3cqh;
  width: max(10px, 6cqw);
}

.layout-mock__side i {
  aspect-ratio: 1;
  background: color-mix(in srgb, var(--q-primary) 45%, transparent);
  border-radius: 30%;
  width: 50%;
}

.layout-mock__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2.4cqh;
  min-width: 0;
  padding: 3cqh 3cqw;
}

.layout-mock__heading {
  background: color-mix(in srgb, var(--q-primary) 35%, transparent);
  border-radius: 3px;
  height: 3.2cqh;
  width: 45%;
}

.layout-mock__row {
  align-items: center;
  display: flex;
  gap: 3cqw;
}

.layout-mock__thumb {
  aspect-ratio: 16 / 9;
  background: rgba(120, 130, 150, 0.25);
  border-radius: 3px;
  flex-shrink: 0;
  width: min(18cqw, 28cqh);
}

.layout-mock__line {
  background: rgba(120, 130, 150, 0.25);
  border-radius: 3px;
  flex: 1;
  height: 2.2cqh;
}

.layout-mock__gallery {
  align-content: center;
  display: grid;
  flex: 1;
  gap: 1.2cqh;
  min-width: 0;
  padding: 1.6cqh;
}

.layout-mock__tile {
  align-items: center;
  aspect-ratio: 16 / 9;
  background: #2c2e35;
  border-radius: 4px;
  display: flex;
  justify-content: center;
}

.layout-mock__tile i {
  aspect-ratio: 1;
  border-radius: 50%;
  width: 22%;
}

.layout-mock__panel {
  background: #17181c;
  border-left: 1px solid #000;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 1.6cqh;
  overflow: hidden;
  padding: 1.6cqh 1.4cqw;
}

.layout-mock__person {
  align-items: center;
  display: flex;
  gap: 4px;
}

.layout-mock__person i {
  aspect-ratio: 1;
  border-radius: 50%;
  flex-shrink: 0;
  width: max(5px, 3cqh);
}

.layout-mock__person b {
  background: #2f3239;
  border-radius: 2px;
  flex: 1;
  height: max(3px, 1.6cqh);
}

.layout-mock__toolbar {
  align-items: center;
  background: #16171a;
  bottom: 0;
  display: flex;
  gap: 2.4cqw;
  height: max(12px, 7cqh);
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
}

.layout-mock__toolbar i {
  aspect-ratio: 1;
  background: #3a3d45;
  border-radius: 30%;
  height: 55%;
}

.layout-mock__toolbar i.layout-mock__share {
  background: #23a26d;
}

.layout-mock__toolbar i.layout-mock__end {
  aspect-ratio: 2;
  background: #e5484d;
  margin-left: 2cqw;
}

.layout-mock__label {
  background: rgba(0, 0, 0, 0.62);
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  left: 50%;
  padding: 3px 10px;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}
</style>
