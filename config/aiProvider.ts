export type CapabilityKey = 'text' | 'research' | 'image' | 'audio' | 'video' | 'tts' | 'ocr';

export type CapabilityStatus = 'available' | 'not_configured' | 'requires_external_provider' | 'failed';

export interface CapabilityInfo {
  status: CapabilityStatus;
  provider: string;
  model?: string;
  message?: string;
}

const DEFAULT_TIMEOUT_MS = 30000;

const parseTimeout = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

export const aiProviderConfig = {
  openRouter: {
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    timeoutMs: parseTimeout(process.env.OPENROUTER_TIMEOUT_MS),
    model: process.env.AI_MODEL || 'openrouter/auto'
  },
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY || '',
    model: process.env.IMAGE_MODEL || 'stability-ai/sdxl'
  }
};

export const getCapabilities = (): Record<CapabilityKey, CapabilityInfo> => {
  const openRouterReady = Boolean(aiProviderConfig.openRouter.apiKey);
  const replicateReady = Boolean(aiProviderConfig.replicate.apiKey);

  return {
    text: openRouterReady
      ? { status: 'available', provider: 'openrouter', model: aiProviderConfig.openRouter.model }
      : { status: 'not_configured', provider: 'openrouter', model: aiProviderConfig.openRouter.model, message: 'Set OPENROUTER_API_KEY.' },
    research: openRouterReady
      ? { status: 'available', provider: 'openrouter', model: aiProviderConfig.openRouter.model }
      : { status: 'not_configured', provider: 'openrouter', model: aiProviderConfig.openRouter.model, message: 'Set OPENROUTER_API_KEY.' },
    image: replicateReady
      ? { status: 'available', provider: 'replicate', model: aiProviderConfig.replicate.model }
      : { status: 'requires_external_provider', provider: 'replicate', model: aiProviderConfig.replicate.model, message: 'Set REPLICATE_API_KEY for image generation.' },
    audio: { status: 'requires_external_provider', provider: 'none', message: 'No audio generation provider configured.' },
    video: { status: 'requires_external_provider', provider: 'none', message: 'No video generation provider configured.' },
    tts: { status: 'requires_external_provider', provider: 'none', message: 'No TTS provider configured.' },
    ocr: { status: 'requires_external_provider', provider: 'none', message: 'No OCR provider configured.' }
  };
};
