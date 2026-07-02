import {ru} from './i18n/ru';

export type AudioOutputOption = {
  deviceId: string;
  label: string;
};

const DEFAULT_OUTPUT: AudioOutputOption = {
  deviceId: 'default',
  label: ru.systemDefault,
};

export async function listAudioOutputDevices(): Promise<AudioOutputOption[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const outputs = devices
    .filter((device) => device.kind === 'audiooutput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || ru.outputFallback(device.deviceId),
    }));

  if (outputs.length === 0) {
    return [DEFAULT_OUTPUT];
  }

  return [DEFAULT_OUTPUT, ...outputs.filter((d) => d.deviceId !== 'default')];
}

export function findVirtualMicDevice(
  devices: AudioOutputOption[],
): AudioOutputOption | undefined {
  return devices.find((device) =>
    /blackhole|vb-?audio|cable\s*input|virtual\s*cable|cable\s*\(/i.test(
      device.label,
    ),
  );
}

export function supportsAudioSinkSelection(): boolean {
  return typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype;
}
