<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Vue Gantt Chart Library</h1>
    <div class="h-[600px]">
      <GanttChart :tasks="tasks" :resources="resources" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import GanttChart from './components/gantt/GanttChart.vue';
import type { GanttTask, GanttResource } from './types/gantt';

// Sample data
const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const tasks = ref<GanttTask[]>([
  {
    id: '1',
    content: 'Project Planning',
    start: today,
    finish: nextWeek,
    progress: 20,
    isGroup: true,
    expanded: true
  },
  {
    id: '1.1',
    content: 'Requirements Analysis',
    start: today,
    finish: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
    progress: 40,
    parentId: '1',
    assignees: ['1']
  },
  {
    id: '1.2',
    content: 'Project Kickoff',
    start: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
    finish: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
    progress: 0,
    parentId: '1',
    isMilestone: true
  }
]);

const resources = ref<GanttResource[]>([
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=2'
  }
]);
</script>
