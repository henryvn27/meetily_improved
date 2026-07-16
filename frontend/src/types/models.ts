export type ModelProvider =
  | 'ollama'
  | 'groq'
  | 'claude'
  | 'openai'
  | 'openrouter'
  | 'builtin-ai'
  | 'custom-openai';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  whisperModel: string;
  apiKey?: string | null;
  ollamaEndpoint?: string | null;
  customOpenAIDisplayName?: string | null;
  customOpenAIEndpoint?: string | null;
  customOpenAIModel?: string | null;
  customOpenAIApiKey?: string | null;
  maxTokens?: number | null;
  temperature?: number | null;
  topP?: number | null;
}

export interface CustomOpenAIConfig {
  displayName?: string | null;
  endpoint?: string | null;
  model?: string | null;
  apiKey?: string | null;
  maxTokens?: number | null;
  temperature?: number | null;
  topP?: number | null;
}

export interface OllamaModelInfo {
  name: string;
  id: string;
  size: string;
  modified: string;
}
