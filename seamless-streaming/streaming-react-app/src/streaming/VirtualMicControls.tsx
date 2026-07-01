import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {
  AudioOutputOption,
  findVirtualMicDevice,
  supportsAudioSinkSelection,
} from '../audioOutputDevices';
import {SupportedOutputMode} from '../types/StreamingTypes';
import {runBlackHoleInstall} from './electronBridge';

type VirtualMicControlsProps = {
  disabled: boolean;
  outputMode: SupportedOutputMode;
  audioOutputDevices: AudioOutputOption[];
  translationOutputDeviceId: string;
  onOutputDeviceChange: (deviceId: string) => void;
  blackHoleInstalled: boolean | null;
  installingVirtualMic: boolean;
  onInstallingChange: (installing: boolean) => void;
};

export function VirtualMicControls({
  disabled,
  outputMode,
  audioOutputDevices,
  translationOutputDeviceId,
  onOutputDeviceChange,
  blackHoleInstalled,
  installingVirtualMic,
  onInstallingChange,
}: VirtualMicControlsProps) {
  return (
    <>
      <Box sx={{paddingBottom: 1}}>
        <FormControl fullWidth sx={{minWidth: '14em'}} disabled={disabled}>
          <InputLabel id="translation-output-label">Virtual microphone</InputLabel>
          <Select
            labelId="translation-output-label"
            label="Virtual microphone"
            value={translationOutputDeviceId}
            onChange={(e: SelectChangeEvent) =>
              onOutputDeviceChange(e.target.value)
            }>
            {audioOutputDevices.map((device) => (
              <MenuItem value={device.deviceId} key={device.deviceId}>
                {device.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {blackHoleInstalled === false && (
        <Alert severity="warning" sx={{mb: 1}}>
          Virtual mic driver not installed. STREEM sends translation into
          BlackHole; Zoom uses BlackHole as mic.
          <Box sx={{mt: 1}}>
            <Button
              size="small"
              variant="contained"
              disabled={installingVirtualMic}
              onClick={async () => {
                onInstallingChange(true);
                try {
                  await runBlackHoleInstall();
                } finally {
                  onInstallingChange(false);
                }
              }}>
              {installingVirtualMic ? 'Opening installer…' : 'Install BlackHole'}
            </Button>
          </Box>
        </Alert>
      )}

      {blackHoleInstalled === true &&
        findVirtualMicDevice(audioOutputDevices) == null && (
          <Alert severity="info" sx={{mb: 1}}>
            BlackHole installed. Restart STREEM, then pick BlackHole 2ch here. In
            Zoom: Microphone → BlackHole 2ch.
          </Alert>
        )}

      {!supportsAudioSinkSelection() && (
        <Alert severity="warning" sx={{mb: 1}}>
          This browser cannot route audio to a virtual device.
        </Alert>
      )}

      {outputMode === 's2t' && (
        <Alert severity="warning" sx={{mb: 1}}>
          Virtual mic needs Speech or Text &amp; Speech output.
        </Alert>
      )}
    </>
  );
}
