<template>
  <v-dialog v-model="$attrs.value" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h5">
        {{ $t('areYouSure') }}
      </v-card-title>

      <v-card-text>
        {{ $t(description) }}
      </v-card-text>
      <v-card-text>
        <slot />
      </v-card-text>
      <v-card-actions>
        <v-spacer />

        <v-btn color="error" @click="$emit('cancel')">
          {{ $t('cancel') }}
        </v-btn>

        <v-btn color="success" @click="$emit('confirm')">
          {{ $t('confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    description: {
      type: String,
      required: true,
    },
  },
})
</script>
