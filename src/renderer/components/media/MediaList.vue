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
      <v-list-item-title class="mx-4 my-2 treasures--text">
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
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(i)"
          @deactivated="resetDeactivate(i)"
        />
      </draggable>
      <template v-if="applyItems.length > 0">
        <v-divider class="mx-4 apply" />
        <v-list-item-title class="mx-4 my-2 apply--text">
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
      <v-list-item-title class="mx-4 my-2 living--text">
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
      <v-list-item-title class="mx-4 my-4 treasures--text">
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
          :show-prefix="showPrefix"
          :sortable="sortable"
          :zoom-part="zoomPart"
          @playing="setIndex(i)"
          @deactivated="resetDeactivate(i)"
        />
      </draggable>
      <v-divider class="mx-4 treasures" />
      <v-list-item-title class="mx-4 my-2 treasures--text">
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
import { Dayjs } from 'dayjs'
// eslint-disable-next-line import/named
import { readFileSync } from 'fs-extra'
import { VideoFile, MeetingFile } from '~/types'

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
      mwbHeadings: {
        treasure: 'TREASURES FROM GOD’S WORD',
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
    dateObj(): Dayjs {
      return this.$dayjs(
        this.date,
        this.$getPrefs('app.outputFolderDateFormat') as string
      )
    },
    weekDay(): number {
      return this.dateObj.day() === 0 ? 6 : this.dateObj.day() - 1 // Day is 0 indexed and starts with Sunday
    },
    listHeight(): string {
      const OTHER_ELEMENTS = 136
      return `max-height: ${this.windowHeight - OTHER_ELEMENTS}px`
    },
    meetings(): Map<string, Map<number, MeetingFile[]>> {
      return this.$store.state.media.meetings as Map<
        string,
        Map<number, MeetingFile[]>
      >
    },
    wtTitle(): string {
      const file = this.$findOne(join(this.$mediaPath(), this.date, '*.title'))
      return file
        ? `${this.$t('watchtower')}: ${basename(file, '.title')}`
        : (this.$t('watchtower') as string)
    },
    isMwDay(): boolean {
      return this.weekDay === this.$getMwDay(this.dateObj.startOf('week'))
    },
    isWeDay(): boolean {
      return this.weekDay === (this.$getPrefs('meeting.weDay') as number)
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
          // eslint-disable-next-line no-magic-numbers
          .find((key) => key > 12) as number
        const firstApplyItems = meetingMap.get(firstApplyPar)
        if (firstApplyItems && firstApplyItems[0]?.folder) {
          return this.mediaItems.findIndex(
            (item) => item.path === this.$mediaPath(firstApplyItems[0])
          )
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
          .slice(1)
          .findIndex((item) => /- \w+ \d{1,2} - /.test(basename(item.path))) + 2
      )
    },
    secondMwbSong(): number {
      return (
        this.mediaItems
          .slice(1)
          .findIndex((item) =>
            basename(item.path).includes(` - ${this.$translate('song')} `)
          ) + 1
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
  },
  methods: {
    setItems(val: MediaItem[]) {
      this.mediaItems = val
      this.publicTalkItems = val.slice(0, this.firstWtSong)
      this.wtItems = val.slice(this.firstWtSong)
      this.treasureItems = val.slice(0, this.firstApplyItem)
      this.livingItems = val.slice(this.secondMwbSong)
      if (this.firstApplyItem === this.secondMwbSong) {
        this.applyItems = []
      } else {
        this.applyItems = val.slice(this.firstApplyItem, this.secondMwbSong)
      }
    },
    getMwbHeadings() {
      const fallback = {
        treasure: 'TREASURES FROM GOD’S WORD',
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
