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
    resizable?: boolean;
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

export interface TaskResizeEvent {
    task: GanttTask;
    edge: 'start' | 'end'; // الحافة التي يتم سحبها (البداية أو النهاية)
    originalDate: Date; // التاريخ الأصلي قبل التغيير
    newDate: Date; // التاريخ الجديد بعد التغيير
    final: boolean; // ما إذا كان هذا هو التغيير النهائي (عند الإفلات) أم تحديث مؤقت أثناء السحب
}