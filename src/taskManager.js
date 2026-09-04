import {
    getCompletedCount,
    getCurrentDayNumber,
    getStreak,
    getTaskDayNumbers,
    getVisibleDayLimit,
    normaliseCompletedMap,
    validateTaskInput,
} from './dateUtils.js';
import {loadTaskStore, saveTaskStore} from './storage.js';

export class TaskManager {
    constructor(settings) {
        this.settings = settings;
        this.tasks = this._loadTasks();
    }

    _loadTasks() {
        const taskStore = loadTaskStore(this.settings);
        const rawTasks = Array.isArray(taskStore.tasks) ? taskStore.tasks : [];
        return rawTasks
            .map((task) => {
                try {
                    const normalised = validateTaskInput(task);
                    normalised.completed = normaliseCompletedMap(task.completed);
                    return normalised;
                } catch (error) {
                    return null;
                }
            })
            .filter(Boolean);
    }

    _saveTasks() {
        saveTaskStore(this.settings, this.tasks);
    }

    getTasks() {
        return this.tasks.slice();
    }

    getTaskById(taskId) {
        return this.tasks.find((task) => task.id === taskId) || null;
    }

    addTask(inputTask) {
        const task = validateTaskInput({
            ...inputTask,
            completed: inputTask.completed || {},
            position: inputTask.position || { x: 40, y: 40 },
        });
        task.completed = normaliseCompletedMap(task.completed);
        this.tasks.push(task);
        this._saveTasks();
        return task;
    }

    updateTask(taskId, inputTask) {
        const index = this.tasks.findIndex((task) => task.id === taskId);
        if (index === -1) {
            return null;
        }

        const existing = this.tasks[index];
        const merged = {
            ...existing,
            ...inputTask,
            completed: { ...(existing.completed || {}), ...(inputTask.completed || {}) },
            position: { ...(existing.position || {}), ...(inputTask.position || {}) },
        };

        const updated = validateTaskInput(merged);
        updated.completed = normaliseCompletedMap(updated.completed);
        this.tasks[index] = updated;
        this._saveTasks();
        return updated;
    }

    deleteTask(taskId) {
        const before = this.tasks.length;
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        if (this.tasks.length !== before) {
            this._saveTasks();
            return true;
        }
        return false;
    }

    toggleDay(taskId, dayNumber) {
        const task = this.getTaskById(taskId);
        if (!task) {
            return null;
        }

        const currentDay = getCurrentDayNumber(task);
        const allowFuture = this.settings.get_boolean('allow-future-days');
        if (dayNumber > currentDay && !allowFuture) {
            return null;
        }

        const completed = task.completed || {};
        const toggleValue = !Boolean(completed[dayNumber]);
        completed[dayNumber] = toggleValue;
        task.completed = completed;
        this._saveTasks();
        return task;
    }

    setHidden(taskId, hidden) {
        const task = this.getTaskById(taskId);
        if (!task) {
            return null;
        }

        task.hidden = Boolean(hidden);
        this._saveTasks();
        return task;
    }

    resetPosition(taskId) {
        const task = this.getTaskById(taskId);
        if (!task) {
            return null;
        }

        task.position = { x: 40, y: 40 };
        this._saveTasks();
        return task;
    }

    setPosition(taskId, x, y) {
        const task = this.getTaskById(taskId);
        if (!task) {
            return null;
        }

        task.position = {x: Math.round(x), y: Math.round(y)};
        this._saveTasks();
        return task;
    }

    getTaskStats(task) {
        const total = getVisibleDayLimit(task);
        const completed = getCompletedCount(task);
        const streak = getStreak(task);
        return {
            total,
            completed,
            streak,
            currentDay: getCurrentDayNumber(task),
            visibleDays: getTaskDayNumbers(task),
        };
    }
}
