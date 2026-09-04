const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateString(value) {
    if (!value || !/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        return null;
    }

    const [day, month, year] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

export function formatDate(date) {
    const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const year = utcDate.getUTCFullYear();
    return `${day}-${month}-${year}`;
}

export function dateFromToday() {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

export function dayCountBetween(startDate, endDate) {
    const start = parseDateString(startDate);
    const end = parseDateString(endDate);

    if (!start || !end) {
        return 0;
    }

    const diff = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    return diff + 1;
}

export function getCurrentDayNumber(task) {
    const start = parseDateString(task.startDate);
    if (!start) {
        return 0;
    }

    const today = dateFromToday();
    const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const diffDays = Math.floor((todayUtc - startUtc) / DAY_MS);

    if (diffDays < 0) {
        return 0;
    }

    return diffDays + 1;
}

export function getVisibleDayLimit(task) {
    if (task.endDate) {
        return dayCountBetween(task.startDate, task.endDate);
    }

    const currentDay = getCurrentDayNumber(task);
    const minimum = 7;
    const defaultFutureWindow = 14;
    return Math.max(minimum, currentDay + defaultFutureWindow);
}

export function isFutureDay(task, dayNumber) {
    const currentDay = getCurrentDayNumber(task);
    return currentDay > 0 && dayNumber > currentDay;
}

export function getTaskDayNumbers(task) {
    const totalDays = getVisibleDayLimit(task);
    return Array.from({ length: totalDays }, (_, index) => index + 1);
}

export function buildColumnsForDays(dayNumbers) {
    const columns = [];
    const columnSize = 7;

    for (let i = 0; i < dayNumbers.length; i += columnSize) {
        columns.push(dayNumbers.slice(i, i + columnSize));
    }

    return columns;
}

export function getMonthDays(monthDate) {
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth();
    const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Array.from({length: total}, (_value, index) => new Date(Date.UTC(year, month, index + 1)));
}

export function getTaskDayNumberForDate(task, date) {
    const start = parseDateString(task.startDate);
    if (!start) {
        return 0;
    }
    return Math.floor((date.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function isFutureDate(date) {
    return date.getTime() > dateFromToday().getTime();
}

export function formatMonthName(date) {
    return date.toLocaleDateString(undefined, {month: 'long', year: 'numeric', timeZone: 'UTC'});
}

export function getCompletedCount(task) {
    const completed = task.completed || {};
    const total = getTaskDayNumbers(task);
    return total.filter((day) => completed[day] === true).length;
}

export function getStreak(task) {
    const completed = task.completed || {};
    const endDay = Math.min(getCurrentDayNumber(task), getVisibleDayLimit(task));
    let streakCounter = 0;

    for (let day = endDay; day >= 1; day--) {
        if (completed[day] === true) {
            streakCounter += 1;
        } else {
            break;
        }
    }

    return streakCounter;
}

export function validateTaskInput(task) {
    const name = String(task.name || '').trim();
    if (!name) {
        throw new Error('Task name is required.');
    }

    let startDate = task.startDate || formatDate(dateFromToday());
    if (!parseDateString(startDate)) {
        throw new Error(`Invalid start date: ${startDate}. Use DD-MM-YYYY.`);
    }

    if (task.endDate && task.endDate.trim()) {
        if (!parseDateString(task.endDate)) {
            throw new Error(`Invalid end date: ${task.endDate}. Use DD-MM-YYYY.`);
        }

        const start = parseDateString(startDate);
        const end = parseDateString(task.endDate);
        if (end.getTime() < start.getTime()) {
            throw new Error('End date cannot be earlier than the start date.');
        }
    }

    return {
        id: task.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        startDate,
        endDate: task.endDate && task.endDate.trim() ? task.endDate.trim() : null,
        completed: task.completed || {},
        position: {
            x: Number(task.position && task.position.x) || 40,
            y: Number(task.position && task.position.y) || 40,
        },
        hidden: Boolean(task.hidden),
    };
}

export function normaliseCompletedMap(value) {
    const source = value || {};
    const output = {};

    Object.keys(source).forEach((key) => {
        output[key] = Boolean(source[key]);
    });

    return output;
}

export function getDayLabel(task, dayNumber) {
    if (task.endDate && dayNumber > getVisibleDayLimit(task)) {
        return null;
    }

    return dayNumber;
}
