import {useRef, useState} from 'react';
import {
  AgentCapabilities,
  ServerExceptionData,
  ServerState,
  ServerTextData,
  StreamingStatus,
  SupportedInputSource,
  SupportedOutputMode,
} from '../types/StreamingTypes';
import {RoomState} from '../types/RoomState';

export function useStreamingInterfaceState(debugParam: boolean | undefined) {
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [agent, setAgent] = useState<AgentCapabilities | null>(null);
  const [serverExceptions, setServerExceptions] = useState<
    Array<ServerExceptionData>
  >([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [streamingStatus, setStreamingStatus] =
    useState<StreamingStatus>('stopped');
  const [hasMaxSpeakers, setHasMaxSpeakers] = useState(false);
  const [outputMode, setOutputMode] = useState<SupportedOutputMode>('s2s');
  const [inputSource, setInputSource] =
    useState<SupportedInputSource>('userMedia');
  const [enableNoiseSuppression, setEnableNoiseSuppression] = useState<
    boolean | null
  >(null);
  const [enableEchoCancellation, setEnableEchoCancellation] = useState<
    boolean | null
  >(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [enableExpressive, setEnableExpressive] = useState<boolean | null>(null);
  const [serverDebugFlag, setServerDebugFlag] = useState(debugParam ?? false);
  const [receivedData, setReceivedData] = useState<Array<ServerTextData>>([]);
  const [translationSentencesAnimatedIndex, setTranslationSentencesAnimatedIndex] =
    useState(0);
  const [inputStream, setInputStream] = useState<MediaStream | null>(null);
  const [inputStreamSource, setInputStreamSource] =
    useState<MediaStreamAudioSourceNode | null>(null);
  const [scriptNodeProcessor, setScriptNodeProcessor] =
    useState<ScriptProcessorNode | null>(null);
  const [muted, setMuted] = useState(false);
  const [gain, setGain] = useState(1);
  const lastTranslationResultRef = useRef<HTMLDivElement | null>(null);

  return {
    serverState,
    setServerState,
    agent,
    setAgent,
    serverExceptions,
    setServerExceptions,
    roomState,
    setRoomState,
    streamingStatus,
    setStreamingStatus,
    hasMaxSpeakers,
    setHasMaxSpeakers,
    outputMode,
    setOutputMode,
    inputSource,
    setInputSource,
    enableNoiseSuppression,
    setEnableNoiseSuppression,
    enableEchoCancellation,
    setEnableEchoCancellation,
    targetLang,
    setTargetLang,
    enableExpressive,
    setEnableExpressive,
    serverDebugFlag,
    setServerDebugFlag,
    receivedData,
    setReceivedData,
    translationSentencesAnimatedIndex,
    setTranslationSentencesAnimatedIndex,
    inputStream,
    setInputStream,
    inputStreamSource,
    setInputStreamSource,
    scriptNodeProcessor,
    setScriptNodeProcessor,
    muted,
    setMuted,
    gain,
    setGain,
    lastTranslationResultRef,
  };
}
