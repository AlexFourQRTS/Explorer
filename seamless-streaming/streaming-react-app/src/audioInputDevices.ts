import {ru} from './i18n/ru';

export type AudioInputOption = {
  deviceId: string;
  label: string;
};

const DEFAULT_INPUT: AudioInputOption = {
  deviceId: 'default',
  label: ru.systemDefault,
};

const LOOPBACK_INPUT_PATTERN =
  /stereo mix|loopback|what u hear|wave out|\bcable output\b|blackhole|virtual cable|vb-audio output|speakers \(/i;

export function isLoopbackInput(label: string): boolean {
  return LOOPBACK_INPUT_PATTERN.test(label);
}

export async function listAudioInputDevices(): Promise<AudioInputOption[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices
    .filter((device) => device.kind === 'audioinput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || ru.microphoneFallback(device.deviceId),
    }));

  if (inputs.length === 0) {
    return [DEFAULT_INPUT];
  }

  return [DEFAULT_INPUT, ...inputs.filter((d) => d.deviceId !== 'default')];
}

/** Prefer a real microphone; skip Stereo Mix / virtual-cable loopback inputs. */
export function findPreferredMicrophone(
  devices: AudioInputOption[],
): AudioInputOption | undefined {
  const candidates = devices.filter(
    (device) => device.deviceId !== 'default' && !isLoopbackInput(device.label),
  );

  const namedMic = candidates.find((device) =>
    /microphone|mic array|headset|webcam|realtek/i.test(device.label),
  );

  return namedMic ?? candidates[0];
}
