#!/usr/bin/env bash
set -euo pipefail

MINIFORGE_DIR="${MINIFORGE_DIR:-$HOME/miniforge3}"
CONDA_ENV_NAME="streem-seamless"
PY_SITE="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/lib/python3.10/site-packages"

setup_library_path() {
  local -a extra_paths=()
  if [[ -d "$PY_SITE/nvidia" ]]; then
    while IFS= read -r libdir; do
      extra_paths+=("$libdir")
    done < <(find "$PY_SITE/nvidia" -type d -name lib 2>/dev/null | sort -u)
  fi
  if [[ -d "$PY_SITE/fairseq2n/lib" ]]; then
    extra_paths+=("$PY_SITE/fairseq2n/lib")
  fi
  if ((${#extra_paths[@]})); then
    export LD_LIBRARY_PATH="$(IFS=:; echo "${extra_paths[*]}")${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  fi
}

# shellcheck disable=SC1091
source "$MINIFORGE_DIR/etc/profile.d/conda.sh"
conda activate "$CONDA_ENV_NAME"
setup_library_path

python - <<'PY'
import torch
import torchaudio
from torchaudio._extension.utils import _check_cuda_version
import fairseq2
from fairseq2n.bindings.data.string import CString
import seamless_communication

_check_cuda_version()
print(f"torch {torch.__version__} cuda={torch.cuda.is_available()}")
print(f"fairseq2 {fairseq2.__version__}")
print("seamless_communication ok")
PY
