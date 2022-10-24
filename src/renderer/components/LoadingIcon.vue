<!-- A loading indicator -->
<template>
  <div class="text-center my-10">
    <v-progress-circular indeterminate />
    <div v-if="message" class="text-center mt-2">
      <h4 class="white--text">{{ message }}</h4>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    message: {
      type: String,
      default: null,
    },
  },
})
</script>
