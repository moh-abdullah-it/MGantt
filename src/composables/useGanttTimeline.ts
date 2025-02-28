import { ref, computed } from 'vue';

export interface TimelineHeaderItem {
    key: string;
    left: number;
    width: number;
    label: string;
}

export function useGanttTimeline(startDate: Date, endDate: Date) {
    const pixelsPerDay = ref(20); // Default scale
    const currentViewMode = ref<'day' | 'week' | 'month' | 'year'>('week');

    // Calculate total duration in days
    const timelineDuration = computed(() => {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    // Calculate total timeline width in pixels
    const timelineWidth = computed(() => {
        return timelineDuration.value * pixelsPerDay.value;
    });

    // Get position and size for task bars
    const getTaskBarStyle = (task: { start: Date; finish: Date }) => {
        const start = task.start;
        const finish = task.finish;

        const startDiff = Math.floor((start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return {
            left: `${startDiff * pixelsPerDay.value}px`,
            width: `${duration * pixelsPerDay.value}px`,
        };
    };

    // Generate header cells based on current view mode
    const headerItems = computed((): { primary: TimelineHeaderItem[], secondary: TimelineHeaderItem[] } => {
        const primaryHeaders: TimelineHeaderItem[] = [];
        const secondaryHeaders: TimelineHeaderItem[] = [];

        switch (currentViewMode.value) {
            case 'day':
                // Primary: Weeks, Secondary: Days
                generateDayHeaders(primaryHeaders, secondaryHeaders);
                break;

            case 'week':
                // Primary: Months, Secondary: Weeks
                generateWeekHeaders(primaryHeaders, secondaryHeaders);
                break;

            case 'month':
                // Primary: Years, Secondary: Months
                generateMonthHeaders(primaryHeaders, secondaryHeaders);
                break;

            case 'year':
                // Primary: Years, Secondary: Quarters
                generateYearHeaders(primaryHeaders, secondaryHeaders);
                break;
        }

        return { primary: primaryHeaders, secondary: secondaryHeaders };
    });

    // Generate vertical grid lines
    const gridLines = computed(() => {
        const lines = [];
        const secondaryHeaders = headerItems.value.secondary;

        for (const header of secondaryHeaders) {
            lines.push({
                key: header.key,
                left: header.left
            });
        }

        return lines;
    });

    // Helpers for generating headers
    function generateDayHeaders(
        primaryHeaders: TimelineHeaderItem[],
        secondaryHeaders: TimelineHeaderItem[]
    ) {
        let currentDate = new Date(startDate);
        let currentWeekStart = getWeekStart(currentDate);
        let weekIndex = 0;

        for (let day = 0; day < timelineDuration.value; day++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + day);

            // If we're at a new week, create a primary header
            if (dayDate.getTime() >= currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 || day === 0) {
                currentWeekStart = getWeekStart(dayDate);
                const daysInThisWeek = Math.min(7, timelineDuration.value - day);

                primaryHeaders.push({
                    key: `week-${weekIndex}`,
                    left: day * pixelsPerDay.value,
                    width: daysInThisWeek * pixelsPerDay.value,
                    label: `Week ${dayDate.getDate()} - ${new Date(dayDate.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`
                });

                weekIndex++;
            }

            // Add daily secondary header
            secondaryHeaders.push({
                key: `day-${day}`,
                left: day * pixelsPerDay.value,
                width: pixelsPerDay.value,
                label: formatDate(dayDate, 'day')
            });
        }
    }

    function generateWeekHeaders(
        primaryHeaders: TimelineHeaderItem[],
        secondaryHeaders: TimelineHeaderItem[]
    ) {
        let currentDate = new Date(startDate);
        let currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let monthIndex = 0;
        let weekIndex = 0;

        for (let day = 0; day < timelineDuration.value; day += 7) {
            const weekDate = new Date(startDate);
            weekDate.setDate(weekDate.getDate() + day);

            // If we're at a new month, create a primary header
            if (weekDate.getMonth() !== currentMonthStart.getMonth() || day === 0) {
                currentMonthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);

                // Calculate days in this month in our timeline
                let daysInThisMonth = 0;
                let tempDate = new Date(currentMonthStart);
                while (tempDate.getMonth() === currentMonthStart.getMonth() &&
                tempDate.getTime() <= endDate.getTime()) {
                    daysInThisMonth++;
                    tempDate.setDate(tempDate.getDate() + 1);
                }

                primaryHeaders.push({
                    key: `month-${monthIndex}`,
                    left: day * pixelsPerDay.value,
                    width: daysInThisMonth * pixelsPerDay.value,
                    label: formatDate(weekDate, 'month')
                });

                monthIndex++;
            }

            // Add weekly secondary header
            const weekLabel = `W${getWeekNumber(weekDate)}`;
            const daysInThisWeek = Math.min(7, timelineDuration.value - day);

            secondaryHeaders.push({
                key: `week-${weekIndex}`,
                left: day * pixelsPerDay.value,
                width: daysInThisWeek * pixelsPerDay.value,
                label: weekLabel
            });

            weekIndex++;
        }
    }

    function generateMonthHeaders(
        primaryHeaders: TimelineHeaderItem[],
        secondaryHeaders: TimelineHeaderItem[]
    ) {
        let currentDate = new Date(startDate);
        let currentYear = currentDate.getFullYear();
        let monthIndex = 0;

        while (currentDate.getTime() <= endDate.getTime()) {
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const daysInMonth = nextMonth.getDate();

            // If we're at a new year, create a primary header
            if (currentDate.getFullYear() !== currentYear || monthIndex === 0) {
                currentYear = currentDate.getFullYear();

                // Calculate days in this year in our timeline
                let daysInThisYear = 0;
                for (let month = currentDate.getMonth(); month < 12; month++) {
                    const lastDayOfMonth = new Date(currentYear, month + 1, 0).getDate();
                    daysInThisYear += lastDayOfMonth;
                }

                const yearStart = new Date(currentYear, 0, 1);
                const dayOffset = Math.floor((yearStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

                primaryHeaders.push({
                    key: `year-${currentYear}`,
                    left: Math.max(0, dayOffset) * pixelsPerDay.value,
                    width: daysInThisYear * pixelsPerDay.value,
                    label: currentYear.toString()
                });
            }

            // Calculate position for month
            const dayOffset = Math.floor((monthStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

            // Add monthly secondary header
            secondaryHeaders.push({
                key: `month-${monthIndex}`,
                left: Math.max(0, dayOffset) * pixelsPerDay.value,
                width: daysInMonth * pixelsPerDay.value,
                label: formatDate(currentDate, 'month')
            });

            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
            monthIndex++;
        }
    }

    function generateYearHeaders(
        primaryHeaders: TimelineHeaderItem[],
        secondaryHeaders: TimelineHeaderItem[]
    ) {
        let currentDate = new Date(startDate);
        let yearIndex = 0;

        while (currentDate.getTime() <= endDate.getTime()) {
            const yearStart = new Date(currentDate.getFullYear(), 0, 1);
            const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
            const daysInYear = (yearEnd.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000) + 1;

            // Calculate position for year
            const dayOffset = Math.floor((yearStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

            // Add year primary header
            primaryHeaders.push({
                key: `year-${currentDate.getFullYear()}`,
                left: Math.max(0, dayOffset) * pixelsPerDay.value,
                width: daysInYear * pixelsPerDay.value,
                label: currentDate.getFullYear().toString()
            });

            // Add quarterly secondary headers
            for (let quarter = 0; quarter < 4; quarter++) {
                const quarterStart = new Date(currentDate.getFullYear(), quarter * 3, 1);
                const quarterEnd = new Date(currentDate.getFullYear(), quarter * 3 + 3, 0);
                const daysInQuarter = (quarterEnd.getTime() - quarterStart.getTime()) / (24 * 60 * 60 * 1000) + 1;

                const quarterDayOffset = Math.floor((quarterStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

                secondaryHeaders.push({
                    key: `quarter-${yearIndex}-${quarter}`,
                    left: Math.max(0, quarterDayOffset) * pixelsPerDay.value,
                    width: daysInQuarter * pixelsPerDay.value,
                    label: `Q${quarter + 1}`
                });
            }

            // Move to next year
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            yearIndex++;
        }
    }

    // Helper functions for date formatting and calculations
    function formatDate(date: Date, format: 'day' | 'week' | 'month' | 'year'): string {
        switch (format) {
            case 'day':
                return date.getDate().toString();
            case 'week':
                return `W${getWeekNumber(date)}`;
            case 'month':
                return date.toLocaleString('default', { month: 'short' });
            case 'year':
                return date.getFullYear().toString();
            default:
                return '';
        }
    }

    function getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return weekNumber;
    }

    function getWeekStart(date: Date): Date {
        const result = new Date(date);
        const day = result.getDay();
        const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        result.setDate(diff);
        return result;
    }

    // Zoom functionality
    const zoomIn = () => {
        if (pixelsPerDay.value < 100) {
            pixelsPerDay.value += 8;
        }
    };

    const zoomOut = () => {
        if (pixelsPerDay.value > 8) {
            pixelsPerDay.value -= 8;
        }
    };

    // Set view mode
    const setViewMode = (mode: 'day' | 'week' | 'month' | 'year') => {
        currentViewMode.value = mode;
    };

    return {
        pixelsPerDay,
        timelineDuration,
        timelineWidth,
        headerItems,
        gridLines,
        currentViewMode,
        getTaskBarStyle,
        zoomIn,
        zoomOut,
        setViewMode
    };
}
