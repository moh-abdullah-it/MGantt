<template>
  <button
      @click="toggleDarkMode"
      class="p-2 text-sm bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-300"
  >
    <span v-if="isDark">{{ $t('toolbar.lightMode') }}</span>
    <span v-else>{{ $t('toolbar.darkMode') }}</span>
  </button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const isDark = ref(localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.theme = isDark.value ? 'dark' : 'light';
};
</script>
