import {useEffect, useState} from 'react';
import {AudioOutputOption, listAudioOutputDevices} from '../audioOutputDevices';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import {ru} from '../i18n/ru';

type UseVirtualMicDevicesParams = {
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  inputStream: MediaStream | null;
};

type UseVirtualMicDevicesResult = {
  audioOutputDevices: AudioOutputOption[];
  translationOutputDeviceId: string;
  setTranslationOutputDeviceId: (deviceId: string) => void;
};

export function useVirtualMicDevices({
  bufferedSpeechPlayer,
  inputStream,
}: UseVirtualMicDevicesParams): UseVirtualMicDevicesResult {
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    AudioOutputOption[]
  >([{deviceId: 'default', label: ru.systemDefault}]);
  const [translationOutputDeviceId, setTranslationOutputDeviceId] =
    useState('default');

  useEffect(() => {
    const loadOutputDevices = async () => {
      const devices = await listAudioOutputDevices();
      setAudioOutputDevices(devices);
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
  };
}
