#!/usr/bin/env bash
set -eu

EXT_DIR="$HOME/.local/share/gnome-shell/extensions/daymark@local"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$EXT_DIR"
cp -R "$SRC_DIR"/. "$EXT_DIR"/

glib-compile-schemas "$EXT_DIR/schemas"

echo "Installed to $EXT_DIR"
echo "Restart GNOME Shell or log out and log back in, then enable Daymark in Extensions."
