export function loadTaskStore(settings) {
    try {
        const raw = settings.get_string('tasks-json');
        if (!raw || raw.trim() === '') {
            return { tasks: [] };
        }

        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.tasks)) {
            return { tasks: [] };
        }

        return parsed;
    } catch (error) {
        return { tasks: [] };
    }
}

export function saveTaskStore(settings, tasks) {
    settings.set_string('tasks-json', JSON.stringify({ tasks }));
}

export function widgetPositionKey(taskId) {
    return `widget-position-${taskId}`;
}