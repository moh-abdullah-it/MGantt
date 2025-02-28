<template>
  <div
      v-if="!task.isMilestone"
      class="absolute h-5 rounded bg-blue-500 hover:opacity-80 dark:bg-blue-400 dark:hover:opacity-90 cursor-move flex items-center px-1 text-white text-xs"
      :class="{ 'resizing': isResizing }"
      :style="taskStyle"
      @mousedown="onTaskBarMouseDown"
  >
    {{ task.content }}

    <!-- Resize handles -->
    <div
        v-if="isResizable"
        class="resize-handle resize-handle-left"
        @mousedown.stop="onResizeHandleMouseDown('start', $event)"
    ></div>
    <div
        v-if="isResizable"
        class="resize-handle resize-handle-right"
        @mousedown.stop="onResizeHandleMouseDown('end', $event)"
    ></div>
  </div>

  <!-- Milestone -->
  <div
      v-else
      class="absolute h-5 w-5 transform rotate-45 bg-amber-500 hover:opacity-80 cursor-pointer"
      :style="{ left: `${getTaskPosition(task)}px`, top: '8px' }"
      @mousedown="onTaskBarMouseDown"
  ></div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { GanttTask } from '@/types/gantt';
import { PropType } from 'vue';

const props = defineProps({
  task: {
    type: Object as PropType<GanttTask>,
    required: true
  },
  taskStyle: {
    type: Object,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  pixelsPerDay: {
    type: Number,
    required: true
  },
  isResizing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['mousedown', 'resize-start']);

// Check if task is resizable
const isResizable = computed(() => {
  // Use resizable property if defined, otherwise true for normal tasks, false for milestones
  return props.task.resizable !== undefined
      ? props.task.resizable
      : !props.task.isMilestone;
});

// Get position for milestone tasks
const getTaskPosition = (task: GanttTask) => {
  const startDiff = Math.floor(
      (task.start.getTime() - props.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return startDiff * props.pixelsPerDay;
};

// Forward mousedown event to parent
const onTaskBarMouseDown = (event: MouseEvent) => {
  emit('mousedown', { task: props.task, event });
};

// Start resize operation
const onResizeHandleMouseDown = (edge: 'start' | 'end', event: MouseEvent) => {
  event.stopPropagation(); // Prevent event from bubbling to task bar
  emit('resize-start', { edge, event, task: props.task });
};
</script>

<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  height: 100%;
  width: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  transition: background-color 0.2s;
  z-index: 2;
}

.resize-handle:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

.resize-handle-left {
  left: 0;
  cursor: ew-resize;
}

.resize-handle-right {
  right: 0;
  cursor: ew-resize;
}

.resizing {
  opacity: 0.8;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}
</style>
