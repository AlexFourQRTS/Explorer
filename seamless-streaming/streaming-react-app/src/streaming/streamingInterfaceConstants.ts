import {BrowserAudioStreamConfig, StreamingStatus} from '../types/StreamingTypes';

export const AUDIO_STREAM_DEFAULTS = {
  userMedia: {
    echoCancellation: false,
    noiseSuppression: true,
  },
  displayMedia: {
    echoCancellation: false,
    noiseSuppression: false,
  },
} as const satisfies Record<string, BrowserAudioStreamConfig>;

export const STREAMING_BUTTON_LABELS: {[key in StreamingStatus]: string} = {
  stopped: 'Start Streaming',
  running: 'Stop Streaming',
  starting: 'Starting...',
};

export const BUFFER_LIMIT = 1;
export const SCROLLED_TO_BOTTOM_THRESHOLD_PX = 36;
export const TOTAL_ACTIVE_TRANSCODER_WARNING_THRESHOLD = 2;
export const MAX_SERVER_EXCEPTIONS_TRACKED = 500;
export const TYPING_ANIMATION_DELAY_MS = 6;
