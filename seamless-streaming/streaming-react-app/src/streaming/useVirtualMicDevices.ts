import {useEffect, useRef, useState} from 'react';
import {
  AudioOutputOption,
  findVirtualMicDevice,
  listAudioOutputDevices,
} from '../audioOutputDevices';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import {checkBlackHoleInstalled} from './electronBridge';

type UseVirtualMicDevicesParams = {
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  inputStream: MediaStream | null;
};

type UseVirtualMicDevicesResult = {
  audioOutputDevices: AudioOutputOption[];
  translationOutputDeviceId: string;
  setTranslationOutputDeviceId: (deviceId: string) => void;
  blackHoleInstalled: boolean | null;
  installingVirtualMic: boolean;
  setInstallingVirtualMic: (installing: boolean) => void;
};

export function useVirtualMicDevices({
  bufferedSpeechPlayer,
  inputStream,
}: UseVirtualMicDevicesParams): UseVirtualMicDevicesResult {
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    AudioOutputOption[]
  >([{deviceId: 'default', label: 'System default'}]);
  const [translationOutputDeviceId, setTranslationOutputDeviceId] =
    useState('default');
  const [blackHoleInstalled, setBlackHoleInstalled] = useState<boolean | null>(
    null,
  );
  const [installingVirtualMic, setInstallingVirtualMic] = useState(false);
  const autoSelectVirtualMicRef = useRef(true);

  useEffect(() => {
    void checkBlackHoleInstalled().then(setBlackHoleInstalled);
  }, []);

  useEffect(() => {
    const loadOutputDevices = async () => {
      const devices = await listAudioOutputDevices();
      setAudioOutputDevices(devices);

      if (!autoSelectVirtualMicRef.current) {
        return;
      }
      const virtualMic = findVirtualMicDevice(devices);
      if (virtualMic != null) {
        setTranslationOutputDeviceId(virtualMic.deviceId);
      }
      autoSelectVirtualMicRef.current = false;
    };

    void loadOutputDevices();
  }, [inputStream]);

  useEffect(() => {
    void bufferedSpeechPlayer.setOutputDevice(translationOutputDeviceId);
  }, [bufferedSpeechPlayer, translationOutputDeviceId]);

  return {
    audioOutputDevices,
    translationOutputDeviceId,
    setTranslationOutputDeviceId,
    blackHoleInstalled,
    installingVirtualMic,
    setInstallingVirtualMic,
  };
}
