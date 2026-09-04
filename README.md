# Daymark

Daymark is a lightweight GNOME Shell extension that places draggable widgets on your desktop and tracks daily completion history for long-running goals.

## Project Structure

- `extension.js` — Desktop widget runtime
- `prefs.js` — Task management preferences UI
- `stylesheet.css` — Dark minimal styling
- `metadata.json` — GNOME extension manifest
- `schemas/org.gnome.shell.extensions.daymark.gschema.xml` — Persistent settings schema
- `src/` — Date and task management helpers
- `install.sh` — Installation helper script

## Installation

### Method 1: Using the Install Script (Recommended)

Run the installation script to automatically copy files to the GNOME extensions directory and compile schemas:

```bash
chmod +x install.sh
./install.sh
```

### Method 2: Manual Installation

1. Copy this folder to the GNOME extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/daymark@local
   cp -r . ~/.local/share/gnome-shell/extensions/daymark@local
   ```

2. Compile the GSettings schema:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/daymark@local/schemas
   ```

3. Restart GNOME Shell (log out and log back in, or press `Alt + F2`, type `r`, and hit `Enter` on X11).

4. Enable the extension via **GNOME Extensions** or **Extension Manager**:
   ```bash
   gnome-extensions enable daymark@local
   ```
