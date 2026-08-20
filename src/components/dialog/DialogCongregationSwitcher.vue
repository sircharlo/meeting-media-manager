<template>
  <BaseDialog
    v-model="isOpen"
    data-congregation-switcher
    dialog-id="congregation-switcher"
    persistent
  >
    <q-card class="congregation-switcher round-card">
      <q-card-section
        class="row items-center no-wrap text-bigger text-semibold text-primary q-pb-none"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-groups" size="xs" />
        </div>
        <div class="col">
          {{ t('titles.profileSelection') }}
        </div>
        <q-btn
          v-if="congregationCount > 0 && !!currentCongregation"
          :aria-label="t('close')"
          dense
          flat
          icon="mmm-clear"
          round
          @click="isOpen = false"
        >
          <q-tooltip :delay="500">{{ t('close') }}</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-card-section>
        <q-list v-if="sortedCongregations.length" class="full-width">
          <div
            v-for="{ id, prefs } in sortedCongregations"
            :key="id"
            v-ripple
            class="media-section congregation cursor-pointer"
            :class="{ active: currentCongregation === id }"
            role="button"
            tabindex="0"
            @click="chooseCongregation(id)"
            @keydown.enter.space.prevent="chooseCongregation(id)"
          >
            <q-item class="items-center">
              <div
                class="congregation-avatar q-mr-md"
                :style="{
                  background: avatarColor(id),
                  color: getTextColorForBgColor(avatarColor(id)),
                }"
              >
                {{
                  (prefs.congregationName || t('noName'))
                    .charAt(0)
                    .toUpperCase()
                }}
              </div>
              <div class="col">
                <div
                  class="text-subtitle1 row"
                  :class="{ 'text-primary': currentCongregation === id }"
                >
                  {{ prefs.congregationName || t('noName') }}
                </div>
                <div class="row text-caption text-dark-grey">
                  <template v-if="prefs.disableMediaFetching">
                    {{ t('no-regular-meetings') }}
                  </template>
                  <template
                    v-else-if="
                      Number.parseInt(prefs.mwDay ?? '') >= 0 &&
                      Number.parseInt(prefs.weDay ?? '') >= 0
                    "
                  >
                    {{
                      getDateLocale(prefs.localAppLang).days[
                        Number.parseInt(prefs.mwDay ?? '') === 6
                          ? 0
                          : Number.parseInt(prefs.mwDay ?? '') + 1
                      ]
                    }}
                    {{ prefs.mwStartTime }} |
                    {{
                      getDateLocale(prefs.localAppLang).days[
                        Number.parseInt(prefs.weDay ?? '') === 6
                          ? 0
                          : Number.parseInt(prefs.weDay ?? '') + 1
                      ]
                    }}
                    {{ prefs.weStartTime }}
                  </template>
                  <template v-else-if="invalidSettings(id)">
                    {{ t('incomplete-configuration') }}
                  </template>
                </div>
              </div>
              <div class="col-shrink row items-center no-wrap q-gutter-xs">
                <!-- Delete/export gated behind a discreet overflow menu,
                     matching the mmm-dots + q-menu pattern used for
                     per-item options elsewhere (e.g. MediaSectionHeader.vue)
                     instead of a hover-revealed action. Also reachable via
                     right-click anywhere on the row - same dual-trigger
                     idiom as MediaItem.vue's own context menu: the q-menu
                     below (a direct child of q-item, not nested in the
                     button) defaults its anchor to the whole row via
                     `context-menu` + no explicit target, while this button's
                     click handler temporarily points `menuTarget` at itself
                     so the exact same menu can also open (anchored to the
                     button) via a plain left click. -->
                <q-btn
                  :ref="
                    (el) => {
                      if (el) dotsButtonEls[id] = (el as QBtn).$el;
                    }
                  "
                  :aria-label="t('more-options')"
                  class="congregation-dots-btn"
                  flat
                  icon="mmm-dots"
                  round
                  size="sm"
                  @click.stop="
                    menuTarget = dotsButtonEls[id] ?? true;
                    contextMenuCongId = id;
                  "
                >
                  <q-tooltip
                    v-if="contextMenuCongId !== id"
                    data-congregation-switcher-tooltip
                    :delay="500"
                  >
                    {{ t('more-options') }}
                  </q-tooltip>
                </q-btn>
              </div>
              <div
                v-if="currentCongregation === id"
                class="icon-chip text-primary"
              >
                <q-icon name="mmm-check" size="xs" />
              </div>
              <q-menu
                context-menu
                data-congregation-switcher-menu
                :model-value="contextMenuCongId === id"
                :target="contextMenuCongId === id ? menuTarget : true"
                touch-position
                @update:model-value="
                  (val) => {
                    if (val) contextMenuCongId = id;
                    else if (contextMenuCongId === id)
                      contextMenuCongId = undefined;
                  }
                "
              >
                <q-list role="menu" style="min-width: 150px">
                  <q-item
                    v-if="currentCongregation !== id"
                    v-close-popup
                    clickable
                    @click="
                      contextMenuCongId = undefined;
                      chooseCongregation(id);
                    "
                  >
                    <q-item-section avatar>
                      <q-icon name="mmm-check" />
                    </q-item-section>
                    <q-item-section>
                      {{ t('select-this-profile') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    @click="
                      contextMenuCongId = undefined;
                      exportCongregationSettings(prefs);
                    "
                  >
                    <q-item-section avatar>
                      <q-icon name="mmm-export" />
                    </q-item-section>
                    <q-item-section>
                      {{ t('export-profile-settings') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    @click="
                      contextMenuCongId = undefined;
                      congToDelete = id;
                    "
                  >
                    <q-item-section avatar>
                      <q-icon color="negative" name="mmm-delete" />
                    </q-item-section>
                    <q-item-section class="text-negative">
                      {{ t('delete') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item>
          </div>
        </q-list>

        <div
          v-ripple
          class="congregation-new cursor-pointer"
          role="button"
          tabindex="0"
          @click="createNewCongregation"
          @keydown.enter.space.prevent="createNewCongregation"
        >
          <q-icon class="q-mr-sm" name="mmm-plus" />
          {{ t('new-profile') }}
        </div>
      </q-card-section>
    </q-card>
  </BaseDialog>

  <ConfirmDialog
    v-model="deletePending"
    :confirm-label="t('delete')"
    data-congregation-switcher-confirm
    dialog-id="congregation-delete-dialog"
    icon="mmm-delete"
    :loading="deletingCongregation"
    :message="
      t('are-you-sure-you-want-to-delete-this-profile', {
        profileName: congregations[congToDelete]?.congregationName,
      })
    "
    :title="t('profile-deletion')"
    @cancel="congToDelete = ''"
    @confirm="handleDeleteCongregation"
  />
</template>

<script setup lang="ts">
import type { QBtn } from 'quasar';
import type { SettingsValues } from 'src/types';

import { watchImmediate } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { removeCongregationCache } from 'src/helpers/cleanup';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadSongbookVideos } from 'src/helpers/jw-media';
import { getTextColorForBgColor } from 'src/helpers/media-sections';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { exportProfileSettingsToFile } from 'src/utils/profile-settings';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { getDateLocale } = useLocale();
const { t } = useI18n({ useScope: 'global' });

const appSettings = useAppSettingsStore();

const congregationSettings = useCongregationSettingsStore();
const currentState = useCurrentStateStore();
const jwStore = useJwStore();
const { updateYeartext } = jwStore;
const { congregationCount, congregations } = storeToRefs(congregationSettings);
const { createCongregation, deleteCongregation } = congregationSettings;
const { invalidSettings, setCongregation } = currentState;
const {
  congregationSwitcherBootstrap,
  congregationSwitcherOpen,
  currentCongregation,
  currentLangObject,
  currentSettings,
  online,
} = storeToRefs(currentState);
const router = useRouter();

// Whether the dialog is actually visible - deliberately separate from
// congregationSwitcherOpen (the "has been requested" trigger below), so a
// bootstrap open that resolves itself (auto-select the sole congregation,
// or auto-create one when none exist) never has to visually flash the
// picker open just to immediately close it again.
const dialogVisible = ref(false);

const isOpen = computed({
  get: () => dialogVisible.value,
  set: (value) => {
    dialogVisible.value = value;
    congregationSwitcherOpen.value = value;
  },
});

const congToDelete = ref<number | string>('');
const deletePending = computed({
  get: () => !!congToDelete.value,
  set: (value) => {
    if (!value) congToDelete.value = '';
  },
});

// Per-row overflow/context menu - only one row's menu is ever meaningfully
// open at a time, so a single pair of refs (rather than one per row) is
// enough. `menuTarget` only matters while its id matches `contextMenuCongId`
// (see the q-menu's `:target` ternary in the template) - the dots button's
// own click handler points it at itself so the exact same menu can also be
// opened with a plain left click despite `context-menu` normally only
// responding to right-click. Real elements, not refs, so no need to be
// reactive.
const dotsButtonEls: Record<string, Element | undefined> = {};
const contextMenuCongId = ref<string | undefined>();
const menuTarget = ref<Element | true>(true);

async function exportCongregationSettings(prefs: SettingsValues) {
  try {
    const exported = await exportProfileSettingsToFile(prefs);
    if (exported) {
      createTemporaryNotification({
        classes: 'congregation-switcher-notify',
        message: t('profile-settings-exported'),
        type: 'positive',
      });
    }
  } catch (error) {
    errorCatcher(error);
    createTemporaryNotification({
      classes: 'congregation-switcher-notify',
      message: t('profile-settings-export-failed'),
      type: 'negative',
    });
  }
}

const AVATAR_COLORS = [
  'rgb(48, 117, 242)', // primary
  'rgb(60, 127, 139)', // treasures
  'rgb(214, 143, 0)', // apply
  'rgb(191, 47, 19)', // living
  'rgb(148, 94, 181)', // additional
];

function avatarColor(id: number | string) {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i);
    if (typeof codePoint !== 'number') continue;
    hash = Math.trunc(hash * 31 + codePoint);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Excludes a just-created congregation while it's being navigated away
// from (see createNewCongregation below) - otherwise the new tile (with
// its still-default name) briefly renders into this still-open list for a
// frame or two before the modal closes, a visible flicker.
const congregationIdPendingNavigation = ref<string | undefined>();

const sortedCongregations = computed(() =>
  Object.entries(congregations.value)
    .flatMap(([id, prefs]): { id: string; prefs: SettingsValues }[] =>
      prefs && id !== congregationIdPendingNavigation.value
        ? [{ id, prefs }]
        : [],
    )
    .sort((a, b) =>
      (a.prefs.congregationName || t('noName')).localeCompare(
        b.prefs.congregationName || t('noName'),
        undefined,
        { sensitivity: 'base' },
      ),
    ),
);

async function chooseCongregation(
  congregation: number | string,
  initialLoad?: boolean,
) {
  try {
    const invalidSettingsConfigured = await setCongregation(congregation);
    if (congregation) {
      if (globalThis?.electronApi) {
        globalThis.electronApi
          .getLowDiskSpaceStatus()
          .then((isLowDiskSpace) => {
            if (isLowDiskSpace) {
              createTemporaryNotification({
                caption: t('low-disk-space-warning'),
                deferWhileDialogOpen: true,
                message: t('disk-space-is-running-low'),
                timeout: 10000,
                type: 'warning',
              });
            }
          });
      }

      updateYeartext({
        isSignLanguage: currentLangObject.value?.isSignLanguage,
        lang: currentSettings.value?.lang,
        langFallback: currentSettings.value?.langFallback,
        online: online.value,
      });
      downloadSongbookVideos();
      // Close the modal only after the route has actually finished
      // changing - closing it first (as this used to) reveals whatever
      // page was already mounted underneath (e.g. an unconfigured media
      // calendar) for a frame or two before the real destination route
      // takes over, a visible flash of the wrong screen.
      if (initialLoad) {
        await router.push('/setup-wizard');
      } else if (invalidSettingsConfigured) {
        await router.push('/settings');
      } else {
        await router.push('/media-calendar/initial');
      }
      congregationSwitcherOpen.value = false;
      congregationIdPendingNavigation.value = undefined;
    }
  } catch (error) {
    errorCatcher(error);
    congregationSwitcherOpen.value = false;
    congregationIdPendingNavigation.value = undefined;
    router.push('/media-calendar');
  }
}

function createNewCongregation() {
  const id = createCongregation();
  congregationIdPendingNavigation.value = id;
  chooseCongregation(id, true);
}

const autoSelectCongregation = () => {
  if (congregationCount.value === 0) {
    createNewCongregation();
  } else if (
    congregationCount.value === 1 &&
    congregationSwitcherBootstrap.value
  ) {
    const id = Object.keys(congregations.value)[0];
    if (id) chooseCongregation(id);
  }
  // Every other case (manual reopen with >=1 congregation) requires a real
  // user choice - handled by requiresUserChoice below revealing the dialog,
  // nothing to auto-select here.
};

const removeCongregation = async (id: number | string) => {
  // Deleting the active profile would otherwise leave currentCongregation
  // pointing at an id that no longer exists in the congregations store,
  // making currentSettings resolve to undefined app-wide with no prompt to
  // pick a new one. Clearing it here forces the still-open picker's own
  // closability guard (currentCongregation must be truthy) to keep this
  // dialog open until the user actually chooses a remaining profile - the
  // same "closability reflects real safety" rule already applied to the
  // zero-congregation case.
  const wasActive = String(id) === currentCongregation.value;
  deleteCongregation(id);
  if (wasActive) currentCongregation.value = '';
  await removeCongregationCache(String(id));
};

const deletingCongregation = ref(false);
const handleDeleteCongregation = async () => {
  const id = congToDelete.value;
  if (!id) return;
  deletingCongregation.value = true;
  try {
    await removeCongregation(id);
  } finally {
    deletingCongregation.value = false;
    congToDelete.value = '';
  }
};

watchImmediate(congregationSwitcherOpen, async (open) => {
  if (!open) {
    dialogVisible.value = false;
    // This component is never unmounted (mounted once in MainLayout.vue),
    // so contextMenuCongId/menuTarget would otherwise survive a close and
    // could reopen a menu anchored to a since-detached button on the next
    // open. Clearing on close is cheap insurance against that, even though
    // every normal dismiss path (menu item click, Escape, outside-click)
    // already clears contextMenuCongId itself.
    contextMenuCongId.value = undefined;
    menuTarget.value = true;
    return;
  }

  const executedMigrations = await appSettings.ensureMigrations();

  if (executedMigrations.includes('firstRun')) {
    createTemporaryNotification({
      caption: t('successfully-migrated-from-the-previous-version'),
      deferWhileDialogOpen: true,
      message: t('welcome-to-mmm'),
      timeout: 15000,
      type: 'positive',
    });
  }

  // Auto-select cases (no congregations yet, or exactly one on a bootstrap
  // open) resolve themselves inside autoSelectCongregation() below with no
  // real user choice involved - only reveal the dialog when a choice is
  // actually possible, so those cases never flash the picker open just to
  // immediately close it again a moment later.
  const requiresUserChoice =
    congregationCount.value > 0 &&
    !(congregationCount.value === 1 && congregationSwitcherBootstrap.value);
  if (requiresUserChoice) {
    dialogVisible.value = true;
  }

  autoSelectCongregation();
});
</script>

<style lang="scss" scoped>
// This dialog needs to out-rank several of Quasar's own default stacking
// layers at once (see the individual rules below for why each one exists),
// so the whole local stack is named here relative to $z-notify (Quasar's
// own variable, imported from quasar.variables.scss - see app.scss's peers
// for confirmation the project-wide Sass-variables-everywhere-for-free setup
// applies equally to scoped component styles) rather than as a run of
// unrelated magic numbers. Each layer is defined relative to the one below
// it, so bumping the base still keeps every layer correctly ordered.
$congregation-switcher-z-dialog: $z-notify + 100; // above notifications already on screen when this dialog opens (see the dialog rule below)
$congregation-switcher-z-portal: $congregation-switcher-z-dialog + 1; // menu + tooltip, teleported siblings of the dialog itself
$congregation-switcher-z-confirm: $congregation-switcher-z-portal + 1; // the delete-confirmation ConfirmDialog, opened from within this one
$congregation-switcher-z-notify: $congregation-switcher-z-confirm + 1; // a notification fired while this dialog is open, e.g. the export-settings toast

// A backdrop blur (rather than a plain darkened scrim) so switching feels
// like a light overlay on top of the still-visible app, not a full
// navigation away from it.
//
// QDialog teleports its whole subtree (backdrop + inner) to <body> as one
// block, breaking any real DOM ancestor relationship with this component's
// own template root - so a plain scoped `:deep(.q-dialog__backdrop)` never
// matches anything (there's no live descendant relationship left to match
// against). `data-congregation-switcher` above falls through onto that same
// teleported root (Vue's automatic attrs fallthrough survives the
// teleport), so this :global() selector can still target only this
// dialog's own backdrop instead of blurring every dialog in the app.
:global([data-congregation-switcher] .q-dialog__backdrop) {
  backdrop-filter: blur(6px);
}

// Quasar notifications sit at $z-notify (9500), above a plain dialog's
// z-index (6000) by default - fine for a notification that fires while
// this dialog is open (deferWhileDialogOpen, see notifications.ts, holds
// those back until it closes), but not for one that's already live and
// visible on screen *before* this dialog opens: it would otherwise stay
// stacked on top for as long as both are showing. Force this dialog itself
// above that, so opening it always covers whatever's already live.
:global([data-congregation-switcher]) {
  z-index: $congregation-switcher-z-dialog !important;
}

// The 3-dot overflow q-menu teleports to its own portal, a sibling of the
// dialog's teleported content rather than a descendant of it - so boosting
// the dialog's z-index above (this rule doesn't cascade to it, and at equal
// z-index it would otherwise win on DOM order alone since it opens after the
// dialog). Without this, the menu still opens (confirmed structurally) but
// renders invisibly behind the dialog's own now-higher-stacked content.
:global([data-congregation-switcher-menu]) {
  z-index: $congregation-switcher-z-portal !important;
}

// Same root cause once more: the dots button's own q-tooltip (added so its
// otherwise-icon-only action is screen-reader- and glance-discoverable) is a
// third independently-teleported portal, defaulting to Quasar's tooltip
// z-index which also sits below this dialog's forced 9600.
:global([data-congregation-switcher-tooltip]) {
  z-index: $congregation-switcher-z-portal !important;
}

// Same root cause again, one level deeper: the delete-confirmation
// ConfirmDialog is a second, separately-teleported dialog opened from
// within this one (via the overflow menu's Delete item) - without its own
// boost it stays at Quasar's default dialog z-index (6000) and renders
// invisibly *behind* this dialog's own forced 9600, even though it's
// meant to sit on top of it as the next step in the flow.
:global([data-congregation-switcher-confirm]) {
  z-index: $congregation-switcher-z-confirm !important;
}

// Same root cause a third time, in the other direction: a notification
// (e.g. the export-settings success/failure toast) fired *while* this
// dialog is open is direct feedback for something the user just did in it,
// so it should show immediately on top - not deferred (deferWhileDialogOpen
// is for unrelated background side effects, see notifications.ts) and not
// hidden behind this dialog's own forced 9600. `.q-notifications__list` is
// a single container shared app-wide (not per-notification), so it can't be
// targeted with a data attribute the way the menu/confirm dialog above are
// - instead this uses `:has()` as a live hook: whenever a notification
// carrying this class is actually present, the whole list (and thus
// whatever else happens to be showing alongside it) is boosted; once it's
// dismissed and removed from the DOM, `:has()` stops matching and the list
// falls back to Quasar's default 9500 automatically.
:global(.q-notifications__list:has(.congregation-switcher-notify)) {
  z-index: $congregation-switcher-z-notify !important;
}

.congregation-switcher {
  min-width: 360px;
  width: min(560px, 90vw);
}

// The shared .media-section class only reserves space on the left (for its
// colored accent bar) via padding-left, with no matching padding-right -
// fine for the media list's own rows, but this card's avatar+text+actions
// row needs the same inset on both sides to look centered. Scoped here
// rather than changed on the shared class, which is also used (with a
// different content shape) by the media list, present-website, and
// settings pages.
.congregation-switcher .media-section.congregation {
  padding-right: 1.25em;
}

.congregation-avatar {
  align-items: center;
  border-radius: 0.6em;
  color: white;
  display: flex;
  flex-shrink: 0;
  font-weight: 600;
  height: 2.25em;
  justify-content: center;
  width: 2.25em;
}

// Dimmed (not fully hidden) until the row is hovered (or focused, for
// keyboard users), then reaches full opacity after a short pause - the
// partial resting opacity keeps Export/Delete discoverable at a glance
// (they're the only two non-switch actions on this screen) while still
// letting the row itself read as the primary click target. :focus-within
// keeps it reachable without a mouse. Fade-out on mouse-leave/blur stays
// instant (no delay), only the appearing direction is delayed - same idiom
// as the tag-chip pencil hint badge in app.scss.
.congregation-dots-btn {
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.media-section.congregation:focus-within .congregation-dots-btn,
.media-section.congregation:hover .congregation-dots-btn {
  opacity: 1;
  transition-delay: 400ms;
}

.congregation-new {
  align-items: center;
  border: 1.5px dashed var(--q-primary);
  border-radius: 0.75em;
  color: var(--q-primary);
  display: flex;
  font-weight: 600;
  justify-content: center;
  margin-top: 0.5em;
  padding: 0.75em;
}
</style>
