import {BrowserAudioStreamConfig} from '../types/StreamingTypes';
import {AUDIO_STREAM_DEFAULTS} from './streamingInterfaceConstants';

export async function requestUserMediaAudioStream(
  config: BrowserAudioStreamConfig = AUDIO_STREAM_DEFAULTS.userMedia,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {...config, channelCount: 1},
  });
  console.debug(
    '[requestUserMediaAudioStream] stream created with settings:',
    stream.getAudioTracks()?.[0]?.getSettings(),
  );
  return stream;
}

export async function requestDisplayMediaAudioStream(
  config: BrowserAudioStreamConfig = AUDIO_STREAM_DEFAULTS.displayMedia,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: {...config, channelCount: 1},
  });
  console.debug(
    '[requestDisplayMediaAudioStream] stream created with settings:',
    stream.getAudioTracks()?.[0]?.getSettings(),
  );
  return stream;
}
