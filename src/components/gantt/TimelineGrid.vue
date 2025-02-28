<template>
  <div
      class="timeline-grid absolute top-0 left-0 w-full h-full pointer-events-none"
      :style="{ width: `${timelineWidth}px` }"
  >
    <!-- Vertical grid lines -->
    <div
        v-for="line in gridLines"
        :key="line.key"
        class="absolute top-0 h-full border-l border-gray-200"
        :style="{ left: `${line.left}px` }"
    ></div>

    <!-- Today's date indicator if within view -->
    <div
        v-if="isTodayVisible"
        class="absolute top-0 h-full border-l-2 border-red-500 z-10"
        :style="{ left: `${todayPosition}px` }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface GridLine {
  key: string;
  left: number;
}

interface Props {
  gridLines: GridLine[];
  timelineWidth: number;
  startDate: Date;
  pixelsPerDay: number;
}

const props = defineProps<Props>();

// Calculate if today is visible in the timeline
const today = new Date();
today.setHours(0, 0, 0, 0);

const isTodayVisible = computed(() => {
  const endDate = new Date(props.startDate);
  endDate.setDate(endDate.getDate() + props.timelineWidth / props.pixelsPerDay);

  return today >= props.startDate && today <= endDate;
});

const todayPosition = computed(() => {
  if (!isTodayVisible.value) return 0;

  const diffTime = today.getTime() - props.startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays * props.pixelsPerDay;
});
</script>
