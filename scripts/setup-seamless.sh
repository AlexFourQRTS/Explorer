#!/usr/bin/env bash
# STREEM — install SeamlessStreaming backend (Meta official stack)
# Uses Miniforge/conda for libsndfile (no Homebrew required).
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REQ_FILE="$PROJECT_ROOT/config/seamless/requirements-streem.txt"
TORCH_VERSION="2.2.2"
CONDA_ENV_NAME="streem-seamless"
MINIFORGE_DIR="${MINIFORGE_DIR:-$HOME/miniforge3}"

install_miniforge() {
  if [[ -f "$MINIFORGE_DIR/bin/conda" ]]; then
    return
  fi
  local arch="arm64"
  if [[ "$(uname -m)" == "x86_64" ]]; then
    arch="x86_64"
  fi
  local installer="/tmp/Miniforge3-MacOSX-${arch}.sh"
  echo "Installing Miniforge to $MINIFORGE_DIR ..."
  curl -fsSL -o "$installer" \
    "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-MacOSX-${arch}.sh"
  bash "$installer" -b -p "$MINIFORGE_DIR"
  rm -f "$installer"
}

activate_conda() {
  if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    deactivate 2>/dev/null || true
    unset VIRTUAL_ENV
  fi
  if [[ -f "$MINIFORGE_DIR/etc/profile.d/conda.sh" ]]; then
    # shellcheck disable=SC1091
    source "$MINIFORGE_DIR/etc/profile.d/conda.sh"
    conda activate "$CONDA_ENV_NAME"
    return
  fi
  echo "ERROR: Miniforge not found at $MINIFORGE_DIR"
  exit 1
}

conda_pip() {
  "$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python" -m pip "$@"
}

if [[ "$(uname)" == "Darwin" ]]; then
  if [[ ! -f "$MINIFORGE_DIR/bin/conda" ]]; then
    install_miniforge
  fi
fi

# shellcheck disable=SC1091
source "$MINIFORGE_DIR/etc/profile.d/conda.sh"

if ! conda env list | awk '{print $1}' | grep -qx "$CONDA_ENV_NAME"; then
  echo "Creating conda env: $CONDA_ENV_NAME"
  conda create -y -n "$CONDA_ENV_NAME" python=3.10 -c conda-forge
fi

activate_conda

# libsndfile (fairseq2n), sox (torchaudio effects), ffmpeg (pydub)
conda install -y libsndfile sox ffmpeg -c conda-forge

conda_pip install --upgrade pip setuptools wheel
conda_pip install "torch==${TORCH_VERSION}" "torchaudio==${TORCH_VERSION}"
conda_pip install fairseq2
conda_pip install -r "$REQ_FILE"

"$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python" -c \
  "import nltk; nltk.download('averaged_perceptron_tagger_eng'); nltk.download('cmudict'); nltk.download('punkt')"

bash "$PROJECT_ROOT/scripts/patch-fairseq2n-macos.sh"

bash "$PROJECT_ROOT/scripts/prepare-assets.sh"

APP_DIR="$PROJECT_ROOT/seamless-streaming/streaming-react-app"
if [[ -d "$APP_DIR/dist" ]]; then
  echo "Frontend dist/ already built."
elif command -v npm >/dev/null 2>&1; then
  cd "$APP_DIR"
  npm install
  npm run build
else
  echo "Install Node.js, then: cd seamless-streaming/streaming-react-app && npm run build"
fi

echo ""
echo "Setup complete (conda env: $CONDA_ENV_NAME)."
echo "  npm run start"
