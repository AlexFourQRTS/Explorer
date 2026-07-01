import asyncio
import threading
from typing import Awaitable, Callable, Optional

import numpy as np

from pipeline.asr_engine import AsrEngine
from pipeline.audio_capture import AudioCapture
from pipeline.translate_engine import TranslateEngine
from pipeline.tts_engine import TtsEngine

EventCallback = Callable[[dict], Awaitable[None]]


class LiveTranslator:
    def __init__(self, emit_event: EventCallback) -> None:
        self.emit_event = emit_event
        self.asr_engine = AsrEngine()
        self.translate_engine = TranslateEngine()
        self.tts_engine = TtsEngine()
        self.audio_capture: Optional[AudioCapture] = None
        self.event_loop: Optional[asyncio.AbstractEventLoop] = None
        self.source_lang = "ru"
        self.target_lang = "uk"
        self.input_device: Optional[int] = None
        self.output_device: Optional[int] = None
        self.is_active = False
        self.processing_lock = threading.Lock()

    async def prepare_models(self) -> None:
        await self._emit({"type": "status", "state": "loading"})
        await asyncio.to_thread(self._load_models)
        await self._emit({"type": "status", "state": "ready"})

    def _load_models(self) -> None:
        self.asr_engine.load()
        self.translate_engine.load()
        self.tts_engine.load_voice(self.target_lang)

    async def start(
        self,
        source_lang: str,
        target_lang: str,
        input_device: Optional[int],
        output_device: Optional[int],
    ) -> None:
        if self.is_active:
            return
        self.source_lang = source_lang
        self.target_lang = target_lang
        self.input_device = input_device
        self.output_device = output_device
        self.event_loop = asyncio.get_running_loop()
        self.is_active = True
        self.audio_capture = AudioCapture(
            on_audio_chunk=self._on_audio_chunk,
            input_device=input_device,
        )
        self.audio_capture.start()
        await self._emit({"type": "status", "state": "listening"})

    async def stop(self) -> None:
        if not self.is_active:
            return
        self.is_active = False
        if self.audio_capture:
            self.audio_capture.stop()
            self.audio_capture = None
        await self._emit({"type": "status", "state": "ready"})

    def list_audio_devices(self) -> dict:
        return AudioCapture.list_devices()

    def _on_audio_chunk(self, audio_chunk: np.ndarray) -> None:
        if not self.is_active or not self.event_loop:
            return
        if self.tts_engine.playback_active:
            return
        asyncio.run_coroutine_threadsafe(
            self._process_audio_chunk(audio_chunk),
            self.event_loop,
        )

    async def _process_audio_chunk(self, audio_chunk: np.ndarray) -> None:
        if not self.is_active:
            return
        asr_result = await asyncio.to_thread(
            self.asr_engine.accept_audio,
            audio_chunk,
        )
        if not asr_result:
            return
        await self._emit(
            {
                "type": "transcript",
                "text": asr_result["text"],
                "is_final": asr_result["is_final"],
            }
        )
        if not asr_result["is_final"]:
            return
        await self._translate_and_speak(asr_result["text"])

    async def _translate_and_speak(self, source_text: str) -> None:
        with self.processing_lock:
            await self._emit({"type": "status", "state": "translating"})
            translated_text = await asyncio.to_thread(
                self.translate_engine.translate,
                source_text,
                self.source_lang,
                self.target_lang,
            )
            await self._emit(
                {
                    "type": "translated",
                    "text": translated_text,
                    "source_text": source_text,
                }
            )
            await asyncio.to_thread(
                self.tts_engine.speak,
                translated_text,
                self.target_lang,
                self.output_device,
            )
            if self.is_active:
                await self._emit({"type": "status", "state": "listening"})

    async def _emit(self, payload: dict) -> None:
        await self.emit_event(payload)
