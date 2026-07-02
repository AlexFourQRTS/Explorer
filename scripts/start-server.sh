#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${STREEM_PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SERVER_DIR="$PROJECT_ROOT/seamless-streaming/seamless_server"
CONDA_ENV_NAME="streem-seamless"
MINIFORGE_DIR="${MINIFORGE_DIR:-$HOME/miniforge3}"
PORT="${STREEM_PORT:-7860}"

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
    local joined
    joined="$(IFS=:; echo "${extra_paths[*]}")"
    export LD_LIBRARY_PATH="${joined}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  fi
}

if [[ ! -f "$PROJECT_ROOT/Model/seamless_streaming_unity.pt" ]]; then
  echo "Missing Model/seamless_streaming_unity.pt"
  exit 1
fi

if [[ "${STREEM_SKIP_PREPARE_ASSETS:-0}" == "1" ]]; then
  echo "Skipping prepare-assets (already run on Windows host)."
elif command -v node >/dev/null 2>&1; then
  node "$PROJECT_ROOT/scripts/prepare-assets.js"
else
  echo "Node.js not in WSL; using asset cards prepared on Windows host."
fi

export FAIRSEQ2_USER_ASSET_DIR="$PROJECT_ROOT/config/fairseq2/generated"
export STREEM_MODEL_DIR="$PROJECT_ROOT/Model"

activate_conda() {
  if [[ -f "$MINIFORGE_DIR/etc/profile.d/conda.sh" ]]; then
    # shellcheck disable=SC1091
    source "$MINIFORGE_DIR/etc/profile.d/conda.sh"
    conda activate "$CONDA_ENV_NAME"
    return
  fi
  if [[ -f "$HOME/miniforge3/etc/profile.d/conda.sh" ]]; then
    # shellcheck disable=SC1091
    source "$HOME/miniforge3/etc/profile.d/conda.sh"
    conda activate "$CONDA_ENV_NAME"
    return
  fi
  if [[ -f "$PROJECT_ROOT/.venv-seamless/bin/activate" ]]; then
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.venv-seamless/bin/activate"
    return
  fi
  echo "Run first: cd Explorer && npm run setup:seamless"
  exit 1
}

if [[ "$(uname -s)" == "Darwin" ]]; then
  bash "$PROJECT_ROOT/scripts/patch-fairseq2n-macos.sh"
fi

activate_conda
setup_library_path

UVICORN="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/uvicorn"
if [[ ! -x "$UVICORN" ]]; then
  echo "Missing uvicorn in conda env. Run: cd Explorer && npm run setup:seamless"
  exit 1
fi

free_port() {
  local pids
  pids=$(lsof -ti ":$PORT" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "Freeing port $PORT (pid: $pids)..."
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

if [[ "${STREEM_FREE_PORT:-1}" == "1" ]]; then
  free_port
fi

cd "$SERVER_DIR"
echo "STREEM Seamless server -> http://127.0.0.1:${PORT}"
exec "$UVICORN" app_pubsub:app --host 127.0.0.1 --port "$PORT"
