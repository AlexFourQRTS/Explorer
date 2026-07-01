#!/usr/bin/env bash
# Patch fairseq2n dylib: it was built expecting Homebrew libsndfile path.
set -euo pipefail

MINIFORGE_DIR="${MINIFORGE_DIR:-$HOME/miniforge3}"
CONDA_ENV_NAME="${CONDA_ENV_NAME:-streem-seamless}"
FAIRSEQ2N_LIB="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/lib/python3.10/site-packages/fairseq2n/lib/libfairseq2n.0.dylib"
CONDA_SNDFILE="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/lib/libsndfile.1.dylib"
BREW_SNDFILE="/opt/homebrew/opt/libsndfile/lib/libsndfile.1.dylib"

if [[ ! -f "$FAIRSEQ2N_LIB" ]]; then
  echo "fairseq2n not installed yet — skip patch"
  exit 0
fi

if [[ ! -f "$CONDA_SNDFILE" ]]; then
  echo "conda libsndfile missing"
  exit 1
fi

install_name_tool -change "$BREW_SNDFILE" "$CONDA_SNDFILE" "$FAIRSEQ2N_LIB" 2>/dev/null || true

if ! mkdir -p /opt/homebrew/opt/libsndfile/lib 2>/dev/null; then
  echo "Note: could not create /opt/homebrew symlink (optional fallback)"
else
  ln -sf "$CONDA_SNDFILE" "$BREW_SNDFILE" 2>/dev/null || true
fi

echo "Patched fairseq2n → conda libsndfile"
