import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk?version=4.0';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {dateFromToday, formatDate, validateTaskInput} from './src/dateUtils.js';
import {TaskManager} from './src/taskManager.js';

const SCHEMA_ID = 'org.gnome.shell.extensions.daymark';

export default class DaymarkPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const manager = new TaskManager(this.getSettings(SCHEMA_ID));
        const page = new Adw.PreferencesPage();
        const editor = new Adw.PreferencesGroup({title: _('Tasks')});
        const taskList = new Adw.PreferencesGroup({title: _('Your tasks')});
        const futureDays = new Gtk.Switch({active: manager.settings.get_boolean('allow-future-days')});
        const name = new Gtk.Entry({hexpand: true});
        const start = new Gtk.Entry({placeholder_text: 'DD-MM-YYYY'});
        const end = new Gtk.Entry({placeholder_text: 'DD-MM-YYYY'});
        let taskRows = [];
        let editingId = null;

        const addEntry = (title, entry) => {
            const row = new Adw.ActionRow({title: _(title)});
            row.add_suffix(entry);
            editor.add(row);
        };
        addEntry('Task name', name);
        addEntry('Start date', start);
        addEntry('End date', end);

        const futureRow = new Adw.ActionRow({title: _('Enable future-day completion')});
        futureRow.add_suffix(futureDays);
        futureRow.activatable_widget = futureDays;
        editor.add(futureRow);

        const save = new Gtk.Button({label: _('Add Task'), valign: Gtk.Align.CENTER});
        const saveRow = new Adw.ActionRow();
        saveRow.add_suffix(save);
        editor.add(saveRow);

        const resetForm = () => {
            editingId = null;
            name.text = '';
            start.text = formatDate(dateFromToday());
            end.text = '';
            save.label = _('Add Task');
        };
        const refresh = () => {
            for (const row of taskRows)
                taskList.remove(row);
            taskRows = [];
            for (const task of manager.getTasks()) {
                const row = new Adw.ActionRow({title: task.name,
                    subtitle: `${task.startDate} → ${task.endDate || _('No end date')}`});
                const edit = new Gtk.Button({label: _('Edit'), valign: Gtk.Align.CENTER});
                edit.connect('clicked', () => {
                    editingId = task.id;
                    name.text = task.name;
                    start.text = task.startDate;
                    end.text = task.endDate || '';
                    save.label = _('Save changes');
                    name.grab_focus();
                });
                const visibility = new Gtk.Button({label: task.hidden ? _('Show') : _('Hide'), valign: Gtk.Align.CENTER});
                visibility.connect('clicked', () => {
                    manager.setHidden(task.id, !task.hidden);
                    refresh();
                });
                const remove = new Gtk.Button({label: _('Delete'), valign: Gtk.Align.CENTER});
                remove.connect('clicked', () => {
                    manager.deleteTask(task.id);
                    refresh();
                });
                row.add_suffix(edit);
                row.add_suffix(visibility);
                row.add_suffix(remove);
                taskList.add(row);
                taskRows.push(row);
            }
        };

        save.connect('clicked', () => {
            try {
                const values = validateTaskInput({id: editingId || undefined, name: name.text,
                    startDate: start.text.trim() || formatDate(dateFromToday()), endDate: end.text.trim() || null});
                if (editingId)
                    manager.updateTask(editingId, {name: values.name, startDate: values.startDate, endDate: values.endDate});
                else
                    manager.addTask(values);
                resetForm();
                refresh();
            } catch (error) {
                const dialog = new Adw.MessageDialog({transient_for: window, heading: _('Invalid task data'), body: error.message});
                dialog.add_response('close', _('Close'));
                dialog.present();
            }
        });
        futureDays.connect('notify::active', button =>
            manager.settings.set_boolean('allow-future-days', button.active));

        page.add(editor);
        page.add(taskList);
        window.add(page);
        resetForm();
        refresh();
    }
}
