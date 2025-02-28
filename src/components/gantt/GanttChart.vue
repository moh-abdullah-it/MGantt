<template>
  <div
      class="w-full h-full flex flex-col border border-gray-200 rounded-md bg-white dark:border-gray-600 dark:bg-gray-800 select-none"
      style="--gantt-row-height: 36px;"
  >
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center p-4 sm:p-2 border-b border-gray-200 dark:border-gray-700 gap-2">
      <slot name="toolbar">
        <button
            @click="zoomIn"
            class="px-3 py-1 bg-gantt-primary text-white rounded text-sm hover:bg-opacity-90"
        >
          {{ $t('toolbar.zoomIn') }}
        </button>
        <button
            @click="zoomOut"
            class="px-3 py-1 bg-gantt-primary text-white rounded text-sm hover:bg-opacity-90"
        >
          {{ $t('toolbar.zoomOut') }}
        </button>
        <select
            v-model="currentView"
            @change="onViewChange"
            class="px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:text-gray-300"
        >
          <option value="day">{{ $t('toolbar.day') }}</option>
          <option value="week">{{ $t('toolbar.week') }}</option>
          <option value="month">{{ $t('toolbar.month') }}</option>
          <option value="year">{{ $t('toolbar.year') }}</option>
        </select>
        <div class="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {{ $t('toolbar.tasksCount', { count: tasks.length }) }}
        </div>
        <!-- Dark Mode toggle -->
        <ThemeToggle />
      </slot>
    </div>

    <!-- Content area -->
    <div class="flex-1 flex flex-col sm:flex-row overflow-auto">
      <!-- Task Grid -->
      <div class="w-full sm:w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div class="h-12 border-b border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700 font-bold flex items-center px-3">
          {{ $t('grid.taskName') }}
        </div>
        <div>
          <div
              v-for="task in tasks"
              :key="task.id"
              class="h-9 border-b border-gray-100 dark:border-gray-700 px-3 flex items-center"
          >
            {{ task.content }}
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="flex-1 flex flex-col overflow-auto">
        <!-- Timeline Header -->
        <div class="h-12 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
          <TimelineHeader
              :headerItems="headerItems"
              :timelineWidth="timelineWidth"
          />
        </div>

        <!-- Timeline Body -->
        <div class="flex-1 relative">
          <!-- Grid Lines -->
          <TimelineGrid
              :gridLines="gridLines"
              :timelineWidth="timelineWidth"
              :startDate="startDate"
              :pixelsPerDay="pixelsPerDay"
          />

          <!-- Task Bars -->
          <div>
            <div
                v-for="task in tasks"
                :key="`row-${task.id}`"
                class="h-9 border-b border-gray-100 dark:border-gray-700 relative"
            >
              <!-- ===== الجزء الذي تم تغييره: استخدام مكون TaskBar بدلاً من عرض المهام مباشرة ===== -->
              <TaskBar
                  :task="task"
                  :task-style="getTaskBarStyle(task)"
                  :start-date="startDate"
                  :pixels-per-day="pixelsPerDay"
                  :is-resizing="isResizing && resizeTask?.id === task.id"
                  @mousedown="onTaskBarMouseDown"
                  @resize-start="onResizeStart"
              />
            </div>
          </div>

          <!-- Resize tooltip (عندما يكون المستخدم يغير حجم المهمة) -->
          <div
              v-if="isResizing && resizeTask"
              class="resize-tooltip"
              :style="{ left: `${resizeTooltipX}px`, top: `${resizeTooltipY}px` }"
          >
            {{ resizeEdge === 'start' ? formatDate(resizeTask.start) : formatDate(resizeTask.finish) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import type { GanttTask, GanttResource, TaskResizeEvent } from '@/types/gantt';
import { useGanttTimeline } from '@/composables/useGanttTimeline';
import TimelineHeader from './TimelineHeader.vue';
import TimelineGrid from './TimelineGrid.vue';
import ThemeToggle from '../ThemeToggle.vue';
import TaskBar from './TaskBar.vue';
import { PropType } from 'vue';

// Props
const props = defineProps({
  tasks: {
    type: Array as PropType<GanttTask[]>,
    required: true,
  },
  resources: {
    type: Array as PropType<GanttResource[]>,
    default: () => [],
  },
  startDate: {
    type: Date,
    default: () => new Date(),
  },
  endDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setMonth(date.getMonth() + 3);
      return date;
    },
  },
});

// Emit events
const emit = defineEmits(['task-updated', 'dependency-created', 'task-selected', 'task-resized']);

// Reactive states
const ganttContent = ref<HTMLDivElement | null>(null);
const currentView = ref<'day' | 'week' | 'month' | 'year'>('week');
const selectedTaskId = ref<string | null>(null);

// Dragging states
const isDragging = ref(false);
const dragTask = ref<GanttTask | null>(null);
const dragStartX = ref(0);
const originalTaskStart = ref<Date | null>(null);
const originalTaskFinish = ref<Date | null>(null);

// Resizing states
const isResizing = ref(false);
const resizeTask = ref<GanttTask | null>(null);
const resizeEdge = ref<'start' | 'end' | null>(null);
const resizeStartX = ref(0);
const originalResizeDate = ref<Date | null>(null);
const resizeTooltipX = ref(0);
const resizeTooltipY = ref(0);

// Composable: Use Gantt Timeline
const {
  pixelsPerDay,
  timelineWidth,
  headerItems,
  gridLines,
  currentViewMode,
  getTaskBarStyle,
  zoomIn,
  zoomOut,
  setViewMode,
} = useGanttTimeline(props.startDate, props.endDate);

// Format date for tooltip
const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Handle view mode changes
const onViewChange = () => {
  setViewMode(currentView.value);
};

// Task Bar Dragging
const onTaskBarMouseDown = ({ task, event }: { task: GanttTask, event: MouseEvent }) => {
  event.preventDefault();
  isDragging.value = true;
  dragTask.value = task;
  dragStartX.value = event.clientX;
  originalTaskStart.value = new Date(task.start);
  originalTaskFinish.value = new Date(task.finish);
  selectedTaskId.value = task.id;

  // Add event listeners for drag
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  emit('task-selected', task);
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !dragTask.value || !originalTaskStart.value || !originalTaskFinish.value) return;

  const deltaX = event.clientX - dragStartX.value;
  const daysDelta = Math.round(deltaX / pixelsPerDay.value);

  if (daysDelta === 0) return;

  // Update dates
  const newStart = new Date(originalTaskStart.value);
  newStart.setDate(newStart.getDate() + daysDelta);
  const newFinish = new Date(originalTaskFinish.value);
  newFinish.setDate(newFinish.getDate() + daysDelta);

  dragTask.value.start = newStart;
  dragTask.value.finish = newFinish;

  emit('task-updated', { task: dragTask.value, changes: { start: newStart, finish: newFinish }, final: false });
};

const onMouseUp = () => {
  if (isDragging.value && dragTask.value) {
    emit('task-updated', { task: dragTask.value, changes: { start: dragTask.value.start, finish: dragTask.value.finish }, final: true });
  }

  isDragging.value = false;
  dragTask.value = null;
  originalTaskStart.value = null;
  originalTaskFinish.value = null;

  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
};

// Task Resizing
const onResizeStart = ({ edge, event, task }: { edge: 'start' | 'end', event: MouseEvent, task: GanttTask }) => {
  event.preventDefault();
  isResizing.value = true;
  resizeTask.value = task;
  resizeEdge.value = edge;
  resizeStartX.value = event.clientX;

  // Set initial tooltip position
  resizeTooltipX.value = event.clientX;
  resizeTooltipY.value = event.clientY - 30; // Position tooltip above the cursor

  // Save original date based on which edge is being resized
  if (edge === 'start') {
    originalResizeDate.value = new Date(task.start);
  } else {
    originalResizeDate.value = new Date(task.finish);
  }

  selectedTaskId.value = task.id;

  // Add global event listeners
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', onResizeEnd);

  emit('task-selected', task);
};

const onResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !resizeTask.value || !originalResizeDate.value || !resizeEdge.value) return;

  const deltaX = event.clientX - resizeStartX.value;
  const daysDelta = Math.round(deltaX / pixelsPerDay.value);

  if (daysDelta === 0) return;

  const newDate = new Date(originalResizeDate.value);
  newDate.setDate(newDate.getDate() + daysDelta);

  // Update tooltip position
  resizeTooltipX.value = event.clientX;
  resizeTooltipY.value = event.clientY - 30;

  // Apply change based on which edge is being resized
  if (resizeEdge.value === 'start') {
    // Check that new start date doesn't exceed finish date
    if (newDate < resizeTask.value.finish) {
      resizeTask.value.start = newDate;
    }
  } else {
    // Check that new finish date doesn't precede start date
    if (newDate > resizeTask.value.start) {
      resizeTask.value.finish = newDate;
    }
  }

  // Send event to indicate the task is being resized (temporary update)
  const resizeEvent: TaskResizeEvent = {
    task: resizeTask.value,
    edge: resizeEdge.value,
    originalDate: originalResizeDate.value,
    newDate: resizeEdge.value === 'start' ? resizeTask.value.start : resizeTask.value.finish,
    final: false
  };

  emit('task-resized', resizeEvent);
  emit('task-updated', {
    task: resizeTask.value,
    changes: resizeEdge.value === 'start'
        ? { start: resizeTask.value.start }
        : { finish: resizeTask.value.finish },
    final: false
  });
};

const onResizeEnd = () => {
  if (isResizing.value && resizeTask.value && originalResizeDate.value && resizeEdge.value) {
    // Send final event after task has been resized
    const resizeEvent: TaskResizeEvent = {
      task: resizeTask.value,
      edge: resizeEdge.value,
      originalDate: originalResizeDate.value,
      newDate: resizeEdge.value === 'start' ? resizeTask.value.start : resizeTask.value.finish,
      final: true
    };

    emit('task-resized', resizeEvent);
    emit('task-updated', {
      task: resizeTask.value,
      changes: resizeEdge.value === 'start'
          ? { start: resizeTask.value.start }
          : { finish: resizeTask.value.finish },
      final: true
    });
  }

  // Reset resizing states
  isResizing.value = false;
  resizeTask.value = null;
  resizeEdge.value = null;
  originalResizeDate.value = null;

  // Remove global event listeners
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', onResizeEnd);
};

// Synchronize current view
watch(currentViewMode, (newMode) => {
  currentView.value = newMode;
});

// Cleanup event listeners
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', onResizeEnd);
});

onMounted(() => {
  console.log('Gantt chart initialized!');
});
</script>

<style scoped>
.resize-tooltip {
  position: absolute;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}
</style>
