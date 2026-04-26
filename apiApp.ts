import express from "express";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

type OutputType = "text" | "research" | "caption" | "copy" | "script" | "image" | "audio" | "tts" | "video" | "pdf";

type ApiErrorCode =
  | "validation_error"
  | "missing_api_key"
  | "provider_not_configured"
  | "unsupported_media_type"
  | "unsupported_provider"
  | "provider_unauthorized"
  | "provider_quota_exceeded"
  | "provider_rate_limited"
  | "provider_server_error"
  | "invalid_provider_response"
  | "empty_generation_result";

interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: string;
    warnings?: string[];
  };
}

interface ApiSuccess<T> {
  data: T;
  warnings?: string[];
}

interface TextGenerationPayload {
  prompt: string;
  systemInstruction?: string;
  model?: string;
}

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || process.env.ONE_HUB_MEDIA_API;
const getOpenRouterBaseUrl = () => (process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL).replace(/\/+$/, "");
const getOpenRouterApiUrl = () => `${getOpenRouterBaseUrl()}/chat/completions`;
const getOpenRouterTimeoutMs = () => {
  const timeout = Number(process.env.OPENROUTER_TIMEOUT_MS || 30000);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 30000;
};

const getDefaultModelForType = (type: "text" | "research") => {
  if (type === "research") {
    return process.env.RESEARCH_MODEL || process.env.OPENROUTER_RESEARCH_MODEL || process.env.OPENROUTER_TEXT_MODEL || process.env.AI_MODEL || "openrouter/auto";
  }

  return process.env.TEXT_MODEL || process.env.OPENROUTER_TEXT_MODEL || process.env.AI_MODEL || "openrouter/auto";
};

const sendError = (res: express.Response, status: number, code: ApiErrorCode, message: string, details?: string, warnings?: string[]) => {
  const payload: ApiErrorPayload = { error: { code, message, details, warnings } };
  return res.status(status).json(payload);
};

const parseText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
};

const buildMessages = (prompt: string, systemInstruction?: string) => {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });
  return messages;
};

const parseOpenRouterError = (status: number, fallbackMessage: string): { code: ApiErrorCode; message: string } => {
  if (status === 401) return { code: "provider_unauthorized", message: "OpenRouter rejected the API key (401)." };
  if (status === 402) return { code: "provider_quota_exceeded", message: "OpenRouter quota or credits were exceeded (402)." };
  if (status === 429) return { code: "provider_rate_limited", message: "OpenRouter rate limited this request (429)." };
  if (status >= 500) return { code: "provider_server_error", message: "OpenRouter failed with a server error." };
  return { code: "invalid_provider_response", message: fallbackMessage };
};

const generateTextWithOpenRouter = async (
  payload: TextGenerationPayload & { outputType?: "text" | "research" }
): Promise<ApiSuccess<{ text: string; model: string }>> => {
  const openRouterKey = getOpenRouterKey();
  if (!openRouterKey) {
    throw { status: 503, code: "missing_api_key", message: "OPENROUTER_API_KEY is required for text/research generation." };
  }

  const selectedModel = payload.model || getDefaultModelForType(payload.outputType || "text");
  const model = selectedModel === "openrouter/auto" ? "openrouter/auto" : selectedModel;

  const response = await fetch(getOpenRouterApiUrl(), {
    method: "POST",
    signal: AbortSignal.timeout(getOpenRouterTimeoutMs()),
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "HTTP-Referer": process.env.ONE_HUB_MEDIA_REFERER || "https://one-hub-media.local",
      "X-Title": "One Hub Media",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: buildMessages(payload.prompt, payload.systemInstruction)
    })
  });

  const raw = await response.text();
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw {
      status: 502,
      code: "invalid_provider_response",
      message: "OpenRouter returned invalid JSON.",
      details: raw.slice(0, 300)
    };
  }

  if (!response.ok || parsed?.error) {
    const parsedErr = parseOpenRouterError(response.status, parsed?.error?.message || "OpenRouter returned an unexpected error.");
    throw {
      status: response.status || 502,
      code: parsedErr.code,
      message: parsedErr.message,
      details: parsed?.error?.message || raw.slice(0, 300)
    };
  }

  const text = parseText(parsed?.choices?.[0]?.message?.content);
  if (!parsed?.choices || !Array.isArray(parsed.choices) || parsed.choices.length === 0) {
    throw {
      status: 502,
      code: "invalid_provider_response",
      message: "OpenRouter returned empty choices."
    };
  }

  if (!text) {
    throw {
      status: 502,
      code: "empty_generation_result",
      message: "OpenRouter returned an empty text response."
    };
  }

  return { data: { text, model } };
};

const generateImage = async (prompt: string, width = 1024, height = 1024): Promise<ApiSuccess<{ imageUrl: string; provider: string }>> => {
  const cleanPrompt = prompt.trim();
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux`;

  if (!/^https:\/\/image\.pollinations\.ai\//.test(imageUrl)) {
    throw { status: 502, code: "invalid_provider_response", message: "Image provider returned an invalid URL." };
  }

  return {
    data: {
      imageUrl,
      provider: "pollinations"
    }
  };
};

const decodePcmBase64ToWavDataUrl = (base64Pcm: string): { audioUrl: string; mimeType: string; format: string; sizeBytes: number } => {
  const pcm = Buffer.from(base64Pcm, "base64");
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const channels = 1;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + dataSize, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  const wav = Buffer.concat([wavHeader, pcm]);
  return {
    audioUrl: `data:audio/wav;base64,${wav.toString("base64")}`,
    mimeType: "audio/wav",
    format: "wav",
    sizeBytes: wav.length
  };
};

const generateTtsAudio = async (
  text: string,
  voice = process.env.GEMINI_TTS_VOICE || "Kore"
): Promise<ApiSuccess<{ audioUrl: string; mimeType: string; format: string; sizeBytes: number; durationSeconds?: number }>> => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw {
      status: 503,
      code: "provider_not_configured",
      message: "GEMINI_API_KEY is required for TTS/audio generation."
    };
  }

  const ttsModel = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
  const maxChars = Number(process.env.TTS_MAX_CHARS || 0);
  let requestText = text;
  const warnings: string[] = [];

  if (maxChars > 0 && requestText.length > maxChars) {
    requestText = requestText.slice(0, maxChars);
    warnings.push(`TTS input was truncated to ${maxChars} characters by TTS_MAX_CHARS.`);
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const response = await ai.models.generateContent({
    model: ttsModel,
    contents: [{ parts: [{ text: requestText }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio || typeof base64Audio !== "string") {
    throw {
      status: 502,
      code: "invalid_provider_response",
      message: "TTS provider did not return audio content."
    };
  }

  const audio = decodePcmBase64ToWavDataUrl(base64Audio);
  const estimatedDuration = Math.round((audio.sizeBytes / (24000 * 2)) * 100) / 100;

  return {
    data: { ...audio, durationSeconds: estimatedDuration },
    warnings
  };
};

const generateVideo = async (_prompt: string): Promise<ApiSuccess<{ videoUrl: string; provider: string }>> => {
  if (!process.env.VIDEO_PROVIDER_API_KEY) {
    throw {
      status: 501,
      code: "provider_not_configured",
      message: "No video provider is configured. Set VIDEO_PROVIDER_API_KEY and integrate a supported provider."
    };
  }

  throw {
    status: 501,
    code: "unsupported_provider",
    message: "Configured video provider is not supported in this deployment yet."
  };
};

const generatePdf = async (title: string, content: string): Promise<ApiSuccess<{ fileName: string; mimeType: string; dataUrl: string; sizeBytes: number }>> => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(content, 515);
  doc.text(lines, 40, 80);

  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1] || "";
  const sizeBytes = Buffer.from(base64, "base64").length;

  if (!/^data:application\/pdf(?:;[^,]*)?,/i.test(dataUri)) {
    throw { status: 502, code: "invalid_provider_response", message: "PDF generation produced invalid output." };
  }

  return {
    data: {
      fileName: `one-hub-${Date.now()}.pdf`,
      mimeType: "application/pdf",
      dataUrl: dataUri,
      sizeBytes
    }
  };
};

const routeByType = async (type: OutputType, input: Record<string, unknown>) => {
  switch (type) {
    case "text":
    case "research":
    case "caption":
    case "copy":
    case "script": {
      const prompt = parseText(input.prompt);
      if (!prompt) {
        throw { status: 400, code: "validation_error", message: "A non-empty prompt is required." };
      }
      return generateTextWithOpenRouter({
        prompt,
        systemInstruction: parseText(input.systemInstruction) || undefined,
        model: parseText(input.model) || undefined,
        outputType: type === "research" ? "research" : "text"
      });
    }
    case "image": {
      const prompt = parseText(input.prompt);
      if (!prompt) throw { status: 400, code: "validation_error", message: "Image prompt is required." };
      return generateImage(prompt, Number(input.width) || 1024, Number(input.height) || 1024);
    }
    case "audio":
    case "tts": {
      const text = parseText(input.text);
      if (!text) throw { status: 400, code: "validation_error", message: "TTS text is required." };
      return generateTtsAudio(text, parseText(input.voice) || undefined);
    }
    case "video": {
      const prompt = parseText(input.prompt);
      if (!prompt) throw { status: 400, code: "validation_error", message: "Video prompt is required." };
      return generateVideo(prompt);
    }
    case "pdf": {
      const title = parseText(input.title) || "One Hub Media Export";
      const content = parseText(input.content);
      if (!content) throw { status: 400, code: "validation_error", message: "PDF content is required." };
      return generatePdf(title, content);
    }
    default:
      throw { status: 400, code: "unsupported_media_type", message: `Unsupported output type: ${type}` };
  }
};

export const createApiApp = () => {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/ai/health", (_req, res) => {
    return res.json({
      openRouterConfigured: Boolean(getOpenRouterKey()),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      imageProviderConfigured: true,
      audioProviderConfigured: Boolean(process.env.GEMINI_API_KEY),
      videoProviderConfigured: Boolean(process.env.VIDEO_PROVIDER_API_KEY),
      pdfGenerationAvailable: true
    });
  });

  app.post("/api/ai/text", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("text", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Text generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/ai/research", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const prompt = parseText(body.topic) || parseText(body.prompt);
      if (!prompt) return sendError(res, 400, "validation_error", "Research topic is required.");
      const result = await generateTextWithOpenRouter({
        prompt: `Create a concise, factual research brief about: ${prompt}`,
        systemInstruction: parseText(body.systemInstruction) || "You are a research assistant. Return JSON-safe plain text with citations where possible.",
        model: parseText(body.model) || undefined,
        outputType: "research"
      });
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Research generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/media/image", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("image", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Image generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/media/tts", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("tts", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "TTS generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/media/audio", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("audio", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Audio generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/media/video", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("video", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Video generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/media/pdf", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("pdf", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "PDF generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/media/regenerate", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");

      const outputType = parseText(body.outputType) as OutputType | null;
      const input = ensureObject(body.input);
      if (!outputType || !input) {
        return sendError(res, 400, "validation_error", "outputType and input are required.");
      }

      const result = await routeByType(outputType, input);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Regeneration failed.", error.details, error.warnings);
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const prompt = parseText(body.prompt);
      if (!prompt) return sendError(res, 400, "validation_error", "A non-empty prompt is required.");
      const result = await generateTextWithOpenRouter({
        prompt,
        systemInstruction: parseText(body.systemInstruction) || undefined,
        model: parseText(body.model) || undefined,
        outputType: "text"
      });
      return res.json({ text: result.data.text, model: result.data.model, warnings: result.warnings || [] });
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "AI generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/ai/tts", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const text = parseText(body.text);
      if (!text) return sendError(res, 400, "validation_error", "TTS text is required.");
      const result = await generateTtsAudio(text, parseText(body.voice) || undefined);
      return res.json({ audio: result.data.audioUrl, ...result.data, warnings: result.warnings || [] });
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "TTS generation failed.", error.details, error.warnings);
    }
  });

  return app;
};
