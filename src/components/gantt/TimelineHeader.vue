<template>
  <div
      class="timeline-header w-full h-full flex flex-col select-none"
      :style="{ width: `${timelineWidth}px` }"
  >
    <!-- Primary header row (months/years) -->
    <div class="h-6 flex">
      <div
          v-for="header in headerItems.primary"
          :key="header.key"
          class="h-full border-r border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600"
          :style="{
          left: `${header.left}px`,
          width: `${header.width}px`
        }"
      >
        {{ header.label }}
      </div>
    </div>

    <!-- Secondary header row (days/weeks) -->
    <div class="h-6 flex border-t border-gray-300">
      <div
          v-for="header in headerItems.secondary"
          :key="header.key"
          class="h-full border-r border-gray-300 flex items-center justify-center text-xs text-gray-500"
          :style="{
          left: `${header.left}px`,
          width: `${header.width}px`
        }"
      >
        {{ header.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TimelineHeaderItem } from '@/composables/useGanttTimeline';

interface Props {
  headerItems: {
    primary: TimelineHeaderItem[],
    secondary: TimelineHeaderItem[]
  },
  timelineWidth: number
}

const props = defineProps<Props>();
</script>
