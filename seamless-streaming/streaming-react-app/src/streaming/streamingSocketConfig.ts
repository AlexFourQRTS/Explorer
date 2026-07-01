import {Socket} from 'socket.io-client';
import {
  AgentCapabilities,
  BaseResponse,
  PartialDynamicConfig,
  StartStreamEventConfig,
  SupportedOutputMode,
} from '../types/StreamingTypes';
import {BUFFER_LIMIT} from './streamingInterfaceConstants';

export async function emitDynamicConfig(
  socket: Socket,
  partialConfig: PartialDynamicConfig,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    socket.emit('set_dynamic_config', partialConfig, (result: BaseResponse) => {
      console.log('[emit result: set_dynamic_config]', result);
      if (result.status === 'ok') {
        resolve();
        return;
      }
      reject(new Error('set_dynamic_config failed'));
    });
  });
}

type ConfigureStreamParams = {
  socket: Socket;
  agentName: string;
  sampleRate: number;
  outputMode: SupportedOutputMode;
  serverDebugFlag: boolean;
  onMaxSpeakers: (isMax: boolean) => void;
  onConfigured: (configured: boolean) => void;
};

export async function configureStreamOnSocket({
  socket,
  agentName,
  sampleRate,
  outputMode,
  serverDebugFlag,
  onMaxSpeakers,
  onConfigured,
}: ConfigureStreamParams): Promise<void> {
  const config: StartStreamEventConfig = {
    event: 'config',
    rate: sampleRate,
    model_name: agentName,
    debug: serverDebugFlag,
    async_processing: true,
    buffer_limit: BUFFER_LIMIT,
    model_type: outputMode,
  };

  console.log('[configureStreamAsync] sending config', config);

  return new Promise<void>((resolve, reject) => {
    socket.emit('configure_stream', config, (statusObject) => {
      onMaxSpeakers(statusObject.message === 'max_speakers');
      if (statusObject.status !== 'ok') {
        onConfigured(false);
        reject(
          new Error(
            `[configureStreamAsync] configure_stream returned status: ${statusObject.status}`,
          ),
        );
        return;
      }
      onConfigured(true);
      console.debug('[configureStreamAsync] stream configured!', statusObject);
      resolve();
    });
  });
}

export function applyAgentChange(
  prevAgent: AgentCapabilities | null,
  newAgent: AgentCapabilities | null,
  onLangReset: (lang: string | null) => void,
  onExpressiveReset: () => void,
): AgentCapabilities | null {
  if (prevAgent?.name !== newAgent?.name) {
    onLangReset(newAgent?.targetLangs[0] ?? null);
    onExpressiveReset();
  }
  return newAgent;
}
