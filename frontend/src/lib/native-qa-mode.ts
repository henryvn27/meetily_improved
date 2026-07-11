/**
 * Compile-time switches used only by the isolated Tauri QA launchers.
 * These are deliberately absent from the release build scripts.
 */
export type NativeQaMode = 'routes' | 'onboarding' | 'meeting-error' | null;

const configuredMode = process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_MODE;

export const nativeQaMode: NativeQaMode =
  configuredMode === 'routes' || configuredMode === 'onboarding' || configuredMode === 'meeting-error'
    ? configuredMode
    : null;

export const isNativeQaMode = nativeQaMode !== null;
export const bypassOnboardingForNativeQa = nativeQaMode === 'routes' || nativeQaMode === 'meeting-error';
export const openMeetingErrorForNativeQa = nativeQaMode === 'meeting-error';
