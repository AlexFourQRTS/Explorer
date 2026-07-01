export type VirtualMicElectronApi = {
  virtualMicCheck?: () => Promise<{installed: boolean}>;
  virtualMicInstall?: () => Promise<{ok: boolean}>;
};

export async function checkBlackHoleInstalled(): Promise<boolean | null> {
  const api = (window as Window & {electronAPI?: VirtualMicElectronApi})
    .electronAPI;
  if (api?.virtualMicCheck == null) {
    return null;
  }
  const result = await api.virtualMicCheck();
  return result.installed;
}

export async function runBlackHoleInstall(): Promise<void> {
  const api = (window as Window & {electronAPI?: VirtualMicElectronApi})
    .electronAPI;
  if (api?.virtualMicInstall == null) {
    window.open('https://existential.audio/blackhole/', '_blank');
    return;
  }
  await api.virtualMicInstall();
}
