from pathlib import Path
from typing import Optional

import numpy as np
import sherpa_onnx

from config import SAMPLE_RATE
from model_setup import ensure_asr_model


class AsrEngine:
    def __init__(self) -> None:
        self.recognizer: Optional[sherpa_onnx.OnlineRecognizer] = None
        self.stream: Optional[sherpa_onnx.OnlineStream] = None
        self.last_text = ""

    def load(self) -> None:
        model_dir = ensure_asr_model()
        self.recognizer = sherpa_onnx.OnlineRecognizer.from_transducer(
            tokens=str(model_dir / "tokens.txt"),
            encoder=str(model_dir / "encoder.int8.onnx"),
            decoder=str(model_dir / "decoder.onnx"),
            joiner=str(model_dir / "joiner.int8.onnx"),
            num_threads=4,
            sample_rate=SAMPLE_RATE,
            feature_dim=80,
            decoding_method="greedy_search",
            provider="cpu",
            bpe_vocab=str(model_dir / "bpe.model"),
            enable_endpoint_detection=True,
            rule1_min_trailing_silence=2.4,
            rule2_min_trailing_silence=1.2,
            rule3_min_utterance_length=20,
        )
        self.reset_stream()

    def reset_stream(self) -> None:
        if not self.recognizer:
            return
        self.stream = self.recognizer.create_stream()
        self.last_text = ""

    def accept_audio(self, audio_chunk: np.ndarray) -> Optional[dict]:
        if not self.recognizer or not self.stream:
            return None

        self.stream.accept_waveform(SAMPLE_RATE, audio_chunk)
        while self.recognizer.is_ready(self.stream):
            self.recognizer.decode_stream(self.stream)

        current_text = self.recognizer.get_result(self.stream).strip()
        if not current_text or current_text == self.last_text:
            if self.recognizer.is_endpoint(self.stream):
                self.reset_stream()
            return None

        is_final = self.recognizer.is_endpoint(self.stream)
        self.last_text = current_text
        result = {"text": current_text, "is_final": is_final}
        if is_final:
            self.reset_stream()
        return result
