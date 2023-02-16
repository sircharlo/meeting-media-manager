<template>
  <div
    id="media-list-container"
    :style="`
        width: 100%;
        overflow-y: auto;
        ${listHeight}
      `"
  >
    <song-picker
      v-if="addSong"
      ref="songPicker"
      v-model="song"
      class="pa-4"
      clearable
    />
    <template v-if="song">
      <v-list class="ma-4">
        <media-item
          :key="song.url"
          :src="song.url"
          :play-now="song.play"
          :stop-now="song.stop"
          :deactivate="song.deactivate"
          :media-active="mediaActive"
          :video-active="videoActive"
          :cc-enable="ccEnable"
          :show-prefix="showPrefix"
          :streaming-file="song"
          :zoom-part="zoomPart"
          @playing="setIndex(-1)"
          @deactivated="song.deactivate = false"
        />
      </v-list>
      <v-divider class="mx-4" />
    </template>
    <template v-if="isMwDay">
      <v-divider class="mx-4 mt-4 treasures" />
      <v-list-item-title class="mx-4 my-2 treasures--text text-overline">
        {{ mwbHeadings.treasures }}
      </v-list-item-title>
      <draggable
        v-model="treasureItems"
        tag="v-list"
        handle=".sort-btn"
        group="media-items"
        class="ma-4"
        @start="dragging = true"
        @end="dragging = false"
      >
        <media-item
          v-for="(item, i) in treasureItems"
          :key="item.id"
          :src="item.path"
          :play-now="item.play"
          :stop-now="item.stop"
          :deactivate="item.deactivate"
          :media-active="mediaActive"
          :video-active="videoActive"
          :cc-enable="ccEnable"
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(i)"
          @deactivated="resetDeactivate(i)"
        />
      </draggable>
      <template v-if="applyItems.length > 0">
        <v-divider class="mx-4 apply" />
        <v-list-item-title class="mx-4 my-2 apply--text text-overline">
          {{ mwbHeadings.apply }}
        </v-list-item-title>
        <draggable
          v-model="applyItems"
          tag="v-list"
          handle=".sort-btn"
          group="media-items"
          class="ma-4"
          @start="dragging = true"
          @end="dragging = false"
        >
          <media-item
            v-for="(item, i) in applyItems"
            :key="item.id"
            :src="item.path"
            :play-now="item.play"
            :stop-now="item.stop"
            :deactivate="item.deactivate"
            :media-active="mediaActive"
            :cc-enable="ccEnable"
            :video-active="videoActive"
            :show-prefix="showPrefix"
            :sortable="sortable"
            :zoom-part="zoomPart"
            @playing="setIndex(treasureItems.length + i)"
            @deactivated="resetDeactivate(treasureItems.length + i)"
          />
        </draggable>
      </template>
      <v-divider class="mx-4 living" />
      <v-list-item-title class="mx-4 my-2 living--text text-overline">
        {{ mwbHeadings.living }}
      </v-list-item-title>
      <draggable
        v-model="livingItems"
        tag="v-list"
        handle=".sort-btn"
        group="media-items"
        class="ma-4"
        @start="dragging = true"
        @end="dragging = false"
      >
        <media-item
          v-for="(item, i) in livingItems"
          :key="item.id"
          :src="item.path"
          :play-now="item.play"
          :stop-now="item.stop"
          :deactivate="item.deactivate"
          :media-active="mediaActive"
          :cc-enable="ccEnable"
          :video-active="videoActive"
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(treasureItems.length + applyItems.length + i)"
          @deactivated="
            resetDeactivate(treasureItems.length + applyItems.length + i)
          "
        />
      </draggable>
    </template>
    <template v-else-if="isWeDay">
      <v-list-item-title class="mx-4 my-4 treasures--text text-overline">
        {{ $t('publicTalk') }}
      </v-list-item-title>
      <draggable
        v-model="publicTalkItems"
        tag="v-list"
        handle=".sort-btn"
        group="media-items"
        class="ma-4"
        @start="dragging = true"
        @end="dragging = false"
      >
        <media-item
          v-for="(item, i) in publicTalkItems"
          :key="item.id"
          :src="item.path"
          :play-now="item.play"
          :stop-now="item.stop"
          :deactivate="item.deactivate"
          :media-active="mediaActive"
          :video-active="videoActive"
          :cc-enable="ccEnable"
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(i)"
          @deactivated="resetDeactivate(i)"
        />
      </draggable>
      <v-divider class="mx-4 living" />
      <v-list-item-title class="mx-4 my-2 living--text text-overline">
        {{ wtTitle }}
      </v-list-item-title>
      <draggable
        v-model="wtItems"
        tag="v-list"
        handle=".sort-btn"
        group="media-items"
        class="ma-4"
        @start="dragging = true"
        @end="dragging = false"
      >
        <media-item
          v-for="(item, i) in wtItems"
          :key="item.id"
          :src="item.path"
          :play-now="item.play"
          :stop-now="item.stop"
          :deactivate="item.deactivate"
          :cc-enable="ccEnable"
          :media-active="mediaActive"
          :video-active="videoActive"
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(publicTalkItems.length + i)"
          @deactivated="resetDeactivate(publicTalkItems.length + i)"
        />
      </draggable>
    </template>
    <draggable
      v-else
      v-model="mediaItems"
      tag="v-list"
      handle=".sort-btn"
      group="media-items"
      class="ma-4"
      @start="dragging = true"
      @end="dragging = false"
    >
      <media-item
        v-for="(item, i) in mediaItems"
        :key="item.id"
        :src="item.path"
        :play-now="item.play"
        :stop-now="item.stop"
        :deactivate="item.deactivate"
        :media-active="mediaActive"
        :video-active="videoActive"
        :show-prefix="showPrefix"
        :cc-enable="ccEnable"
        :sortable="sortable"
        :zoom-part="zoomPart"
        @playing="setIndex(i)"
        @deactivated="resetDeactivate(i)"
      />
    </draggable>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { basename, join } from 'upath'
import draggable from 'vuedraggable'
// eslint-disable-next-line import/named
import { readFileSync } from 'fs-extra'
import { VideoFile, MeetingFile } from '~/types'
import { BIBLE_READING_PAR_NR } from '~/constants/general'

type MediaItem = {
  id: string
  path: string
  play: boolean
  stop: boolean
  deactivate: boolean
}
export default defineComponent({
  components: {
    draggable,
  },
  props: {
    items: {
      type: Array as PropType<MediaItem[]>,
      required: true,
    },
    mediaActive: {
      type: Boolean,
      default: false,
    },
    videoActive: {
      type: Boolean,
      default: false,
    },
    ccEnable: {
      type: Boolean,
      default: true,
    },
    windowHeight: {
      type: Number,
      required: true,
    },
    zoomPart: {
      type: Boolean,
      default: false,
    },
    showPrefix: {
      type: Boolean,
      default: false,
    },
    sortable: {
      type: Boolean,
      default: false,
    },
    addSong: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dragging: false,
      meetingDay: '',
      mwbHeadings: {
        treasures: 'TREASURES FROM GOD’S WORD',
        apply: 'APPLY YOURSELF TO THE FIELD MINISTRY',
        living: 'LIVING AS CHRISTIANS',
      },
      mediaItems: [] as MediaItem[],
      treasureItems: [] as MediaItem[],
      applyItems: [] as MediaItem[],
      livingItems: [] as MediaItem[],
      publicTalkItems: [] as MediaItem[],
      wtItems: [] as MediaItem[],
      song: null as null | VideoFile,
    }
  },
  computed: {
    date(): string {
      return this.$route.query.date as string
    },
    listHeight(): string {
      const TOP_BAR = 64
      const FOOTER = 72
      const otherElements = TOP_BAR + FOOTER
      return `max-height: ${this.windowHeight - otherElements}px`
    },
    meetings(): Map<string, Map<number, MeetingFile[]>> {
      return this.$store.state.media.meetings as Map<
        string,
        Map<number, MeetingFile[]>
      >
    },
    wtTitle(): string {
      const file = this.$findOne(join(this.$mediaPath(), this.date, '*.title'))
      return file ? `${basename(file, '.title')}` : 'Watchtower'
    },
    isMwDay(): boolean {
      return this.meetingDay === 'mw'
    },
    isWeDay(): boolean {
      return this.meetingDay === 'we'
    },
    firstWtSong(): number {
      return this.mediaItems.findIndex((item) =>
        basename(item.path).startsWith('03-01')
      )
    },
    firstApplyItem(): number {
      const meetingMap = this.meetings.get(this.date)
      if (meetingMap) {
        const firstApplyPar = [...meetingMap.keys()]
          .sort((a, b) => a - b)
          .find((key) => key > BIBLE_READING_PAR_NR) as number
        const firstApplyItems = meetingMap.get(firstApplyPar)
        if (firstApplyItems && firstApplyItems[0]?.folder) {
          const index = this.mediaItems.findIndex(
            (item) => item.path === this.$mediaPath(firstApplyItems[0])
          )
          if (index > 0) return index
        }
      }

      if (this.$getPrefs('media.excludeTh')) {
        return (
          this.mediaItems.findIndex((item) =>
            basename(item.path).startsWith('02')
          ) +
          this.mediaItems.filter((item) => basename(item.path).startsWith('02'))
            .length
        )
      }

      return (
        this.mediaItems
          .slice(this.firstMwbSong + 1)
          .findIndex((item) => /- \w+ \d{1,2} - /.test(basename(item.path))) +
        this.firstMwbSong +
        2
      )
    },
    firstMwbSong(): number {
      return this.mediaItems.findIndex((item) =>
        basename(item.path).includes(` - ${this.$translate('song')} `)
      )
    },
    secondMwbSong(): number {
      return (
        this.mediaItems
          .slice(this.firstMwbSong + 1)
          .findIndex((item) =>
            basename(item.path).includes(` - ${this.$translate('song')} `)
          ) +
        this.firstMwbSong +
        1
      )
    },
  },
  watch: {
    song() {
      this.$emit('song')
    },
    items(val: MediaItem[]) {
      this.setItems(val)
    },
  },
  mounted() {
    this.setItems(this.items)
    this.getMwbHeadings()
    this.meetingDay = this.$isMeetingDay(
      this.$dayjs(
        this.date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      )
    )
  },
  methods: {
    setItems(val: MediaItem[]) {
      this.mediaItems = val
      this.publicTalkItems = val.slice(0, this.firstWtSong)
      this.wtItems = val.slice(this.firstWtSong)
      this.treasureItems = val.slice(
        0,
        Math.min(this.firstApplyItem, this.secondMwbSong)
      )
      this.livingItems = val.slice(this.secondMwbSong)
      if (this.firstApplyItem >= this.secondMwbSong) {
        this.applyItems = []
      } else {
        this.applyItems = val.slice(this.firstApplyItem, this.secondMwbSong)
      }
    },
    getMwbHeadings() {
      const fallback = {
        treasures: 'TREASURES FROM GOD’S WORD',
        apply: 'APPLY YOURSELF TO THE FIELD MINISTRY',
        living: 'LIVING AS CHRISTIANS',
      }
      try {
        const file = readFileSync(
          join(this.$pubPath(), 'mwb', 'headings.json'),
          'utf8'
        )
        this.mwbHeadings = file ? JSON.parse(file) : fallback
      } catch (e: any) {
        this.mwbHeadings = fallback
      }
    },
    resetDeactivate(index: number) {
      this.$emit('deactivate', index)
    },
    setIndex(index: number) {
      this.$emit('index', index)
    },
  },
})
</script>
