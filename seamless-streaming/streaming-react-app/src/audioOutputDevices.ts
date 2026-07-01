export type AudioOutputOption = {
  deviceId: string;
  label: string;
};

const DEFAULT_OUTPUT: AudioOutputOption = {
  deviceId: 'default',
  label: 'System default',
};

export async function listAudioOutputDevices(): Promise<AudioOutputOption[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const outputs = devices
    .filter((device) => device.kind === 'audiooutput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Output ${device.deviceId.slice(0, 8)}`,
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
    /blackhole|vb-?audio|cable input|virtual/i.test(device.label),
  );
}

export function supportsAudioSinkSelection(): boolean {
  return typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype;
}
