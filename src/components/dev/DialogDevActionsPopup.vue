<template>
  <!-- Dev builds only (see ActionIsland): ways to see what a user only sees
       at a given moment, on a failure, or once. Hardcoded English, like the
       Demo menu: never user-facing. -->
  <ActionPopup
    v-model="open"
    :status-color="faked.length ? 'warning' : 'grey'"
    status-icon="mmm-tools"
    :status-text="statusText"
    title="Dev actions"
  >
    <q-list class="full-width" dense>
      <q-expansion-item
        v-for="group in groups"
        :key="group.id"
        dense
        :icon="group.icon"
        :label="group.label"
        :model-value="expanded.has(group.id)"
        @update:model-value="setExpanded(group.id, $event)"
      >
        <div
          v-if="group.id === 'meeting'"
          class="row items-center no-wrap q-px-md q-py-xs"
        >
          <div class="col text-caption">Fake today's</div>
          <q-btn-toggle
            v-model="meetingType"
            dense
            no-caps
            :options="meetingTypeOptions"
            rounded
            size="sm"
            toggle-color="primary"
            unelevated
          />
        </div>
        <template v-for="action in group.actions" :key="action.label">
          <q-item
            v-if="action.kind === 'switch'"
            dense
            :disable="action.disabled"
            tag="label"
          >
            <q-item-section>
              <q-item-label>{{ action.label }}</q-item-label>
              <q-item-label v-if="action.caption" caption>
                {{ action.caption }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                dense
                :disable="action.disabled"
                :model-value="action.value"
                @update:model-value="action.set($event)"
              />
            </q-item-section>
          </q-item>
          <q-item
            v-else
            clickable
            dense
            :disable="action.disabled"
            @click="runAction(action)"
          >
            <q-item-section>
              <q-item-label>{{ action.label }}</q-item-label>
              <q-item-label v-if="action.caption" caption>
                {{ action.caption }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <!-- The Zoom self-test, also in the Zoom popup once the Zoom Meeting
             Manager is set up: here, whatever the settings. -->
        <ZoomSelfTestPanel v-if="group.id === 'zoom'" />
      </q-expansion-item>
    </q-list>

    <template #footer>
      <q-btn
        class="full-width"
        color="primary"
        :disable="!faked.length"
        label="Stop faking everything"
        no-caps
        unelevated
        @click="stopFakingEverything()"
      />
    </template>
  </ActionPopup>
</template>

<script setup lang="ts">
import ZoomSelfTestPanel from 'components/dialog/ZoomSelfTestPanel.vue';
import ActionPopup from 'components/ui/ActionPopup.vue';
import { type DevButton, useDevActions } from 'src/composables/useDevActions';
import { computed, ref } from 'vue';

const open = defineModel<boolean>({ default: false });

const { faked, groups, meetingType, stopFakingEverything } = useDevActions();

const meetingTypeOptions = [
  { label: 'Midweek', value: 'mw' },
  { label: 'Weekend', value: 'we' },
];

const statusText = computed(() =>
  faked.value.length
    ? `Faking: ${faked.value.join(', ')}`
    : 'Nothing faked. Dev builds only',
);

// The groups the developer keeps open, from one session to the next.
const EXPANDED_STORAGE_KEY = 'devActionsExpanded';

const readExpanded = () => {
  try {
    const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (stored) return new Set<string>(JSON.parse(stored) as string[]);
  } catch {
    // No storage: the first group only.
  }
  return new Set<string>(['meeting']);
};

const expanded = ref(readExpanded());

const setExpanded = (id: string, isOpen: boolean) => {
  const next = new Set(expanded.value);
  if (isOpen) next.add(id);
  else next.delete(id);
  expanded.value = next;
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // Not remembered: no harm.
  }
};

const runAction = (action: DevButton) => {
  if (action.closesPopup) open.value = false;
  void action.run();
};
</script>
