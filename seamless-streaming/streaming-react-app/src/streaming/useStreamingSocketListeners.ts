import {useEffect, useLayoutEffect, useRef} from 'react';
import {Socket} from 'socket.io-client';
import {
  AgentCapabilities,
  ServerExceptionData,
  ServerSpeechData,
  ServerState,
  ServerTextData,
  StreamingStatus,
} from '../types/StreamingTypes';
import {RoomState} from '../types/RoomState';
import {BufferedSpeechPlayer} from '../createBufferedSpeechPlayer';
import debug from '../debug';
import isScrolledToDocumentBottom from '../isScrolledToDocumentBottom';
import {
  MAX_SERVER_EXCEPTIONS_TRACKED,
  SCROLLED_TO_BOTTOM_THRESHOLD_PX,
  TYPING_ANIMATION_DELAY_MS,
} from './streamingInterfaceConstants';

type UseStreamingSocketListenersParams = {
  socket: Socket | null;
  clientID: string | null;
  agent: AgentCapabilities | null;
  streamingStatus: StreamingStatus;
  bufferedSpeechPlayer: BufferedSpeechPlayer;
  receivedData: Array<ServerTextData>;
  animateTextDisplay: boolean;
  translationSentencesAnimatedIndex: number;
  translationSentencesBaseTotalLength: number;
  lastTranslationResultRef: React.RefObject<HTMLDivElement | null>;
  setRoomState: (roomState: RoomState) => void;
  setReceivedData: React.Dispatch<React.SetStateAction<Array<ServerTextData>>>;
  setServerState: React.Dispatch<React.SetStateAction<ServerState | null>>;
  setServerExceptions: React.Dispatch<
    React.SetStateAction<Array<ServerExceptionData>>
  >;
  setTranslationSentencesAnimatedIndex: React.Dispatch<
    React.SetStateAction<number>
  >;
  setAgentAndUpdateParams: (newAgent: AgentCapabilities | null) => void;
  stopStreaming: () => Promise<void>;
};

export function useStreamingSocketListeners({
  socket,
  clientID,
  agent,
  streamingStatus,
  bufferedSpeechPlayer,
  receivedData,
  animateTextDisplay,
  translationSentencesAnimatedIndex,
  translationSentencesBaseTotalLength,
  lastTranslationResultRef,
  setRoomState,
  setReceivedData,
  setServerState,
  setServerExceptions,
  setTranslationSentencesAnimatedIndex,
  setAgentAndUpdateParams,
  stopStreaming,
}: UseStreamingSocketListenersParams): void {
  const isScrolledToBottomRef = useRef<boolean>(isScrolledToDocumentBottom());

  useEffect(() => {
    if (socket == null) {
      return;
    }

    const onRoomStateUpdate = (roomState: RoomState) => {
      setRoomState(roomState);
    };

    socket.on('room_state_update', onRoomStateUpdate);
    return () => {
      socket.off('room_state_update', onRoomStateUpdate);
    };
  }, [socket, setRoomState]);

  useEffect(() => {
    if (socket == null) {
      return;
    }

    const onTranslationText = (data: ServerTextData) => {
      setReceivedData((prev) => [...prev, data]);
      debug()?.receivedText(data.payload);
    };

    const onTranslationSpeech = (data: ServerSpeechData) => {
      bufferedSpeechPlayer.addAudioToBuffer(data.payload, data.sample_rate);
    };

    socket.on('translation_text', onTranslationText);
    socket.on('translation_speech', onTranslationSpeech);
    return () => {
      socket.off('translation_text', onTranslationText);
      socket.off('translation_speech', onTranslationSpeech);
    };
  }, [bufferedSpeechPlayer, socket, setReceivedData]);

  useEffect(() => {
    if (socket == null) {
      return;
    }

    const onServerStateUpdate = (newServerState: ServerState) => {
      setServerState(newServerState);

      if (
        newServerState.serverLock?.isActive === true &&
        newServerState.serverLock?.clientID !== clientID &&
        streamingStatus === 'running'
      ) {
        void stopStreaming();
      }

      const firstAgent = newServerState.agentsCapabilities[0];
      if (agent == null && firstAgent != null) {
        setAgentAndUpdateParams(firstAgent);
      }
    };

    socket.on('server_state_update', onServerStateUpdate);
    return () => {
      socket.off('server_state_update', onServerStateUpdate);
    };
  }, [
    agent,
    clientID,
    setAgentAndUpdateParams,
    setServerState,
    socket,
    stopStreaming,
    streamingStatus,
  ]);

  useEffect(() => {
    if (socket == null) {
      return;
    }

    const onServerException = (
      exceptionDataWithoutClientTime: ServerExceptionData,
    ) => {
      const exceptionData = {
        ...exceptionDataWithoutClientTime,
        timeStringClient: new Date(
          exceptionDataWithoutClientTime.timeEpochMs,
        ).toLocaleString(),
      };

      setServerExceptions((prev) =>
        [exceptionData, ...prev].slice(0, MAX_SERVER_EXCEPTIONS_TRACKED),
      );
      console.error(
        `[server_exception] The server encountered an exception: ${exceptionData.message}`,
        exceptionData,
      );
    };

    socket.on('server_exception', onServerException);
    return () => {
      socket.off('server_exception', onServerException);
    };
  }, [socket, setServerExceptions]);

  useEffect(() => {
    if (socket == null) {
      return;
    }

    const onClearTranscript = () => {
      setReceivedData([]);
      setTranslationSentencesAnimatedIndex(0);
    };

    socket.on('clear_transcript', onClearTranscript);
    return () => {
      socket.off('clear_transcript', onClearTranscript);
    };
  }, [socket, setReceivedData, setTranslationSentencesAnimatedIndex]);

  useEffect(() => {
    const onScroll = () => {
      isScrolledToBottomRef.current = isScrolledToDocumentBottom(
        SCROLLED_TO_BOTTOM_THRESHOLD_PX,
      );
    };

    document.addEventListener('scroll', onScroll);
    return () => {
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    if (
      lastTranslationResultRef.current == null ||
      !isScrolledToBottomRef.current
    ) {
      return;
    }
    lastTranslationResultRef.current.scrollIntoView();
  }, [lastTranslationResultRef, receivedData]);

  useEffect(() => {
    if (!animateTextDisplay) {
      return;
    }

    if (
      translationSentencesAnimatedIndex >= translationSentencesBaseTotalLength
    ) {
      debug()?.endRenderText();
      return;
    }

    const timeout = setTimeout(() => {
      setTranslationSentencesAnimatedIndex((prev) => prev + 1);
      debug()?.startRenderText();
    }, TYPING_ANIMATION_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [
    animateTextDisplay,
    setTranslationSentencesAnimatedIndex,
    translationSentencesAnimatedIndex,
    translationSentencesBaseTotalLength,
  ]);
}
