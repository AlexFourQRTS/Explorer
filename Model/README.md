# Model checkpoints

Place these files here (not in git):

- `seamless_streaming_unity.pt`
- `seamless_streaming_monotonic_decoder.pt`

Download from [facebook/seamless-streaming](https://huggingface.co/facebook/seamless-streaming).

## Setup

```bash
cd Explorer
npm install
npm run setup:seamless
npm run start
```

**Windows:** backend runs in **WSL2** (fairseq2 has no native Windows wheels). Install Ubuntu WSL if needed (`wsl --install -d Ubuntu`), then `npm run setup:seamless` installs Miniforge + conda env inside WSL. Electron UI runs natively on Windows.

**macOS:** same command uses the bash installer (Miniforge + BlackHole notes in setup output).

## Virtual mic (Zoom / Meet)

| OS | Driver | In STREEM | In Zoom |
|----|--------|-----------|---------|
| Windows | [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) | CABLE Input (output) | CABLE Output (microphone) |
| macOS | [BlackHole](https://existential.audio/blackhole/) | BlackHole 2ch (output) | BlackHole (microphone) |
