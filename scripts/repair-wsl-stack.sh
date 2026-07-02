#!/usr/bin/env bash
# One-shot repair: fairseq2 cu118 wheels + torch/torchaudio cu118 (torch must be last).
set -euo pipefail

MINIFORGE_DIR="${MINIFORGE_DIR:-$HOME/miniforge3}"
CONDA_ENV_NAME="streem-seamless"
PIP="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python -m pip"
FAIRSEQ2_INDEX="https://fair.pkg.atmeta.com/fairseq2/whl/stable/pt2.2.2/cu118"
TORCH_INDEX="https://download.pytorch.org/whl/cu118"

echo "Repairing fairseq2 0.2.1 (no-deps)..."
$PIP install --force-reinstall --no-deps \
  fairseq2==0.2.1 fairseq2n==0.2.1 \
  --extra-index-url "$FAIRSEQ2_INDEX" --trusted-host fair.pkg.atmeta.com

echo "Repairing torch/torchaudio 2.2.2+cu118..."
$PIP install --force-reinstall \
  torch==2.2.2 torchaudio==2.2.2 \
  --index-url "$TORCH_INDEX"

echo "Verify:"
PY_SITE="$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/lib/python3.10/site-packages"
if [[ -d "$PY_SITE/nvidia" ]]; then
  export LD_LIBRARY_PATH="$(find "$PY_SITE/nvidia" -type d -name lib 2>/dev/null | tr '\n' ':')${PY_SITE}/fairseq2n/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi
$MINIFORGE_DIR/envs/$CONDA_ENV_NAME/bin/python - <<'PY'
import torch
import torchaudio
from torchaudio._extension.utils import _check_cuda_version
from fairseq2n.bindings.data.string import CString
import fairseq2
_check_cuda_version()
print(f"torch {torch.__version__} cuda={torch.cuda.is_available()}")
print(f"fairseq2 {fairseq2.__version__}")
print("torchaudio cuda check ok, fairseq2n ok")
PY
