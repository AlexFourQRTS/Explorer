import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import seamlessLogoUrl from '../assets/seamless.svg';
import RoomConfig from '../RoomConfig';
import {RoomState} from '../types/RoomState';
import {ServerState, StreamingStatus} from '../types/StreamingTypes';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import {StreamingVolumeSlider} from './StreamingVolumeSlider';
import {ModelOutputSection} from './ModelOutputSection';
import {InputStreamSection} from './InputStreamSection';
import {AgentCapabilities, ServerExceptionData, SupportedInputSource, SupportedOutputMode} from '../types/StreamingTypes';
import {PartialDynamicConfig} from '../types/StreamingTypes';
import {AudioOutputOption} from '../audioOutputDevices';
import {AudioInputOption} from '../audioInputDevices';
import {ru} from '../i18n/ru';

type StreamingSpeakerPanelProps = {
  streamFixedConfigOptionsDisabled: boolean;
  agentsCapabilities: Array<AgentCapabilities>;
  model: string | null;
  currentAgent: AgentCapabilities | null;
  targetLang: string | null;
  outputMode: SupportedOutputMode;
  enableExpressive: boolean | null;
  audioOutputDevices: AudioOutputOption[];
  translationOutputDeviceId: string;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  gain: number;
  streamingStatus: StreamingStatus;
  roomID: string | null;
  clientID: string | null;
  serverState: ServerState | null;
  serverExceptions: Array<ServerExceptionData>;
  hasMaxSpeakers: boolean;
  inputSource: SupportedInputSource;
  audioInputDevices: AudioInputOption[];
  inputDeviceId: string;
  enableNoiseSuppression: boolean | null;
  enableEchoCancellation: boolean | null;
  serverDebugFlag: boolean;
  muted: boolean;
  isSpeaker: boolean;
  isListener: boolean;
  xrDialogNode: React.ReactNode;
  onModelChange: (agent: AgentCapabilities | null) => void;
  onTargetLangChange: (lang: string) => void;
  onOutputModeChange: (mode: SupportedOutputMode) => void;
  onExpressiveChange: (expressive: boolean) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onGainChange: (gain: number) => void;
  onSetDynamicConfig: (partialConfig: PartialDynamicConfig) => Promise<void>;
  onInputSourceChange: (source: SupportedInputSource) => void;
  onInputDeviceChange: (deviceId: string) => void;
  onNoiseSuppressionChange: (enabled: boolean) => void;
  onEchoCancellationChange: (enabled: boolean) => void;
  onServerDebugChange: (enabled: boolean) => void;
  onMutedToggle: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
};

export function StreamingSpeakerPanel(props: StreamingSpeakerPanelProps) {
  return (
    <>
      <Divider />
      <ModelOutputSection
        streamFixedConfigOptionsDisabled={props.streamFixedConfigOptionsDisabled}
        agentsCapabilities={props.agentsCapabilities}
        model={props.model}
        currentAgent={props.currentAgent}
        targetLang={props.targetLang}
        outputMode={props.outputMode}
        enableExpressive={props.enableExpressive}
        isListener={props.isListener}
        gain={props.gain}
        audioOutputDevices={props.audioOutputDevices}
        translationOutputDeviceId={props.translationOutputDeviceId}
        bufferedSpeechPlayer={props.bufferedSpeechPlayer}
        onModelChange={props.onModelChange}
        onTargetLangChange={props.onTargetLangChange}
        onOutputModeChange={props.onOutputModeChange}
        onExpressiveChange={props.onExpressiveChange}
        onOutputDeviceChange={props.onOutputDeviceChange}
        onGainChange={props.onGainChange}
        onSetDynamicConfig={props.onSetDynamicConfig}
      />
      <InputStreamSection
        streamFixedConfigOptionsDisabled={props.streamFixedConfigOptionsDisabled}
        streamingStatus={props.streamingStatus}
        roomID={props.roomID}
        clientID={props.clientID}
        serverState={props.serverState}
        serverExceptions={props.serverExceptions}
        hasMaxSpeakers={props.hasMaxSpeakers}
        inputSource={props.inputSource}
        audioInputDevices={props.audioInputDevices}
        inputDeviceId={props.inputDeviceId}
        enableNoiseSuppression={props.enableNoiseSuppression}
        enableEchoCancellation={props.enableEchoCancellation}
        serverDebugFlag={props.serverDebugFlag}
        muted={props.muted}
        isSpeaker={props.isSpeaker}
        isListener={props.isListener}
        gain={props.gain}
        xrDialogNode={props.xrDialogNode}
        onInputSourceChange={props.onInputSourceChange}
        onInputDeviceChange={props.onInputDeviceChange}
        onNoiseSuppressionChange={props.onNoiseSuppressionChange}
        onEchoCancellationChange={props.onEchoCancellationChange}
        onServerDebugChange={props.onServerDebugChange}
        onMutedToggle={props.onMutedToggle}
        onStartStreaming={props.onStartStreaming}
        onStopStreaming={props.onStopStreaming}
      />
    </>
  );
}

type StreamingInterfaceHeaderProps = {
  roomState: RoomState | null;
  serverState: ServerState | null;
  streamingStatus: StreamingStatus;
  isListener: boolean;
  isSpeaker: boolean;
  gain: number;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  onJoinRoom: () => void;
  onGainChange: (gain: number) => void;
  speakerPanel: React.ReactNode;
  xrDialogNode: React.ReactNode;
};

export function StreamingInterfaceHeader({
  roomState,
  serverState,
  streamingStatus,
  isListener,
  isSpeaker,
  gain,
  bufferedSpeechPlayer,
  onJoinRoom,
  onGainChange,
  speakerPanel,
  xrDialogNode,
}: StreamingInterfaceHeaderProps) {
  return (
    <div className="top-section-sra horizontal-padding-sra">
      <div className="header-container-sra">
        <img
          src={seamlessLogoUrl}
          className="header-icon-sra"
          alt={ru.appTitle}
          height={24}
          width={24}
        />
        <Typography variant="h1" sx={{color: '#65676B'}}>
          {ru.appTitle}
        </Typography>
      </div>
      <Typography variant="body2" sx={{color: '#65676B'}}>
        {ru.appSubtitle}
      </Typography>

      <Stack spacing="22px" direction="column">
        <Box>
          <RoomConfig
            roomState={roomState}
            serverState={serverState}
            streamingStatus={streamingStatus}
            onJoinRoomOrUpdateRoles={onJoinRoom}
          />
          {isListener && !isSpeaker && (
            <Box sx={{paddingX: 6, paddingBottom: 2, marginY: 2}}>
              <StreamingVolumeSlider
                gain={gain}
                onGainChange={onGainChange}
                bufferedSpeechPlayer={bufferedSpeechPlayer}
              />
            </Box>
          )}
        </Box>
        {isSpeaker && speakerPanel}
      </Stack>

      {isListener && !isSpeaker && (
        <Box sx={{marginBottom: 1, marginTop: 2}}>{xrDialogNode}</Box>
      )}
    </div>
  );
}
