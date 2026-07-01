import {useCallback, useEffect, useRef} from 'react';
import {Socket} from 'socket.io-client';
import {
  AgentCapabilities,
  PartialDynamicConfig,
  StreamingStatus,
  SupportedInputSource,
  SupportedOutputMode,
} from '../types/StreamingTypes';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import {
  applyAgentChange,
  emitDynamicConfig,
} from './streamingSocketConfig';
import {
  startStreamingSession,
  stopStreamingSession,
} from './streamingSession';

type UseStreamingControlsParams = {
  socket: Socket | null;
  audioContext: AudioContext;
  agent: AgentCapabilities | null;
  streamingStatus: StreamingStatus;
  outputMode: SupportedOutputMode;
  inputSource: SupportedInputSource;
  enableNoiseSuppression: boolean | null;
  enableEchoCancellation: boolean | null;
  targetLang: string | null;
  enableExpressive: boolean | null;
  serverDebugFlag: boolean;
  muted: boolean;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  inputStream: MediaStream | null;
  inputStreamSource: MediaStreamAudioSourceNode | null;
  scriptNodeProcessor: ScriptProcessorNode | null;
  setStreamingStatus: (status: StreamingStatus) => void;
  setHasMaxSpeakers: (value: boolean) => void;
  setInputStream: (stream: MediaStream | null) => void;
  setInputStreamSource: (source: MediaStreamAudioSourceNode | null) => void;
  setScriptNodeProcessor: (processor: ScriptProcessorNode | null) => void;
  setTargetLang: (lang: string | null) => void;
  setEnableExpressive: (value: boolean | null) => void;
  setAgent: React.Dispatch<React.SetStateAction<AgentCapabilities | null>>;
};

export function useStreamingControls({
  socket,
  audioContext,
  agent,
  streamingStatus,
  outputMode,
  inputSource,
  enableNoiseSuppression,
  enableEchoCancellation,
  targetLang,
  enableExpressive,
  serverDebugFlag,
  muted,
  bufferedSpeechPlayer,
  inputStream,
  inputStreamSource,
  scriptNodeProcessor,
  setStreamingStatus,
  setHasMaxSpeakers,
  setInputStream,
  setInputStreamSource,
  setScriptNodeProcessor,
  setTargetLang,
  setEnableExpressive,
  setAgent,
}: UseStreamingControlsParams) {
  const isStreamConfiguredRef = useRef(false);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const setAgentAndUpdateParams = useCallback(
    (newAgent: AgentCapabilities | null) => {
      setAgent((prevAgent) =>
        applyAgentChange(
          prevAgent,
          newAgent,
          setTargetLang,
          () => setEnableExpressive(null),
        ),
      );
    },
    [setAgent, setEnableExpressive, setTargetLang],
  );

  const onSetDynamicConfig = useCallback(
    async (partialConfig: PartialDynamicConfig) => {
      if (socket == null) {
        throw new Error('[onSetDynamicConfig] socket is null');
      }
      await emitDynamicConfig(socket, partialConfig);
    },
    [socket],
  );

  const startStreaming = useCallback(async () => {
    if (streamingStatus !== 'stopped') {
      console.warn(
        `Attempting to start stream when status is ${streamingStatus}`,
      );
      return;
    }
    if (socket == null || agent?.name == null || targetLang == null) {
      console.error('[startStreaming] missing socket, agent, or targetLang');
      return;
    }

    setStreamingStatus('starting');

    try {
      await startStreamingSession({
        socket,
        audioContext,
        inputSource,
        enableNoiseSuppression,
        enableEchoCancellation,
        targetLang,
        enableExpressive,
        agentName: agent.name,
        outputMode,
        serverDebugFlag,
        mutedRef,
        isStreamConfiguredRef,
        bufferedSpeechPlayer,
        onMaxSpeakers: setHasMaxSpeakers,
        setInputStream,
        setInputStreamSource,
        setScriptNodeProcessor,
      });
    } catch (error) {
      console.error('[startStreaming] failed:', error);
      setStreamingStatus('stopped');
      return;
    }

    setStreamingStatus('running');
  }, [
    agent?.name,
    audioContext,
    bufferedSpeechPlayer,
    enableEchoCancellation,
    enableExpressive,
    enableNoiseSuppression,
    inputSource,
    outputMode,
    serverDebugFlag,
    setHasMaxSpeakers,
    setInputStream,
    setInputStreamSource,
    setScriptNodeProcessor,
    setStreamingStatus,
    socket,
    streamingStatus,
    targetLang,
  ]);

  const stopStreaming = useCallback(async () => {
    if (streamingStatus === 'stopped') {
      return;
    }

    stopStreamingSession({
      socket,
      audioContext,
      bufferedSpeechPlayer,
      inputStream,
      inputStreamSource,
      scriptNodeProcessor,
    });
    setStreamingStatus('stopped');
  }, [
    audioContext,
    bufferedSpeechPlayer,
    inputStream,
    inputStreamSource,
    scriptNodeProcessor,
    setStreamingStatus,
    socket,
    streamingStatus,
  ]);

  return {
    startStreaming,
    stopStreaming,
    onSetDynamicConfig,
    setAgentAndUpdateParams,
  };
}
