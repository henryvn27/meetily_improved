export {};

declare global {
  interface Window {
    __TAURI__?: unknown;
    webkitAudioContext?: typeof AudioContext;
    handleRecordingStop?: (callApi?: boolean) => void;
  }
}
