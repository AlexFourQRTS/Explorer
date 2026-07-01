import type {RefObject} from 'react';
import {Socket} from 'socket.io-client';
import float32To16BitPCM from '../float32To16BitPCM';
import {
  DynamicConfig,
  SupportedInputSource,
  SupportedOutputMode,
} from '../types/StreamingTypes';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import debug from '../debug';
import {
  requestDisplayMediaAudioStream,
  requestUserMediaAudioStream,
} from './requestAudioStreams';
import {AUDIO_STREAM_DEFAULTS} from './streamingInterfaceConstants';
import {configureStreamOnSocket, emitDynamicConfig} from './streamingSocketConfig';

type StartStreamingSessionParams = {
  socket: Socket;
  audioContext: AudioContext;
  inputSource: SupportedInputSource;
  enableNoiseSuppression: boolean | null;
  enableEchoCancellation: boolean | null;
  targetLang: string;
  enableExpressive: boolean | null;
  agentName: string;
  outputMode: SupportedOutputMode;
  serverDebugFlag: boolean;
  mutedRef: RefObject<boolean>;
  isStreamConfiguredRef: RefObject<boolean>;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  onMaxSpeakers: (isMax: boolean) => void;
  setInputStream: (stream: MediaStream | null) => void;
  setInputStreamSource: (source: MediaStreamAudioSourceNode | null) => void;
  setScriptNodeProcessor: (processor: ScriptProcessorNode | null) => void;
};

export async function startStreamingSession({
  socket,
  audioContext,
  inputSource,
  enableNoiseSuppression,
  enableEchoCancellation,
  targetLang,
  enableExpressive,
  agentName,
  outputMode,
  serverDebugFlag,
  mutedRef,
  isStreamConfiguredRef,
  bufferedSpeechPlayer,
  onMaxSpeakers,
  setInputStream,
  setInputStreamSource,
  setScriptNodeProcessor,
}: StartStreamingSessionParams): Promise<void> {
  if (audioContext.state === 'suspended') {
    console.warn('audioContext was suspended! resuming...');
    await audioContext.resume();
  }

  let stream: MediaStream | null = null;

  if (inputSource === 'userMedia') {
    stream = await requestUserMediaAudioStream({
      noiseSuppression:
        enableNoiseSuppression ??
        AUDIO_STREAM_DEFAULTS.userMedia.noiseSuppression,
      echoCancellation:
        enableEchoCancellation ??
        AUDIO_STREAM_DEFAULTS.userMedia.echoCancellation,
    });
  }
  if (inputSource === 'displayMedia') {
    stream = await requestDisplayMediaAudioStream({
      noiseSuppression:
        enableNoiseSuppression ??
        AUDIO_STREAM_DEFAULTS.displayMedia.noiseSuppression,
      echoCancellation:
        enableEchoCancellation ??
        AUDIO_STREAM_DEFAULTS.displayMedia.echoCancellation,
    });
  }
  if (stream == null) {
    throw new Error(`Unsupported input source requested: ${inputSource}`);
  }

  setInputStream(stream);

  const mediaStreamSource = audioContext.createMediaStreamSource(stream);
  setInputStreamSource(mediaStreamSource);

  const scriptProcessor = audioContext.createScriptProcessor(16384, 1, 1);
  setScriptNodeProcessor(scriptProcessor);

  scriptProcessor.onaudioprocess = (event) => {
    if (!isStreamConfiguredRef.current) {
      return;
    }
    if (mutedRef.current) {
      socket.emit('incoming_audio', new Int16Array(1));
      return;
    }
    const pcm16Audio = float32To16BitPCM(event.inputBuffer.getChannelData(0));
    socket.emit('incoming_audio', pcm16Audio);
    debug()?.sentAudio(event);
  };

  mediaStreamSource.connect(scriptProcessor);
  scriptProcessor.connect(audioContext.destination);
  bufferedSpeechPlayer.start();

  const fullDynamicConfig: DynamicConfig = {
    targetLanguage: targetLang,
    expressive: enableExpressive,
  };

  await emitDynamicConfig(socket, fullDynamicConfig);
  await configureStreamOnSocket({
    socket,
    agentName,
    sampleRate: audioContext.sampleRate,
    outputMode,
    serverDebugFlag,
    onMaxSpeakers,
    onConfigured: (configured) => {
      isStreamConfiguredRef.current = configured;
    },
  });
}

type StopStreamingSessionParams = {
  socket: Socket | null;
  audioContext: AudioContext;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  inputStream: MediaStream | null;
  inputStreamSource: MediaStreamAudioSourceNode | null;
  scriptNodeProcessor: ScriptProcessorNode | null;
};

export function stopStreamingSession({
  socket,
  audioContext,
  bufferedSpeechPlayer,
  inputStream,
  inputStreamSource,
  scriptNodeProcessor,
}: StopStreamingSessionParams): void {
  bufferedSpeechPlayer.stop();

  if (inputStreamSource != null && scriptNodeProcessor != null) {
    inputStreamSource.disconnect(scriptNodeProcessor);
    scriptNodeProcessor.disconnect(audioContext.destination);
    inputStream?.getTracks().forEach((track) => track.stop());
  }

  if (socket != null) {
    socket.emit('stop_stream', (result) => {
      console.debug('[emit result: stop_stream]', result);
    });
  }
}
