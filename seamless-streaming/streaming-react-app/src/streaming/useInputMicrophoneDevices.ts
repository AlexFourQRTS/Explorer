import {useEffect, useState} from 'react';
import {AudioInputOption, listAudioInputDevices} from '../audioInputDevices';
import {ru} from '../i18n/ru';

type UseInputMicrophoneDevicesResult = {
  audioInputDevices: AudioInputOption[];
  inputDeviceId: string;
  setInputDeviceId: (deviceId: string) => void;
};

export function useInputMicrophoneDevices(): UseInputMicrophoneDevicesResult {
  const [audioInputDevices, setAudioInputDevices] = useState<AudioInputOption[]>(
    [{deviceId: 'default', label: ru.systemDefault}],
  );
  const [inputDeviceId, setInputDeviceId] = useState('default');

  useEffect(() => {
    const loadInputDevices = async () => {
      try {
        const permissionStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        permissionStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.warn('[useInputMicrophoneDevices] mic permission denied', error);
        return;
      }

      const devices = await listAudioInputDevices();
      setAudioInputDevices(devices);
    };

    void loadInputDevices();
  }, []);

  return {
    audioInputDevices,
    inputDeviceId,
    setInputDeviceId,
  };
}
