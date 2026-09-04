# Daymark

Daymark is a lightweight GNOME Shell extension that places draggable task widgets on the desktop and tracks daily completion history for long-running goals.

## Layout

- `extension.js` — desktop widget runtime
- `prefs.js` — task management UI
- `stylesheet.css` — dark minimal styling
- `metadata.json` — GNOME extension manifest
- `schemas/org.gnome.shell.extensions.daymark.gschema.xml` — persistent settings schema
- `src/` — date and task management helpers

## Install on GNOME

* Install it from Extention Manager
-OR-

1. Copy this folder to:
   ~/.local/share/gnome-shell/extensions/daymark@local
2. Compile the schema:
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/daymark@local/schemas
3. Restart GNOME Shell or log out and back in.
4. Enable the extension from Extensions.



The helper copies the extension into the GNOME user extension directory and recompiles the schema.
