interface LocalModelStatusInput {
  provider: string | null;
  model: string | null;
  ollamaModelCount: number;
  ollamaError?: string;
}

export function getLocalModelStatus({ provider, model, ollamaModelCount, ollamaError }: LocalModelStatusInput) {
  if (provider === 'builtin-ai' && model) {
    return {
      ready: true,
      description: `${model} is configured as the built-in local model.`,
    };
  }

  if (provider === 'ollama' && ollamaModelCount > 0 && !ollamaError) {
    return {
      ready: true,
      description: `${ollamaModelCount} Ollama model${ollamaModelCount === 1 ? '' : 's'} available on this device.`,
    };
  }

  return {
    ready: false,
    description: provider === 'ollama'
      ? 'Configure or start Ollama before local summaries and meeting recall can run.'
      : 'Select a local provider before using local summaries and meeting recall.',
  };
}
