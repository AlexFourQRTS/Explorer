import {ru} from './ru';
import type {SupportedInputSource, SupportedOutputMode} from '../types/StreamingTypes';

export const INPUT_SOURCE_LABELS: Record<SupportedInputSource, string> = {
  userMedia: ru.inputMicrophone,
  displayMedia: ru.inputBrowserTab,
};

export const OUTPUT_MODE_LABELS: Record<SupportedOutputMode, string> = {
  's2s&t': ru.outputTextAndSpeech,
  s2t: ru.outputText,
  s2s: ru.outputSpeech,
};

export const STREAMING_BUTTON_LABELS = {
  stopped: ru.startStreaming,
  running: ru.stopStreaming,
  starting: ru.starting,
} as const;
