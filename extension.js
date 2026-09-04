import Clutter from 'gi://Clutter';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {
    buildColumnsForDays,
    dateFromToday,
    formatMonthName,
    getMonthDays,
    getTaskDayNumberForDate,
    getVisibleDayLimit,
    isFutureDate,
} from './src/dateUtils.js';
import {TaskManager} from './src/taskManager.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.daymark';

class TaskWidget {
    constructor(task, taskManager, callbacks) {
        this.task = task;
        this.taskManager = taskManager;
        this.callbacks = callbacks;
        const today = dateFromToday();
        this.month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
        const position = task.position || {x: 40, y: 40};
        this.actor = new St.Widget({
            reactive: true,
            x: position.x,
            y: position.y,
            style_class: 'task-widget',
            visible: !task.hidden,
        });
        this.actor.connect('button-press-event', (_actor, event) => this._onButtonPress(event));
        this.actor.connect('button-release-event', () => this._onButtonRelease());
        this.actor.connect('motion-event', (_actor, event) => this._onMotion(event));
        this._build();
        this._refresh();
        global.window_group.add_child(this.actor);
    }

    _build() {
        const container = new St.BoxLayout({vertical: true, style_class: 'task-widget-inner'});
        this.actor.add_child(container);
        const header = new St.BoxLayout({style_class: 'task-header'});
        this.title = new St.Label({style_class: 'task-title'});
        this.title.x_expand = true;
        this.title.x_align = Clutter.ActorAlign.CENTER;
        header.add_child(this.title);
        container.add_child(header);
        const monthBar = new St.BoxLayout({style_class: 'task-month-bar'});
        const previous = new St.Button({label: '‹', style_class: 'task-month-button'});
        previous.connect('clicked', () => this._changeMonth(-1));
        this.monthLabel = new St.Label({style_class: 'task-month-label', x_expand: true,
            x_align: Clutter.ActorAlign.CENTER});
        const next = new St.Button({label: '›', style_class: 'task-month-button'});
        next.connect('clicked', () => this._changeMonth(1));
        monthBar.add_child(previous);
        monthBar.add_child(this.monthLabel);
        monthBar.add_child(next);
        container.add_child(monthBar);
        this.daysBox = new St.BoxLayout({style_class: 'task-columns'});
        container.add_child(this.daysBox);
    }

    _refresh() {
        this.title.text = this.task.name.toUpperCase();
        this.monthLabel.text = formatMonthName(this.month);
        this._renderDays();
    }

    _changeMonth(offset) {
        this.month = new Date(Date.UTC(this.month.getUTCFullYear(), this.month.getUTCMonth() + offset, 1));
        this._refresh();
    }

    _renderDays() {
        this.daysBox.destroy_all_children();
        for (const days of buildColumnsForDays(getMonthDays(this.month))) {
            const column = new St.BoxLayout({vertical: true, style_class: 'task-column'});
            for (const date of days)
                column.add_child(this._createDayRow(date));
            this.daysBox.add_child(column);
        }
    }

    _createDayRow(date) {
        const taskDayNumber = getTaskDayNumberForDate(this.task, date);
        const inTaskRange = taskDayNumber >= 1 &&
            (!this.task.endDate || taskDayNumber <= getVisibleDayLimit(this.task));
        const row = new St.BoxLayout({style_class: 'task-day-row'});
        if (date.getTime() === dateFromToday().getTime())
            row.add_style_class_name('task-day-today');
        row.add_child(new St.Label({text: String(date.getUTCDate()), style_class: 'task-day-index'}));
        const enabled = inTaskRange && (!isFutureDate(date) ||
            this.taskManager.settings.get_boolean('allow-future-days'));
        const button = new St.Button({
            label: inTaskRange && this.task.completed?.[taskDayNumber] ? '✓' : '○',
            reactive: enabled,
            can_focus: enabled,
            style_class: 'task-day-toggle',
        });
        button.connect('clicked', () => this.taskManager.toggleDay(this.task.id, taskDayNumber));
        row.add_child(button);
        return row;
    }

    _onButtonPress(event) {
        if (event.get_button() === 3) {
            this._showMenu();
            return Clutter.EVENT_STOP;
        }
        if (event.get_button() !== 1 || event.get_source() instanceof St.Button)
            return Clutter.EVENT_PROPAGATE;
        const [x, y] = event.get_coords();
        this._dragStart = {x, y, widgetX: this.actor.x, widgetY: this.actor.y};
        return Clutter.EVENT_STOP;
    }

    _onMotion(event) {
        if (!this._dragStart)
            return Clutter.EVENT_PROPAGATE;
        const [x, y] = event.get_coords();
        this.actor.set_position(this._dragStart.widgetX + x - this._dragStart.x,
            this._dragStart.widgetY + y - this._dragStart.y);
        return Clutter.EVENT_STOP;
    }

    _onButtonRelease() {
        if (!this._dragStart)
            return Clutter.EVENT_PROPAGATE;
        this._dragStart = null;
        this.taskManager.setPosition(this.task.id, this.actor.x, this.actor.y);
        return Clutter.EVENT_STOP;
    }

    _showMenu() {
        this._menu?.destroy();
        this._menu = new PopupMenu.PopupMenu(this.actor, 0, St.Side.TOP);
        this._menu.actor.add_style_class_name('task-context-menu');
        Main.uiGroup.add_child(this._menu.actor);
        this._menu.actor.hide();
        this._menu.addAction('Edit Task', () => this.callbacks.edit());
        this._menu.addAction(this.task.hidden ? 'Show Task' : 'Hide Task',
            () => this.callbacks.hide(this.task.id));
        this._menu.addAction('Reset Position', () => this.callbacks.reset(this.task.id));
        this._menu.addAction('Delete Task', () => this.callbacks.delete(this.task.id));
        this._menu.open(false);
    }

    destroy() {
        this._menu?.destroy();
        this.actor?.destroy();
        this.actor = null;
    }
}

export default class DaymarkExtension extends Extension {
    enable() {
        this.settings = this.getSettings(SCHEMA_ID);
        this._settingsSignals = [
            this.settings.connect('changed::tasks-json', () => this._reloadTasks()),
            this.settings.connect('changed::allow-future-days', () => this._reloadTasks()),
        ];
        this._reloadTasks();
    }

    disable() {
        for (const signal of this._settingsSignals || [])
            this.settings.disconnect(signal);
        this._settingsSignals = [];
        this._clearWidgets();
        this.taskManager = null;
        this.settings = null;
    }

    _reloadTasks() {
        this._clearWidgets();
        this.taskManager = new TaskManager(this.settings);
        this.widgets = this.taskManager.getTasks().map(task => new TaskWidget(task, this.taskManager, {
            delete: taskId => this.taskManager.deleteTask(taskId),
            edit: () => this.openPreferences(),
            hide: taskId => this.taskManager.setHidden(taskId, !this.taskManager.getTaskById(taskId).hidden),
            reset: taskId => this.taskManager.resetPosition(taskId),
        }));
    }

    _clearWidgets() {
        for (const widget of this.widgets || [])
            widget.destroy();
        this.widgets = [];
    }
}
