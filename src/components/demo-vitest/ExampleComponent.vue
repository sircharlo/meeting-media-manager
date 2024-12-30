<template>
  <div>
    <p>{{ title }}</p>
    <q-list>
      <q-item v-for="todo in todos" :key="todo.id" clickable @click="increment">
        {{ todo.id }} - {{ todo.content }}
      </q-item>
    </q-list>

    <p>Count: {{ todoCount }} / {{ meta.totalCount }}</p>
    <p>Active: {{ active ? 'yes' : 'no' }}</p>
    <p>Clicks on todos: {{ clickCount }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

interface Meta {
  totalCount: number;
}

interface Todo {
  content: string;
  id: number;
}

const props = withDefaults(
  defineProps<{
    active?: boolean;
    meta: Meta;
    title: string;
    todos?: Todo[];
  }>(),
  {
    todos: () => [],
  },
);

const clickCount = ref(0);
function increment() {
  clickCount.value += 1;
  return clickCount.value;
}

const todoCount = computed(() => props.todos.length);
</script>
