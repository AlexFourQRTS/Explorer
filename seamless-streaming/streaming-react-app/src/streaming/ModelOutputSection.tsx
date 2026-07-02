import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Switch from '@mui/material/Switch';
import {
  AgentCapabilities,
  PartialDynamicConfig,
  SUPPORTED_OUTPUT_MODES,
  SupportedOutputMode,
} from '../types/StreamingTypes';
import {getLanguageFromThreeLetterCode} from '../languageLookup';
import {AudioOutputOption} from '../audioOutputDevices';
import {VirtualMicControls} from './VirtualMicControls';
import {StreamingVolumeSlider} from './StreamingVolumeSlider';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import {ru} from '../i18n/ru';

type ModelOutputSectionProps = {
  streamFixedConfigOptionsDisabled: boolean;
  agentsCapabilities: Array<AgentCapabilities>;
  model: string | null;
  currentAgent: AgentCapabilities | null;
  targetLang: string | null;
  outputMode: SupportedOutputMode;
  enableExpressive: boolean | null;
  isListener: boolean;
  gain: number;
  audioOutputDevices: AudioOutputOption[];
  translationOutputDeviceId: string;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  onModelChange: (agent: AgentCapabilities | null) => void;
  onTargetLangChange: (lang: string) => void;
  onOutputModeChange: (mode: SupportedOutputMode) => void;
  onExpressiveChange: (expressive: boolean) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onGainChange: (gain: number) => void;
  onSetDynamicConfig: (partialConfig: PartialDynamicConfig) => Promise<void>;
};

export function ModelOutputSection({
  streamFixedConfigOptionsDisabled,
  agentsCapabilities,
  model,
  currentAgent,
  targetLang,
  outputMode,
  enableExpressive,
  isListener,
  gain,
  audioOutputDevices,
  translationOutputDeviceId,
  bufferedSpeechPlayer,
  onModelChange,
  onTargetLangChange,
  onOutputModeChange,
  onExpressiveChange,
  onOutputDeviceChange,
  onGainChange,
  onSetDynamicConfig,
}: ModelOutputSectionProps) {
  return (
    <>
      <Stack spacing="12px" direction="column">
        <FormLabel id="model-selector-label">{ru.model}</FormLabel>
        <FormControl
          disabled={
            streamFixedConfigOptionsDisabled || agentsCapabilities.length === 0
          }
          fullWidth
          sx={{minWidth: '14em'}}>
          <InputLabel id="model-selector-input-label">{ru.model}</InputLabel>
          <Select
            labelId="model-selector-input-label"
            label={ru.model}
            onChange={(e: SelectChangeEvent) => {
              const newAgent =
                agentsCapabilities.find(
                  (agent) => e.target.value === agent.name,
                ) ?? null;
              if (newAgent == null) {
                console.error('Unable to find agent with name', e.target.value);
              }
              onModelChange(newAgent);
            }}
            value={model ?? ''}>
            {agentsCapabilities.map((agent) => (
              <MenuItem value={agent.name} key={agent.name}>
                {agent.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack spacing={0.5}>
        <FormLabel id="output-modes-radio-group-label">{ru.output}</FormLabel>

        <Box sx={{paddingTop: 2, paddingBottom: 1}}>
          <FormControl fullWidth sx={{minWidth: '14em'}}>
            <InputLabel id="target-selector-input-label">
              {ru.targetLanguage}
            </InputLabel>
            <Select
              labelId="target-selector-input-label"
              label={ru.targetLanguage}
              onChange={(e: SelectChangeEvent) => {
                onTargetLangChange(e.target.value);
                void onSetDynamicConfig({targetLanguage: e.target.value});
              }}
              value={targetLang ?? ''}>
              {currentAgent?.targetLangs.map((langCode) => (
                <MenuItem value={langCode} key={langCode}>
                  {getLanguageFromThreeLetterCode(langCode) != null
                    ? `${getLanguageFromThreeLetterCode(langCode)} (${langCode})`
                    : langCode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <VirtualMicControls
          disabled={streamFixedConfigOptionsDisabled}
          outputMode={outputMode}
          audioOutputDevices={audioOutputDevices}
          translationOutputDeviceId={translationOutputDeviceId}
          onOutputDeviceChange={onOutputDeviceChange}
        />

        <Grid container>
          <Grid item xs={12} sm={4}>
            <FormControl disabled={streamFixedConfigOptionsDisabled}>
              <RadioGroup
                aria-labelledby="output-modes-radio-group-label"
                value={outputMode}
                onChange={(e) =>
                  onOutputModeChange(e.target.value as SupportedOutputMode)
                }
                name="output-modes-radio-buttons-group">
                {SUPPORTED_OUTPUT_MODES.map(({value, label}) => (
                  <FormControlLabel
                    key={value}
                    value={value}
                    control={<Radio />}
                    label={label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={8}>
            <Stack direction="column" spacing={1} alignItems="flex-start">
              {currentAgent?.dynamicParams?.includes('expressive') && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableExpressive ?? false}
                      onChange={(event) => {
                        const newValue = event.target.checked;
                        onExpressiveChange(newValue);
                        void onSetDynamicConfig({expressive: newValue});
                      }}
                    />
                  }
                  label={ru.expressive}
                />
              )}

              {isListener && (
                <Box sx={{paddingX: 1.5, paddingY: 1.5, width: '100%'}}>
                  <StreamingVolumeSlider
                    gain={gain}
                    onGainChange={onGainChange}
                    bufferedSpeechPlayer={bufferedSpeechPlayer}
                  />
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
