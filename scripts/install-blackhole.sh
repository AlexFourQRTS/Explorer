#!/usr/bin/env bash
# Install BlackHole 2ch — virtual audio device for Zoom/Meet mic routing.
set -euo pipefail

BLACKHOLE_DRIVER="/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver"
PKG_VERSION="0.6.0"
PKG_URL="https://existential.audio/downloads/BlackHole2ch.v${PKG_VERSION}.pkg"
PKG_PATH="/tmp/BlackHole2ch.v${PKG_VERSION}.pkg"
FALLBACK_URL="https://existential.audio/blackhole"

if [[ -d "$BLACKHOLE_DRIVER" ]]; then
  echo "BlackHole 2ch already installed."
  exit 0
fi

echo "Downloading BlackHole 2ch v${PKG_VERSION}..."
if ! curl -fsSL -o "$PKG_PATH" "$PKG_URL"; then
  echo "Direct download failed. Opening official page: $FALLBACK_URL"
  open "$FALLBACK_URL"
  exit 1
fi

echo "Opening installer (enter Mac password when prompted)..."
open "$PKG_PATH"

echo ""
echo "After install: restart Mac if prompted, then restart STREEM."
echo "Virtual microphone → BlackHole 2ch. Zoom → Microphone → BlackHole 2ch."
