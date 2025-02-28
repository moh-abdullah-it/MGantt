export interface GanttTask {
    id: string;
    content: string;
    start: Date;
    finish: Date;
    progress: number;
    assignees?: string[];
    color?: string;
    isMilestone?: boolean;
    isGroup?: boolean;
    parentId?: string;
    predecessors?: GanttDependency[];
    indentation?: number;
    expanded?: boolean;
}

export interface GanttDependency {
    id: string;
    fromTaskId: string;
    toTaskId: string;
    type: 'FS' | 'FF' | 'SS' | 'SF'; // Finish-to-Start, Finish-to-Finish, etc.
}

export interface GanttResource {
    id: string;
    name: string;
    avatar?: string;
    calendar?: GanttCalendar;
}

export interface GanttCalendar {
    workingDays: number[]; // 0 = Sunday, 1 = Monday, ...
    exceptions: GanttCalendarException[];
}

export interface GanttCalendarException {
    date: Date;
    isWorking: boolean;
    workingHours?: { from: string; to: string }[];
}
