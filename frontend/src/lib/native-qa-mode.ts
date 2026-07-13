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

const configuredTheme = process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_THEME;
export const nativeQaTheme = isNativeQaMode && (configuredTheme === 'light' || configuredTheme === 'dark')
  ? configuredTheme
  : null;

const configuredRoute = process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_ROUTE;
const configuredMeetingId = process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_MEETING_ID;
export const nativeQaRoute = isNativeQaMode && configuredRoute === 'settings'
  ? '/settings'
  : isNativeQaMode && configuredRoute === 'meeting' && configuredMeetingId
    ? `/meeting-details?id=${encodeURIComponent(configuredMeetingId)}`
    : null;

const configuredOverlay = process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_OVERLAY;
export const openAnalyticsDetailsForNativeQa = isNativeQaMode && configuredOverlay === 'analytics-details';
export const openImportDialogForNativeQa = isNativeQaMode && configuredOverlay === 'import-audio';

const configuredSettingsTab = process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_SETTINGS_TAB;
export const nativeQaSettingsTab = nativeQaMode === 'routes' && [
  'general',
  'recording',
  'Transcriptionmodels',
  'summaryModels',
  'beta',
].includes(configuredSettingsTab ?? '')
  ? configuredSettingsTab
  : null;

const configuredOnboardingStep = Number(process.env.NEXT_PUBLIC_MEETILY_NATIVE_QA_ONBOARDING_STEP);
export const nativeQaOnboardingStep = nativeQaMode === 'onboarding' && Number.isInteger(configuredOnboardingStep) && configuredOnboardingStep >= 1 && configuredOnboardingStep <= 4
  ? configuredOnboardingStep
  : null;
