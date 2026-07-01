import urllib.request
from pathlib import Path

from config import (
    ASR_MODEL_FILES,
    ASR_MODEL_REPO,
    MODELS_DIR,
    NLLB_CT2_DIR,
    NLLB_MODEL_NAME,
    PIPER_VOICES,
)


def ensure_directory(target_path: Path) -> None:
    target_path.mkdir(parents=True, exist_ok=True)


def download_file(remote_url: str, local_path: Path) -> None:
    if local_path.exists():
        return
    ensure_directory(local_path.parent)
    print(f"Downloading {local_path.name}...")
    urllib.request.urlretrieve(remote_url, local_path)


def huggingface_url(repo_name: str, file_path: str) -> str:
    return (
        f"https://huggingface.co/{repo_name}/resolve/main/{file_path}?download=true"
    )


def ensure_asr_model() -> Path:
    model_dir = MODELS_DIR / "asr-ru-streaming"
    ensure_directory(model_dir)
    for file_name in ASR_MODEL_FILES:
        download_file(
            huggingface_url(ASR_MODEL_REPO, file_name),
            model_dir / file_name,
        )
    return model_dir


def ensure_piper_voice(language_code: str) -> Path:
    voice_meta = PIPER_VOICES[language_code]
    voice_dir = MODELS_DIR / "piper" / language_code
    ensure_directory(voice_dir)
    onnx_path = voice_dir / Path(voice_meta["path"]).name
    config_path = voice_dir / Path(voice_meta["config"]).name
    download_file(
        huggingface_url(voice_meta["repo"], voice_meta["path"]),
        onnx_path,
    )
    download_file(
        huggingface_url(voice_meta["repo"], voice_meta["config"]),
        config_path,
    )
    return onnx_path


def ensure_nllb_model() -> Path:
    ensure_directory(NLLB_CT2_DIR)
    marker_file = NLLB_CT2_DIR / ".ready"
    if marker_file.exists():
        return NLLB_CT2_DIR

    try:
        from huggingface_hub import snapshot_download
    except ImportError as import_error:
        raise RuntimeError(
            "Install backend dependencies before downloading translation model"
        ) from import_error

    print("Downloading NLLB translation model (first run, ~600 MB)...")
    snapshot_download(
        repo_id="trp59/nllb-200-distilled-600M-ctranslate2",
        local_dir=str(NLLB_CT2_DIR),
    )
    marker_file.write_text("ok", encoding="utf-8")
    return NLLB_CT2_DIR
