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
              <!-- Normal Task -->
              <div
                  v-if="!task.isMilestone"
                  class="absolute h-5 rounded bg-blue-500 hover:opacity-80 dark:bg-blue-400 dark:hover:opacity-90 cursor-move flex items-center px-1 text-white text-xs"
                  :style="getTaskBarStyle(task)"
                  @mousedown="onTaskBarMouseDown(task, $event)"
              >
                {{ task.content }}
              </div>

              <!-- Milestone -->
              <div
                  v-else
                  class="absolute h-5 w-5 transform rotate-45 bg-amber-500 hover:opacity-80 cursor-pointer"
                  :style="{ left: `${getTaskPosition(task)}px`, top: '8px' }"
                  @mousedown="onTaskBarMouseDown(task, $event)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import type { GanttTask, GanttResource } from '@/types/gantt';
import { useGanttTimeline } from '@/composables/useGanttTimeline';
import TimelineHeader from './TimelineHeader.vue';
import TimelineGrid from './TimelineGrid.vue';
import ThemeToggle from '../ThemeToggle.vue';

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
const emit = defineEmits(['task-updated', 'dependency-created', 'task-selected']);

// Reactive states
const ganttContent = ref<HTMLDivElement | null>(null);
const currentView = ref<'day' | 'week' | 'month' | 'year'>('week');
const selectedTaskId = ref<string | null>(null);
const isDragging = ref(false);
const dragTask = ref<GanttTask | null>(null);
const dragStartX = ref(0);
const originalTaskStart = ref<Date | null>(null);
const originalTaskFinish = ref<Date | null>(null);

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

// Get position for milestone tasks
const getTaskPosition = (task: GanttTask) => {
  const startDiff = Math.floor(
      (task.start.getTime() - props.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return startDiff * pixelsPerDay.value;
};

// Handle view mode changes
const onViewChange = () => {
  setViewMode(currentView.value);
};

// Task Bar Dragging
const onTaskBarMouseDown = (task: GanttTask, event: MouseEvent) => {
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

// Synchronize current view
watch(currentViewMode, (newMode) => {
  currentView.value = newMode;
});

onMounted(() => {
  console.log('Gantt chart initialized!');
});
</script>
