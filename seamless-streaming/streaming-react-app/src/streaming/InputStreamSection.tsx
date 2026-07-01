import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import Mic from '@mui/icons-material/Mic';
import MicOff from '@mui/icons-material/MicOff';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import {
  ServerExceptionData,
  ServerState,
  StreamingStatus,
  SUPPORTED_INPUT_SOURCES,
  SupportedInputSource,
} from '../types/StreamingTypes';
import {
  AUDIO_STREAM_DEFAULTS,
  STREAMING_BUTTON_LABELS,
  TOTAL_ACTIVE_TRANSCODER_WARNING_THRESHOLD,
} from './streamingInterfaceConstants';

type InputStreamSectionProps = {
  streamFixedConfigOptionsDisabled: boolean;
  streamingStatus: StreamingStatus;
  roomID: string | null;
  clientID: string | null;
  serverState: ServerState | null;
  serverExceptions: Array<ServerExceptionData>;
  hasMaxSpeakers: boolean;
  inputSource: SupportedInputSource;
  enableNoiseSuppression: boolean | null;
  enableEchoCancellation: boolean | null;
  serverDebugFlag: boolean;
  muted: boolean;
  isSpeaker: boolean;
  isListener: boolean;
  gain: number;
  xrDialogNode: React.ReactNode;
  onInputSourceChange: (source: SupportedInputSource) => void;
  onNoiseSuppressionChange: (enabled: boolean) => void;
  onEchoCancellationChange: (enabled: boolean) => void;
  onServerDebugChange: (enabled: boolean) => void;
  onMutedToggle: () => void;
  onStartStreaming: () => void;
  onStopStreaming: () => void;
};

export function InputStreamSection({
  streamFixedConfigOptionsDisabled,
  streamingStatus,
  roomID,
  clientID,
  serverState,
  serverExceptions,
  hasMaxSpeakers,
  inputSource,
  enableNoiseSuppression,
  enableEchoCancellation,
  serverDebugFlag,
  muted,
  isSpeaker,
  isListener,
  gain,
  xrDialogNode,
  onInputSourceChange,
  onNoiseSuppressionChange,
  onEchoCancellationChange,
  onServerDebugChange,
  onMutedToggle,
  onStartStreaming,
  onStopStreaming,
}: InputStreamSectionProps) {
  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Box sx={{flex: 1}}>
          <FormControl disabled={streamFixedConfigOptionsDisabled}>
            <FormLabel id="input-source-radio-group-label">Input Source</FormLabel>
            <RadioGroup
              aria-labelledby="input-source-radio-group-label"
              value={inputSource}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onInputSourceChange(e.target.value as SupportedInputSource)
              }
              name="input-source-radio-buttons-group">
              {SUPPORTED_INPUT_SOURCES.map(({label, value}) => (
                <FormControlLabel
                  key={value}
                  value={value}
                  control={<Radio />}
                  label={label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{flex: 1, flexGrow: 2}}>
          <FormControl disabled={streamFixedConfigOptionsDisabled}>
            <FormLabel>Options</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    enableNoiseSuppression ??
                    AUDIO_STREAM_DEFAULTS[inputSource].noiseSuppression
                  }
                  onChange={(event) =>
                    onNoiseSuppressionChange(event.target.checked)
                  }
                />
              }
              label="Noise Suppression"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    enableEchoCancellation ??
                    AUDIO_STREAM_DEFAULTS[inputSource].echoCancellation
                  }
                  onChange={(event) =>
                    onEchoCancellationChange(event.target.checked)
                  }
                />
              }
              label="Echo Cancellation (not recommended)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={serverDebugFlag}
                  onChange={(event) => onServerDebugChange(event.target.checked)}
                />
              }
              label="Enable Server Debugging"
            />
          </FormControl>
        </Box>
      </Stack>

      {isSpeaker &&
        isListener &&
        inputSource === 'userMedia' &&
        !enableEchoCancellation &&
        gain !== 0 && (
          <Alert severity="warning" icon={<HeadphonesIcon />}>
            Headphones required to prevent feedback.
          </Alert>
        )}

      {isSpeaker && enableEchoCancellation && (
        <Alert severity="warning">
          We don&apos;t recommend using echo cancellation as it may distort the
          input audio. If possible, use headphones and disable echo cancellation
          instead.
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        {streamingStatus === 'stopped' ? (
          <Button
            variant="contained"
            onClick={onStartStreaming}
            disabled={
              roomID == null ||
              (serverState?.serverLock?.isActive === true &&
                serverState.serverLock.clientID !== clientID)
            }>
            {STREAMING_BUTTON_LABELS[streamingStatus]}
          </Button>
        ) : (
          <Button
            variant="contained"
            color={streamingStatus === 'running' ? 'error' : 'primary'}
            disabled={streamingStatus === 'starting' || roomID == null}
            onClick={onStopStreaming}>
            {STREAMING_BUTTON_LABELS[streamingStatus]}
          </Button>
        )}

        <Button
          variant="contained"
          aria-label={muted ? 'Unmute' : 'Mute'}
          color={muted ? 'info' : 'primary'}
          onClick={onMutedToggle}
          sx={{borderRadius: 100, paddingX: 0, minWidth: '36px'}}>
          {muted ? <MicOff /> : <Mic />}
        </Button>

        {roomID != null && (
          <Box sx={{flexGrow: 1, display: 'flex', justifyContent: 'flex-end'}}>
            {xrDialogNode}
          </Box>
        )}
      </Stack>

      {serverExceptions.length > 0 && (
        <Alert severity="error">
          The server encountered an exception. See the browser console for
          details. You may need to refresh the page to continue using the app.
        </Alert>
      )}

      {serverState != null && hasMaxSpeakers && (
        <Alert severity="error">
          Maximum number of speakers reached. Please try again at a later time.
        </Alert>
      )}

      {serverState != null &&
        serverState.totalActiveTranscoders >=
          TOTAL_ACTIVE_TRANSCODER_WARNING_THRESHOLD && (
          <Alert severity="warning">
            {`The server currently has ${serverState.totalActiveTranscoders} active streaming sessions. Performance may be degraded.`}
          </Alert>
        )}

      {serverState?.serverLock != null &&
        serverState.serverLock.clientID !== clientID && (
          <Alert severity="warning">
            The server is currently locked. Priority will be given to that
            client when they are streaming, and your streaming session may be
            halted abruptly.
          </Alert>
        )}
    </>
  );
}
