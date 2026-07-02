#!/usr/bin/env bash
# STREEM - install SeamlessStreaming backend (Meta official stack)
# Uses Miniforge/conda for libsndfile (no Homebrew required).
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REQ_FILE="$PROJECT_ROOT/config/seamless/requirements-streem.txt"
CONSTRAINTS_FILE="$PROJECT_ROOT/config/seamless/constraints-streem.txt"
SEAMLESS_WHL="$PROJECT_ROOT/seamless-streaming/seamless_server/whl/seamless_communication-1.0.0-py3-none-any.whl"
TORCH_VERSION="2.2.2"
FAIRSEQ2_VERSION="0.2.1"
CONDA_ENV_NAME="streem-seamless"
MINIFORGE_DIR="${MINIFORGE_DIR:-$HOME/miniforge3}"
TORCH_CUDA_INDEX="https://download.pytorch.org/whl/cu118"
FAIRSEQ2_INDEX="https://fair.pkg.atmeta.com/fairseq2/whl/stable/pt2.2.2/cu118"
FAIRSEQ2_PIP_OPTS=(--extra-index-url "$FAIRSEQ2_INDEX" --trusted-host fair.pkg.atmeta.com)

install_miniforge() {
  if [[ -f "$MINIFORGE_DIR/bin/conda" ]]; then
    return
  fi

  local os="Linux"
  local arch="x86_64"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    os="MacOSX"
    if [[ "$(uname -m)" == "arm64" ]]; then
      arch="arm64"
    fi
  elif [[ "$(uname -m)" == "aarch64" ]]; then
    arch="aarch64"
  fi

  local installer="/tmp/Miniforge3-${os}-${arch}.sh"
  echo "Installing Miniforge to $MINIFORGE_DIR ..."
  curl -fsSL -o "$installer" "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-${os}-${arch}.sh"
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

install_pytorch_stack() {
  if [[ "$(uname -s)" == "Darwin" ]]; then
    echo "Installing PyTorch ${TORCH_VERSION}..."
    conda_pip install "torch==${TORCH_VERSION}" "torchaudio==${TORCH_VERSION}"
    return
  fi

  if command -v nvidia-smi >/dev/null 2>&1; then
    echo "Installing PyTorch ${TORCH_VERSION} with CUDA 11.8..."
    conda_pip install --force-reinstall \
      "torch==${TORCH_VERSION}" "torchaudio==${TORCH_VERSION}" \
      --index-url "$TORCH_CUDA_INDEX"
    return
  fi

  echo "Installing PyTorch ${TORCH_VERSION} (CPU)..."
  conda_pip install "torch==${TORCH_VERSION}" "torchaudio==${TORCH_VERSION}"
}

install_fairseq2_stack() {
  echo "Installing fairseq2 ${FAIRSEQ2_VERSION}..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    conda_pip install --force-reinstall "fairseq2==${FAIRSEQ2_VERSION}"
    return
  fi
  if command -v nvidia-smi >/dev/null 2>&1; then
    conda_pip install --force-reinstall --no-deps \
      "fairseq2==${FAIRSEQ2_VERSION}" "fairseq2n==${FAIRSEQ2_VERSION}" \
      "${FAIRSEQ2_PIP_OPTS[@]}"
    return
  fi
  conda_pip install --force-reinstall "fairseq2==${FAIRSEQ2_VERSION}"
}

repair_fairseq2_stack() {
  local py="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python"
  if "$py" - <<'PY' >/dev/null 2>&1
import fairseq2
from fairseq2n.bindings.data.string import CString
raise SystemExit(0 if fairseq2.__version__.startswith("0.2.") else 1)
PY
  then
    return
  fi

  echo "Repairing fairseq2 / fairseq2n (wrong CUDA wheel — likely upgraded by sonar-space)..."
  install_fairseq2_stack

  if ! "$py" - <<'PY' >/dev/null 2>&1
import fairseq2
from fairseq2n.bindings.data.string import CString
raise SystemExit(0 if fairseq2.__version__.startswith("0.2.") else 1)
PY
  then
    echo "ERROR: fairseq2n still fails to load (libcudart mismatch)."
    echo "  Run in WSL: ~/miniforge3/envs/streem-seamless/bin/pip show fairseq2 fairseq2n"
    exit 1
  fi
}

install_seamless_communication() {
  local git_ref="${SEAMLESS_GIT_REF:-main}"
  local git_url="https://github.com/facebookresearch/seamless_communication.git"
  # WSL: never clone into /mnt/<drive> — NTFS (drvfs) breaks git chmod/filemode.
  local git_cache="${STREEM_GIT_CACHE:-$HOME/.cache/streem/seamless_communication}"
  local broken_cache="$PROJECT_ROOT/.cache/seamless_communication"

  if [[ -f "$SEAMLESS_WHL" ]] && ! grep -q 'git-lfs.github.com' "$SEAMLESS_WHL" 2>/dev/null; then
    echo "Installing seamless_communication from local wheel..."
    conda_pip install --no-deps "$SEAMLESS_WHL"
    return
  fi

  if conda_pip show seamless-communication >/dev/null 2>&1 || conda_pip show seamless_communication >/dev/null 2>&1; then
    echo "seamless_communication already installed, skipping clone."
    return
  fi

  if ! command -v git >/dev/null 2>&1; then
    echo "git not found; falling back to pip clone into /tmp (no progress output)..."
    conda_pip install --no-deps "git+${git_url}@${git_ref}"
    return
  fi

  export GIT_TERMINAL_PROMPT=0

  if [[ -d "$broken_cache" ]] && [[ "$broken_cache" != "$git_cache" ]]; then
    echo "Removing broken git cache on Windows drive: $broken_cache"
    rm -rf "$broken_cache"
  fi

  mkdir -p "$(dirname "$git_cache")"

  if [[ ! -d "$git_cache/.git" ]]; then
    rm -rf "$git_cache"
    echo "Cloning seamless_communication from GitHub (${git_ref})..."
    echo "  Cache: $git_cache (1-5 minutes on first run)"
    git -c core.filemode=false clone --depth 1 --branch "$git_ref" --progress "$git_url" "$git_cache"
  else
    echo "Updating cached seamless_communication (${git_ref})..."
    git -C "$git_cache" -c core.filemode=false fetch --depth 1 origin "$git_ref" --progress
    git -C "$git_cache" checkout "$git_ref"
    git -C "$git_cache" reset --hard "origin/${git_ref}"
  fi

  echo "Installing seamless_communication from cache (no deps)..."
  conda_pip install --no-deps "$git_cache"
}

repair_pytorch_stack() {
  local py="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python"
  if "$py" - <<'PY' >/dev/null 2>&1
import torch
import torchaudio
if not torch.__version__.startswith("2.2.2"):
    raise SystemExit(1)
from torchaudio._extension.utils import _check_cuda_version
_check_cuda_version()
raise SystemExit(0)
PY
  then
    return
  fi

  echo "Repairing PyTorch / torchaudio (CUDA version mismatch)..."
  install_pytorch_stack
  conda_pip install "numpy>=1.24.4,<2.0"
}

repair_mismatched_torch() {
  repair_pytorch_stack
}

setup_library_path() {
  local py_site="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/lib/python3.10/site-packages"
  local -a extra_paths=()

  if [[ -d "$py_site/nvidia" ]]; then
    while IFS= read -r libdir; do
      extra_paths+=("$libdir")
    done < <(find "$py_site/nvidia" -type d -name lib 2>/dev/null | sort -u)
  fi

  if [[ -d "$py_site/fairseq2n/lib" ]]; then
    extra_paths+=("$py_site/fairseq2n/lib")
  fi

  if ((${#extra_paths[@]})); then
    export LD_LIBRARY_PATH="$(IFS=:; echo "${extra_paths[*]}")${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  fi
}

verify_backend() {
  echo "Verifying backend imports..."
  setup_library_path
  "$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python" - <<'PY'
import torch
import torchaudio
from torchaudio._extension.utils import _check_cuda_version
import fairseq2
from fairseq2n.bindings.data.string import CString
import seamless_communication

_check_cuda_version()
if "+cu118" not in torch.__version__:
    raise SystemExit(f"wrong torch build: {torch.__version__} (need cu118)")
print(f"torch {torch.__version__} cuda={torch.cuda.is_available()}")
print(f"fairseq2 {fairseq2.__version__}")
print("uvicorn ok, simuleval ok, seamless_communication ok")
PY
}

if [[ ! -f "$MINIFORGE_DIR/bin/conda" ]]; then
  install_miniforge
fi

# shellcheck disable=SC1091
source "$MINIFORGE_DIR/etc/profile.d/conda.sh"

if ! conda env list | awk '{print $1}' | grep -qx "$CONDA_ENV_NAME"; then
  echo "Creating conda env: $CONDA_ENV_NAME"
  conda create -y -n "$CONDA_ENV_NAME" python=3.10 -c conda-forge
fi

activate_conda

conda install -y libsndfile sox ffmpeg -c conda-forge

conda_pip install --upgrade pip setuptools wheel

install_pytorch_stack
install_fairseq2_stack
install_seamless_communication
conda_pip install -r "$REQ_FILE" -c "$CONSTRAINTS_FILE"
repair_fairseq2_stack
repair_pytorch_stack

"$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python" -c "import nltk; nltk.download('averaged_perceptron_tagger_eng'); nltk.download('cmudict'); nltk.download('punkt')"

if [[ "$(uname -s)" == "Darwin" ]]; then
  bash "$PROJECT_ROOT/scripts/patch-fairseq2n-macos.sh"
fi

prepare_assets() {
  if command -v node >/dev/null 2>&1; then
    node "$PROJECT_ROOT/scripts/prepare-assets.js"
    return
  fi
  echo "Node.js not found in WSL; prepare-assets runs on the Windows host after setup."
}

verify_backend
prepare_assets

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
echo ""
if [[ "$(uname -s)" == "Darwin" ]]; then
  echo "Virtual mic (Zoom): install BlackHole, pick it as translation output, then as mic in Zoom."
else
  echo "Virtual mic (Zoom): install VB-Audio Virtual Cable on Windows, pick CABLE Input in STREEM."
fi
