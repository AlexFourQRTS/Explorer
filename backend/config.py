from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
MODELS_DIR = PROJECT_ROOT / "models"
BIN_DIR = PROJECT_ROOT / "bin"

WS_HOST = "127.0.0.1"
WS_PORT = 8765

SAMPLE_RATE = 16000
CHUNK_SAMPLES = 1600

ASR_MODEL_REPO = (
    "csukuangfj/sherpa-onnx-streaming-zipformer-small-ru-vosk-int8-2025-08-16"
)
ASR_MODEL_FILES = [
    "tokens.txt",
    "bpe.model",
    "encoder.int8.onnx",
    "decoder.onnx",
    "joiner.int8.onnx",
]

NLLB_MODEL_NAME = "facebook/nllb-200-distilled-600M"
NLLB_CT2_DIR = MODELS_DIR / "nllb-600m-ct2"

PIPER_VOICES = {
    "ru": {
        "repo": "rhasspy/piper-voices",
        "path": "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx",
        "config": "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx.json",
    },
    "uk": {
        "repo": "rhasspy/piper-voices",
        "path": "uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx",
        "config": "uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx.json",
    },
    "en": {
        "repo": "rhasspy/piper-voices",
        "path": "en/en_US/lessac/medium/en_US-lessac-medium.onnx",
        "config": "en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
    },
}

NLLB_LANG_CODES = {
    "ru": "rus_Cyrl",
    "uk": "ukr_Cyrl",
    "en": "eng_Latn",
}
