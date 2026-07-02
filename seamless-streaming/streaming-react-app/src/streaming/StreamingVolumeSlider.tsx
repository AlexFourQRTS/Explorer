import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import {getGainScaledValue} from './streamingGain';
import {ru} from '../i18n/ru';

type StreamingVolumeSliderProps = {
  gain: number;
  onGainChange: (gain: number) => void;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
};

export function StreamingVolumeSlider({
  gain,
  onGainChange,
  bufferedSpeechPlayer,
}: StreamingVolumeSliderProps) {
  return (
    <Stack
      spacing={2}
      direction="row"
      sx={{mb: 1, width: '100%'}}
      alignItems="center">
      <VolumeDown color="primary" />
      <Slider
        aria-label={ru.volume}
        defaultValue={1}
        scale={getGainScaledValue}
        min={0}
        max={3}
        step={0.1}
        marks={[
          {value: 0, label: '0%'},
          {value: 1, label: '100%'},
          {value: 2, label: '400%'},
          {value: 3, label: '700%'},
        ]}
        valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
        valueLabelDisplay="auto"
        value={gain}
        onChange={(_event: Event, newValue: number | number[]) => {
          if (typeof newValue !== 'number') {
            console.error(
              `[volume slider] Unexpected non-number value: ${newValue}`,
            );
            return;
          }
          bufferedSpeechPlayer.setGain(getGainScaledValue(newValue));
          onGainChange(newValue);
        }}
      />
      <VolumeUp color="primary" />
    </Stack>
  );
}
