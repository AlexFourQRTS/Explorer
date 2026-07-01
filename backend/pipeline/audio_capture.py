import queue
import threading
from typing import Callable, Optional

import numpy as np
import sounddevice as sd

from config import CHUNK_SAMPLES, SAMPLE_RATE


class AudioCapture:
    def __init__(
        self,
        on_audio_chunk: Callable[[np.ndarray], None],
        input_device: Optional[int] = None,
    ) -> None:
        self.on_audio_chunk = on_audio_chunk
        self.input_device = input_device
        self.capture_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.audio_queue: queue.Queue[np.ndarray] = queue.Queue()

    @staticmethod
    def list_devices() -> dict:
        devices = sd.query_devices()
        input_devices = []
        output_devices = []
        for index, device in enumerate(devices):
            device_info = {
                "index": index,
                "name": device["name"],
                "channels": device["max_input_channels"]
                if device["max_input_channels"] > 0
                else device["max_output_channels"],
            }
            if device["max_input_channels"] > 0:
                input_devices.append(device_info)
            if device["max_output_channels"] > 0:
                output_devices.append(device_info)
        return {"inputs": input_devices, "outputs": output_devices}

    def start(self) -> None:
        if self.is_running:
            return
        self.is_running = True
        self.capture_thread = threading.Thread(
            target=self._capture_loop,
            daemon=True,
        )
        self.capture_thread.start()

    def stop(self) -> None:
        self.is_running = False
        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)
            self.capture_thread = None

    def _capture_loop(self) -> None:
        def audio_callback(
            indata: np.ndarray,
            frames: int,
            time_info: dict,
            status: sd.CallbackFlags,
        ) -> None:
            if not self.is_running:
                return
            mono_chunk = indata[:, 0].copy()
            self.on_audio_chunk(mono_chunk)

        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="float32",
            blocksize=CHUNK_SAMPLES,
            device=self.input_device,
            callback=audio_callback,
        ):
            while self.is_running:
                sd.sleep(100)
