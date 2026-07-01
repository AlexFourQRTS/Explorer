import threading
from typing import Optional

import numpy as np
import sounddevice as sd
from piper import PiperVoice

from model_setup import ensure_piper_voice


class TtsEngine:
    def __init__(self) -> None:
        self.voice_cache: dict[str, PiperVoice] = {}
        self.playback_lock = threading.Lock()
        self.is_playing = False

    def load_voice(self, language_code: str) -> PiperVoice:
        if language_code in self.voice_cache:
            return self.voice_cache[language_code]
        voice_path = ensure_piper_voice(language_code)
        voice = PiperVoice.load(str(voice_path))
        self.voice_cache[language_code] = voice
        return voice

    @property
    def playback_active(self) -> bool:
        return self.is_playing

    def speak(
        self,
        text: str,
        language_code: str,
        output_device: Optional[int] = None,
    ) -> None:
        if not text.strip():
            return
        voice = self.load_voice(language_code)
        audio_chunks = []
        sample_rate = voice.config.sample_rate
        for audio_chunk in voice.synthesize(text):
            pcm_bytes = audio_chunk.audio_int16_bytes
            audio_chunks.append(
                np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32)
                / 32768.0
            )
        if not audio_chunks:
            return
        audio_data = np.concatenate(audio_chunks)
        with self.playback_lock:
            self.is_playing = True
            try:
                sd.play(audio_data, samplerate=sample_rate, device=output_device)
                sd.wait()
            finally:
                self.is_playing = False
