<template>
  <v-row align="center" style="width: 100%">
    <v-col cols="1" class="text-center" align-self="center">
      <font-awesome-icon :icon="faPhotoFilm" />
    </v-col>
    <v-col cols="11">
      <v-btn-toggle
        v-model="$attrs.value"
        color="primary"
        style="width: 100%"
        :mandatory="!!$attrs.value"
        @change="$emit('input', $event)"
      >
        <v-btn
          v-for="t in types"
          :id="`btn-select-${t.value}`"
          :key="t.value"
          :width="`${100 / types.length}%`"
          :value="t.value"
          :disabled="disabled"
        >
          {{ t.label }}
        </v-btn>
      </v-btn-toggle>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { faPhotoFilm, IconDefinition } from '@fortawesome/free-solid-svg-icons'
export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      types: [
        {
          label: this.$t('song') as string,
          value: 'song',
        },
        {
          label: this.$t('custom') as string,
          value: 'custom',
        },
        {
          label: this.$t('jwpub') as string,
          value: 'jwpub',
        },
        {
          label: this.$t('jwlplaylist') as string,
          value: 'jwlplaylist',
        },
        {
          label: this.$t('syncJwOrgMedia') as string,
          value: 'jworg',
        },
      ] as { label: string; value: string }[],
    }
  },
  computed: {
    faPhotoFilm(): IconDefinition {
      return faPhotoFilm
    },
  },
})
</script>
