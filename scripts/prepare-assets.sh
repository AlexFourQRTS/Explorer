#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL_DIR="$PROJECT_ROOT/Model"
GENERATED_ASSETS="$PROJECT_ROOT/config/fairseq2/generated"

mkdir -p "$GENERATED_ASSETS"

cat > "$GENERATED_ASSETS/streem_seamless_streaming_unity.yaml" <<EOF
name: streem_seamless_streaming_unity
base: seamless_streaming_unity
checkpoint: "file://${MODEL_DIR}/seamless_streaming_unity.pt"
EOF

cat > "$GENERATED_ASSETS/streem_seamless_streaming_monotonic_decoder.yaml" <<EOF
name: streem_seamless_streaming_monotonic_decoder
base: seamless_streaming_monotonic_decoder
checkpoint: "file://${MODEL_DIR}/seamless_streaming_monotonic_decoder.pt"
EOF

cp "$PROJECT_ROOT/config/seamless/vad_s2st_sc_main.yaml" \
  "$PROJECT_ROOT/seamless-streaming/seamless_server/models/SeamlessStreaming/vad_s2st_sc_main.yaml"

echo "Asset cards written to $GENERATED_ASSETS"
echo "SeamlessStreaming config updated."
