import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {AudioOutputOption, supportsAudioSinkSelection} from '../audioOutputDevices';
import {SupportedOutputMode} from '../types/StreamingTypes';
import {ru} from '../i18n/ru';

type VirtualMicControlsProps = {
  disabled: boolean;
  outputMode: SupportedOutputMode;
  audioOutputDevices: AudioOutputOption[];
  translationOutputDeviceId: string;
  onOutputDeviceChange: (deviceId: string) => void;
};

export function VirtualMicControls({
  disabled,
  outputMode,
  audioOutputDevices,
  translationOutputDeviceId,
  onOutputDeviceChange,
}: VirtualMicControlsProps) {
  return (
    <>
      <Box sx={{paddingBottom: 1}}>
        <FormControl fullWidth sx={{minWidth: '14em'}} disabled={disabled}>
          <InputLabel id="translation-output-label">
            {ru.audioOutputDevice}
          </InputLabel>
          <Select
            labelId="translation-output-label"
            label={ru.audioOutputDevice}
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

      {!supportsAudioSinkSelection() && (
        <Alert severity="warning" sx={{mb: 1}}>
          {ru.sinkNotSupported}
        </Alert>
      )}

      {outputMode === 's2t' && (
        <Alert severity="info" sx={{mb: 1}}>
          {ru.speechRequiredForOutput}
        </Alert>
      )}
    </>
  );
}
