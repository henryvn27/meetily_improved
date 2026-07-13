import { ModelConfig } from "@/components/ModelSettingsModal";
import { PreferenceSettings } from "@/components/PreferenceSettings";
import { DeviceSelection } from "@/components/DeviceSelection";
import { LanguageSelection } from "@/components/LanguageSelection";
import { TranscriptSettings } from "@/components/TranscriptSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useConfig } from "@/contexts/ConfigContext";
import { useRecordingState } from "@/contexts/RecordingStateContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

type modalType = "modelSettings" | "deviceSettings" | "languageSettings" | "modelSelector" | "errorAlert" | "chunkDropWarning";

/**
 * SettingsModals Component
 *
 * All settings modals consolidated into a single component.
 * Uses ConfigContext and RecordingStateContext internally - no prop drilling needed!
 */

interface SettingsModalsProps {
  modals: {
    modelSettings: boolean;
    deviceSettings: boolean;
    languageSettings: boolean;
    modelSelector: boolean;
    errorAlert: boolean;
    chunkDropWarning: boolean;
  };
  messages: {
    errorAlert: string;
    chunkDropWarning: string;
    modelSelector: string;
  };
  onClose: (name: modalType) => void;
}

export function SettingsModals({
  modals,
  messages,
  onClose,
}: SettingsModalsProps) {
  // Contexts
  const {
    modelConfig,
    setModelConfig,
    models,
    modelOptions,
    error,
    selectedDevices,
    setSelectedDevices,
    selectedLanguage,
    setSelectedLanguage,
    transcriptModelConfig,
    setTranscriptModelConfig,
    showConfidenceIndicator,
    toggleConfidenceIndicator,
  } = useConfig();

  const { isRecording } = useRecordingState();

  const activeModal = (Object.entries(modals).find(([, open]) => open)?.[0] ?? null) as modalType | null;
  useEffect(() => {
    if (!activeModal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(activeModal);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activeModal, onClose]);

  return <>
    {/* Legacy Settings Modal */}
    {modals.modelSettings && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="preferences-dialog-title" className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-6">
            <h3 id="preferences-dialog-title" className="app-display text-xl">Preferences</h3>
            <button
              onClick={() => onClose("modelSettings")
              }
              aria-label="Close preferences"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* General Preferences Section */}
            <PreferenceSettings />

            {/* Divider */}
            <div className="border-t border-border pt-8">
              <h4 className="text-lg font-semibold text-foreground mb-4">AI Model Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Summarization Model
                  </label>
                  <div className="flex space-x-2">
                    <select
                      className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      value={modelConfig.provider}
                      onChange={(e) => {
                        const provider = e.target.value as ModelConfig['provider'];
                        setModelConfig({
                          ...modelConfig,
                          provider,
                          model: modelOptions[provider][0]
                        });
                      }}
                    >
                      <option value="builtin-ai">Built-in AI</option>
                      <option value="claude">Claude</option>
                      <option value="groq">Groq</option>
                      <option value="ollama">Ollama</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                    </select>

                    <select
                      className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      value={modelConfig.model}
                      onChange={(e) => setModelConfig((prev: ModelConfig) => ({ ...prev, model: e.target.value }))}
                    >
                      {modelOptions[modelConfig.provider].map((model: string) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {modelConfig.provider === 'ollama' && (
                  <div>
                    <h4 className="mb-4 text-lg font-bold">Available Ollama Models</h4>
                    {error && (
                      <div className="mb-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
                        {error}
                      </div>
                    )}
                    <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className={`cursor-pointer border border-border bg-card p-4 transition-colors ${modelConfig.model === model.name ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'hover:bg-muted/50'
                            }`}
                          onClick={() => setModelConfig((prev: ModelConfig) => ({ ...prev, model: model.name }))}
                        >
                          <h3 className="font-bold">{model.name}</h3>
                          <p className="text-muted-foreground">Size: {model.size}</p>
                          <p className="text-muted-foreground">Modified: {model.modified}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-border p-6">
            <button
              onClick={() => onClose('modelSettings')}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/88"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Device Settings Modal */}
    {modals.deviceSettings && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="device-settings-dialog-title" className="mx-4 w-full max-w-md rounded-[10px] border border-border bg-card p-6 shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 id="device-settings-dialog-title" className="text-lg font-semibold text-foreground">Audio device settings</h3>
            <button
              onClick={() => onClose('deviceSettings')}
              aria-label="Close audio device settings"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          <DeviceSelection
            selectedDevices={selectedDevices}
            onDeviceChange={setSelectedDevices}
            disabled={isRecording}
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                const micDevice = selectedDevices.micDevice || 'Default';
                const systemDevice = selectedDevices.systemDevice || 'Default';
                toast.success("Devices selected", {
                  description: `Microphone: ${micDevice}, System Audio: ${systemDevice}`
                });
                onClose('deviceSettings');
              }}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/88"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Language Settings Modal */}
    {modals.languageSettings && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="language-settings-dialog-title" className="mx-4 w-full max-w-md rounded-[10px] border border-border bg-card p-6 shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 id="language-settings-dialog-title" className="text-lg font-semibold text-foreground">Language settings</h3>
            <button
              onClick={() => onClose('languageSettings')}
              aria-label="Close language settings"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          <LanguageSelection
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            disabled={isRecording}
            provider={transcriptModelConfig.provider}
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onClose('languageSettings')}
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/88"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Model Selection Modal */}
    {modals.modelSelector && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="model-selector-dialog-title" className="mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[10px] border border-border bg-card shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
          {/* Fixed Header */}
          <div className="flex items-center justify-between border-b border-border p-6 pb-4">
            <h3 id="model-selector-dialog-title" className="text-lg font-semibold text-foreground">
              {messages.modelSelector ? 'Speech Recognition Setup Required' : 'Transcription Model Settings'}
            </h3>
            <button
              onClick={() => onClose('modelSelector')}
              aria-label="Close transcription model settings"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <TranscriptSettings
              transcriptModelConfig={transcriptModelConfig}
              setTranscriptModelConfig={setTranscriptModelConfig}
              onModelSelect={() => onClose('modelSelector')}
            />
          </div>

          {/* Fixed Footer */}
          <div className="flex items-center justify-between border-t border-border p-6 pt-4">
            {/* Confidence Indicator Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConfidenceIndicator}
                  onChange={(e) => toggleConfidenceIndicator(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted peer-checked:bg-accent peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-checked:after:translate-x-full peer-checked:after:border-card after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-input after:bg-card after:transition-all after:content-[''] rtl:peer-checked:after:-translate-x-full"></div>
              </label>
              <div>
                <p className="text-sm font-medium text-foreground">Show Confidence Indicators</p>
                <p className="text-xs text-muted-foreground">Display colored dots showing transcription confidence quality</p>
              </div>
            </div>

            <button
              onClick={() => onClose('modelSelector')}
              className="h-9 rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {messages.modelSelector ? 'Cancel' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Error Alert Modal */}
    {modals.errorAlert && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
        <Alert className="mx-4 max-w-md border-destructive/30 bg-card shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
          <AlertTitle className="text-destructive">Recording Stopped</AlertTitle>
          <AlertDescription className="text-destructive">
            {messages.errorAlert}
            <button
              onClick={() => onClose('errorAlert')}
              className="ml-2 text-destructive underline hover:text-foreground"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )}

    {/* Chunk Drop Warning Modal */}
    {modals.chunkDropWarning && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
        <Alert className="mx-4 max-w-lg border-warning/30 bg-card shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
          <AlertTitle className="text-warning">Transcription Performance Warning</AlertTitle>
          <AlertDescription className="text-warning">
            {messages.chunkDropWarning}
            <button
              onClick={() => onClose('chunkDropWarning')}
              className="ml-2 text-warning underline hover:text-foreground"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )}
  </>
}
