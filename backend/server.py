import asyncio
import json
import logging
from typing import Optional

import websockets
from websockets.server import WebSocketServerProtocol

from config import WS_HOST, WS_PORT
from pipeline.live_translator import LiveTranslator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("streem-backend")


class TranslationServer:
    def __init__(self) -> None:
        self.translator = LiveTranslator(self._send_to_client)
        self.client_socket: Optional[WebSocketServerProtocol] = None
        self.models_ready = False

    async def _send_to_client(self, payload: dict) -> None:
        if not self.client_socket:
            return
        await self.client_socket.send(json.dumps(payload))

    async def handle_client(self, websocket: WebSocketServerProtocol) -> None:
        self.client_socket = websocket
        await websocket.send(json.dumps({"type": "connected"}))
        try:
            async for raw_message in websocket:
                await self._handle_message(raw_message)
        finally:
            await self.translator.stop()
            self.client_socket = None

    async def _handle_message(self, raw_message: str) -> None:
        message = json.loads(raw_message)
        action = message.get("action")
        if action == "prepare":
            if self.models_ready:
                await self._send_to_client({"type": "status", "state": "ready"})
                return
            await self.translator.prepare_models()
            self.models_ready = True
            return
        if action == "list_devices":
            devices = self.translator.list_audio_devices()
            await self._send_to_client({"type": "devices", **devices})
            return
        if action == "start":
            await self.translator.start(
                source_lang=message.get("source_lang", "ru"),
                target_lang=message.get("target_lang", "uk"),
                input_device=message.get("input_device"),
                output_device=message.get("output_device"),
            )
            return
        if action == "stop":
            await self.translator.stop()
            return
        await self._send_to_client(
            {"type": "error", "message": f"Unknown action: {action}"}
        )


async def main() -> None:
    server = TranslationServer()
    async with websockets.serve(server.handle_client, WS_HOST, WS_PORT):
        logger.info("STREEM backend listening on ws://%s:%s", WS_HOST, WS_PORT)
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
