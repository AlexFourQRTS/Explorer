import {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import {
  TranslationSentences,
} from './types/StreamingTypes';
import './StreamingInterface.css';
import {useSocket} from './useSocket';
import useStable from './useStable';
import createBufferedSpeechPlayer from './createBufferedSpeechPlayer';
import getTranslationSentencesFromReceivedData from './getTranslationSentencesFromReceivedData';
import {
  getTotalSentencesLength,
  sliceTranslationSentencesUpToIndex,
} from './sliceTranslationSentencesUtils';
import {getURLParams} from './URLParams';
import DebugSection from './DebugSection';
import XRDialog from './react-xr/XRDialog';
import {useStreamingControls} from './streaming/useStreamingControls';
import {useStreamingSocketListeners} from './streaming/useStreamingSocketListeners';
import {useVirtualMicDevices} from './streaming/useVirtualMicDevices';
import {useInputMicrophoneDevices} from './streaming/useInputMicrophoneDevices';
import {useStreamingInterfaceState} from './streaming/useStreamingInterfaceState';
import {
  StreamingInterfaceHeader,
  StreamingSpeakerPanel,
} from './streaming/StreamingInterfaceLayout';
import {StreamingTranscript} from './streaming/StreamingTranscript';
import {getGainScaledValue} from './streaming/streamingGain';

export function StreamingInterface() {
  const urlParams = getURLParams();
  const debugParam = urlParams.debug;
  const state = useStreamingInterfaceState(debugParam);
  const [animateTextDisplay, setAnimateTextDisplay] = useState(
    urlParams.animateTextDisplay,
  );

  const {socket, clientID} = useSocket();
  const audioContext = useStable<AudioContext>(() => new AudioContext());
  const bufferedSpeechPlayer = useStable(() => {
    const player = createBufferedSpeechPlayer({
      onStarted: () => console.debug('📢 PLAYBACK STARTED 📢'),
      onEnded: () => console.debug('🛑 PLAYBACK ENDED 🛑'),
    });
    player.start();
    return player;
  });

  const model = state.agent?.name ?? null;
  const agentsCapabilities = state.serverState?.agentsCapabilities ?? [];
  const currentAgent =
    agentsCapabilities.find((item) => item.name === model) ?? null;
  const roomID = state.roomState?.room_id ?? null;
  const isSpeaker =
    (clientID != null && state.roomState?.speakers.includes(clientID)) ?? false;
  const isListener =
    (clientID != null && state.roomState?.listeners.includes(clientID)) ?? false;

  const inputMic = useInputMicrophoneDevices();

  const virtualMic = useVirtualMicDevices({
    bufferedSpeechPlayer,
    inputStream: state.inputStream,
  });

  const streamControls = useStreamingControls({
    socket,
    audioContext,
    agent: state.agent,
    streamingStatus: state.streamingStatus,
    outputMode: state.outputMode,
    inputSource: state.inputSource,
    inputDeviceId: inputMic.inputDeviceId,
    enableNoiseSuppression: state.enableNoiseSuppression,
    enableEchoCancellation: state.enableEchoCancellation,
    targetLang: state.targetLang,
    enableExpressive: state.enableExpressive,
    serverDebugFlag: state.serverDebugFlag,
    muted: state.muted,
    translationOutputDeviceId: virtualMic.translationOutputDeviceId,
    bufferedSpeechPlayer,
    inputStream: state.inputStream,
    inputStreamSource: state.inputStreamSource,
    scriptNodeProcessor: state.scriptNodeProcessor,
    setStreamingStatus: state.setStreamingStatus,
    setHasMaxSpeakers: state.setHasMaxSpeakers,
    setInputStream: state.setInputStream,
    setInputStreamSource: state.setInputStreamSource,
    setScriptNodeProcessor: state.setScriptNodeProcessor,
    setTargetLang: state.setTargetLang,
    setEnableExpressive: state.setEnableExpressive,
    setAgent: state.setAgent,
  });

  useEffect(() => {
    bufferedSpeechPlayer.setGain(getGainScaledValue(state.gain));
  }, [bufferedSpeechPlayer, state.gain]);

  const translationSentencesBase = getTranslationSentencesFromReceivedData(
    state.receivedData,
  );
  const translationSentencesBaseTotalLength = getTotalSentencesLength(
    translationSentencesBase,
  );
  const translationSentences: TranslationSentences = animateTextDisplay
    ? sliceTranslationSentencesUpToIndex(
        translationSentencesBase,
        state.translationSentencesAnimatedIndex,
      )
    : translationSentencesBase;

  useStreamingSocketListeners({
    socket,
    clientID,
    agent: state.agent,
    streamingStatus: state.streamingStatus,
    bufferedSpeechPlayer,
    receivedData: state.receivedData,
    animateTextDisplay,
    translationSentencesAnimatedIndex: state.translationSentencesAnimatedIndex,
    translationSentencesBaseTotalLength,
    lastTranslationResultRef: state.lastTranslationResultRef,
    setRoomState: state.setRoomState,
    setReceivedData: state.setReceivedData,
    setServerState: state.setServerState,
    setServerExceptions: state.setServerExceptions,
    setTranslationSentencesAnimatedIndex:
      state.setTranslationSentencesAnimatedIndex,
    setAgentAndUpdateParams: streamControls.setAgentAndUpdateParams,
    stopStreaming: streamControls.stopStreaming,
  });

  const onClearTranscriptForAll = useCallback(() => {
    socket?.emit('clear_transcript_for_all');
  }, [socket]);

  const xrDialogNode = (
    <XRDialog
      animateTextDisplay={
        animateTextDisplay &&
        state.translationSentencesAnimatedIndex ===
          translationSentencesBaseTotalLength
      }
      bufferedSpeechPlayer={bufferedSpeechPlayer}
      translationSentences={translationSentences}
      roomState={state.roomState}
      roomID={roomID}
      startStreaming={streamControls.startStreaming}
      stopStreaming={streamControls.stopStreaming}
      debugParam={debugParam}
      onARHidden={() => setAnimateTextDisplay(urlParams.animateTextDisplay)}
      onARVisible={() => setAnimateTextDisplay(false)}
    />
  );

  const translationSentencesWithEmptyStartingString =
    state.streamingStatus === 'running' && translationSentences.length === 0
      ? ['']
      : translationSentences;

  return (
    <div className="app-wrapper-sra">
      <Box sx={{width: '100%', maxWidth: '660px', minWidth: '320px'}}>
        <div className="main-container-sra">
          <StreamingInterfaceHeader
            roomState={state.roomState}
            serverState={state.serverState}
            streamingStatus={state.streamingStatus}
            isListener={isListener}
            isSpeaker={isSpeaker}
            gain={state.gain}
            bufferedSpeechPlayer={bufferedSpeechPlayer}
            onJoinRoom={() => bufferedSpeechPlayer.start()}
            onGainChange={state.setGain}
            speakerPanel={
              <StreamingSpeakerPanel
                streamFixedConfigOptionsDisabled={
                  state.streamingStatus !== 'stopped' || roomID == null
                }
                agentsCapabilities={agentsCapabilities}
                model={model}
                currentAgent={currentAgent}
                targetLang={state.targetLang}
                outputMode={state.outputMode}
                enableExpressive={state.enableExpressive}
                audioOutputDevices={virtualMic.audioOutputDevices}
                translationOutputDeviceId={virtualMic.translationOutputDeviceId}
                bufferedSpeechPlayer={bufferedSpeechPlayer}
                isListener={isListener}
                gain={state.gain}
                streamingStatus={state.streamingStatus}
                roomID={roomID}
                clientID={clientID}
                serverState={state.serverState}
                serverExceptions={state.serverExceptions}
                hasMaxSpeakers={state.hasMaxSpeakers}
                inputSource={state.inputSource}
                audioInputDevices={inputMic.audioInputDevices}
                inputDeviceId={inputMic.inputDeviceId}
                enableNoiseSuppression={state.enableNoiseSuppression}
                enableEchoCancellation={state.enableEchoCancellation}
                serverDebugFlag={state.serverDebugFlag}
                muted={state.muted}
                isSpeaker={isSpeaker}
                xrDialogNode={xrDialogNode}
                onModelChange={streamControls.setAgentAndUpdateParams}
                onTargetLangChange={state.setTargetLang}
                onOutputModeChange={state.setOutputMode}
                onExpressiveChange={state.setEnableExpressive}
                onOutputDeviceChange={virtualMic.setTranslationOutputDeviceId}
                onGainChange={state.setGain}
                onSetDynamicConfig={streamControls.onSetDynamicConfig}
                onInputSourceChange={state.setInputSource}
                onInputDeviceChange={inputMic.setInputDeviceId}
                onNoiseSuppressionChange={state.setEnableNoiseSuppression}
                onEchoCancellationChange={state.setEnableEchoCancellation}
                onServerDebugChange={state.setServerDebugFlag}
                onMutedToggle={() => state.setMuted((prev) => !prev)}
                onStartStreaming={() => void streamControls.startStreaming()}
                onStopStreaming={() => void streamControls.stopStreaming()}
              />
            }
            xrDialogNode={xrDialogNode}
          />
          {debugParam && roomID != null && <DebugSection />}
          <StreamingTranscript
            isSpeaker={isSpeaker}
            animateTextDisplay={animateTextDisplay}
            roomState={state.roomState}
            translationSentences={translationSentencesWithEmptyStartingString}
            lastTranslationResultRef={state.lastTranslationResultRef}
            onClearTranscriptForAll={onClearTranscriptForAll}
          />
        </div>
      </Box>
    </div>
  );
}
