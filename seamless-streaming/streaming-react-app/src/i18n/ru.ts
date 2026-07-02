export const ru = {
  appTitle: 'Перевод STREEM',
  appSubtitle: 'Микрофон → перевод → выбранное устройство вывода',

  roomCode: 'Код комнаты',
  joinRoom: 'Войти в комнату',
  updateRoles: 'Обновить роли',
  createNewRoom: 'Создать комнату',
  roleSpeaker: 'Диктор',
  roleListener: 'Слушатель',

  model: 'Модель',
  output: 'Вывод',
  targetLanguage: 'Язык перевода',
  audioInputDevice: 'Устройство ввода',
  audioOutputDevice: 'Устройство вывода',
  outputTextAndSpeech: 'Текст и речь',
  outputText: 'Текст',
  outputSpeech: 'Речь',
  expressive: 'Эмоциональность',

  inputSource: 'Источник звука',
  inputMicrophone: 'Микрофон',
  inputBrowserTab: 'Вкладка браузера (только Chrome)',
  microphoneYourVoice: 'Устройство ввода',
  options: 'Параметры',
  noiseSuppression: 'Шумоподавление',
  echoCancellation: 'Эхоподавление (не рекомендуется)',
  serverDebug: 'Отладка сервера',
  headphonesWarning: 'Нужны наушники, иначе будет обратная связь.',
  echoWarning:
    'Эхоподавление может искажать звук. Лучше наушники и выключенное эхоподавление.',

  startStreaming: 'Начать трансляцию',
  stopStreaming: 'Остановить',
  starting: 'Запуск…',

  sinkNotSupported: 'Браузер не может направить звук на выбранное устройство.',
  speechRequiredForOutput:
    'Для звука перевода выберите режим «Речь» или «Текст и речь».',

  transcript: 'Транскрипт',
  clearTranscript: 'Очистить для всех',

  systemDefault: 'Системный по умолчанию',
  microphoneFallback: (id: string) => `Микрофон ${id.slice(0, 8)}`,
  outputFallback: (id: string) => `Выход ${id.slice(0, 8)}`,

  serverException:
    'Ошибка на сервере. Смотрите консоль браузера. Возможно, нужно обновить страницу.',
  maxSpeakers: 'Достигнут лимит дикторов. Попробуйте позже.',
  serverLoadWarning: (n: number) =>
    `На сервере ${n} активных сессий. Возможны задержки.`,
  serverLocked:
    'Сервер занят другим клиентом. Вашу трансляцию могут прервать.',

  volume: 'Громкость',
} as const;
