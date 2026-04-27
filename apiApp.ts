import express from "express";

import { aiProviderConfig, getCapabilities } from "./config/aiProvider";

const OPENROUTER_CHAT_COMPLETIONS_URL = `${aiProviderConfig.openRouter.baseUrl}/chat/completions`;
const REPLICATE_API_BASE_URL = "https://api.replicate.com/v1";

type OutputType = "text" | "research" | "vision" | "caption" | "copy" | "script" | "image" | "audio" | "tts" | "video" | "pdf";

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
  outputType?: "text" | "research" | "vision";
  imageUrl?: string;
  requireJsonResponse?: boolean;
}

const getOpenRouterKey = () => aiProviderConfig.openRouter.apiKey;
const getOpenRouterTimeoutMs = () => aiProviderConfig.openRouter.timeoutMs;

const getModelForType = (type: "text" | "research" | "vision" | "fallback") => {
  if (type === "text") return process.env.TEXT_MODEL || aiProviderConfig.openRouter.model;
  if (type === "research") return process.env.RESEARCH_MODEL || aiProviderConfig.openRouter.model;
  if (type === "vision") return process.env.VISION_MODEL || aiProviderConfig.openRouter.model;
  return aiProviderConfig.openRouter.model;
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

const parseOpenRouterError = (status: number, fallbackMessage: string): { code: ApiErrorCode; message: string } => {
  if (status === 401) return { code: "provider_unauthorized", message: "OpenRouter rejected the API key (401)." };
  if (status === 402) return { code: "provider_quota_exceeded", message: "OpenRouter quota or credits were exceeded (402)." };
  if (status === 429) return { code: "provider_rate_limited", message: "OpenRouter rate limited this request (429)." };
  if (status >= 500) return { code: "provider_server_error", message: "OpenRouter failed with a server error." };
  return { code: "invalid_provider_response", message: fallbackMessage };
};

const buildChatMessages = (payload: TextGenerationPayload) => {
  const systemInstruction = parseText(payload.systemInstruction);
  const prompt = payload.prompt;

  if (payload.outputType === "vision" && payload.imageUrl) {
    const visionMessages: Array<Record<string, unknown>> = [];
    if (systemInstruction) {
      visionMessages.push({ role: "system", content: systemInstruction });
    }

    visionMessages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: payload.imageUrl } }
      ]
    });

    return visionMessages;
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
  messages.push({ role: "user", content: prompt });
  return messages;
};

const generateOpenRouterText = async (
  payload: TextGenerationPayload
): Promise<ApiSuccess<{ text: string; model: string; route: "text" | "research" | "vision" | "fallback" }>> => {
  const openRouterKey = getOpenRouterKey();
  if (!openRouterKey) {
    throw { status: 503, code: "missing_api_key", message: "OPENROUTER_API_KEY is required for AI generation." };
  }

  const route = payload.outputType || "text";
  const model = parseText(payload.model) || getModelForType(route) || getModelForType("fallback");

  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    signal: AbortSignal.timeout(getOpenRouterTimeoutMs()),
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://one-hub-media.vercel.app",
      "X-Title": process.env.OPENROUTER_APP_NAME || "One Hub Media"
    },
    body: JSON.stringify({
      model,
      messages: buildChatMessages(payload),
      ...(payload.requireJsonResponse ? { response_format: { type: "json_object" } } : {})
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
  if (!text) {
    throw {
      status: 502,
      code: "empty_generation_result",
      message: "OpenRouter returned an empty text response."
    };
  }

  return { data: { text, model, route } };
};

const pollReplicatePrediction = async (id: string, replicateKey: string) => {
  const timeoutAt = Date.now() + 120000;

  while (Date.now() < timeoutAt) {
    const pollResponse = await fetch(`${REPLICATE_API_BASE_URL}/predictions/${id}`, {
      headers: {
        Authorization: `Token ${replicateKey}`,
        "Content-Type": "application/json"
      }
    });

    const pollJson = await pollResponse.json().catch(() => null);

    if (!pollResponse.ok) {
      throw {
        status: pollResponse.status || 502,
        code: "invalid_provider_response",
        message: "Replicate polling failed.",
        details: JSON.stringify(pollJson || {})
      };
    }

    const status = pollJson?.status;
    if (status === "succeeded") return pollJson;
    if (status === "failed" || status === "canceled") {
      throw {
        status: 502,
        code: "provider_server_error",
        message: `Replicate ${status} the image request.`,
        details: pollJson?.error
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw {
    status: 504,
    code: "provider_server_error",
    message: "Timed out while waiting for Replicate image output."
  };
};

const generateImageWithReplicate = async (prompt: string): Promise<ApiSuccess<{ imageUrl: string; provider: string; model: string }>> => {
  const replicateKey = aiProviderConfig.replicate.apiKey;
  if (!replicateKey) {
    throw {
      status: 503,
      code: "provider_not_configured",
      message: "Not available in free version: set REPLICATE_API_KEY to enable image generation."
    };
  }

  const model = aiProviderConfig.replicate.model;
  const createResponse = await fetch(`${REPLICATE_API_BASE_URL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${replicateKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: { prompt }
    })
  });

  const createJson = await createResponse.json().catch(() => null);
  if (!createResponse.ok || !createJson?.id) {
    throw {
      status: createResponse.status || 502,
      code: "invalid_provider_response",
      message: "Replicate failed to create an image prediction.",
      details: JSON.stringify(createJson || {})
    };
  }

  const finished = await pollReplicatePrediction(createJson.id, replicateKey);
  const output = finished?.output;
  const imageUrl = Array.isArray(output) ? parseText(output[0]) : parseText(output);

  if (!imageUrl) {
    throw {
      status: 502,
      code: "empty_generation_result",
      message: "Replicate returned no image URL."
    };
  }

  return { data: { imageUrl, provider: "replicate", model } };
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
    case "caption":
    case "copy":
    case "script": {
      const prompt = parseText(input.prompt);
      if (!prompt) throw { status: 400, code: "validation_error", message: "A non-empty prompt is required." };
      return generateOpenRouterText({
        prompt,
        systemInstruction: parseText(input.systemInstruction) || undefined,
        model: parseText(input.model) || undefined,
        outputType: "text"
      });
    }

    case "research": {
      const prompt = parseText(input.topic) || parseText(input.prompt);
      if (!prompt) throw { status: 400, code: "validation_error", message: "Research topic is required." };
      return generateOpenRouterText({
        prompt: `Create a concise, factual research brief about: ${prompt}`,
        systemInstruction:
          parseText(input.systemInstruction) ||
          "You are a research assistant. Return valid JSON only with keys summary, headlines (array of {title,source,time}), hashtags (array of strings). No markdown.",
        model: parseText(input.model) || undefined,
        outputType: "research",
        requireJsonResponse: true
      });
    }

    case "vision": {
      const prompt = parseText(input.prompt);
      const imageUrl = parseText(input.imageUrl);
      if (!prompt || !imageUrl) throw { status: 400, code: "validation_error", message: "Vision requests require prompt and imageUrl." };
      return generateOpenRouterText({
        prompt,
        imageUrl,
        systemInstruction: parseText(input.systemInstruction) || undefined,
        model: parseText(input.model) || undefined,
        outputType: "vision"
      });
    }

    case "image": {
      const prompt = parseText(input.prompt);
      if (!prompt) throw { status: 400, code: "validation_error", message: "Image prompt is required." };
      return generateImageWithReplicate(prompt);
    }

    case "audio":
    case "tts":
      throw { status: 501, code: "unsupported_provider", message: "Not available in free version" };

    case "video":
      throw { status: 501, code: "unsupported_provider", message: "Not available in free version" };

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
      providerDefaults: {
        openRouterBaseUrl: aiProviderConfig.openRouter.baseUrl,
        aiModel: aiProviderConfig.openRouter.model,
        timeoutMs: aiProviderConfig.openRouter.timeoutMs
      },
      capabilities: getCapabilities(),
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
      const result = await routeByType("research", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Research generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/ai/vision", async (req, res) => {
    try {
      const body = ensureObject(req.body);
      if (!body) return sendError(res, 400, "validation_error", "Request body must be a JSON object.");
      const result = await routeByType("vision", body);
      return res.json(result);
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "Vision generation failed.", error.details, error.warnings);
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

  app.post("/api/media/tts", (_req, res) => sendError(res, 501, "unsupported_provider", "Not available in free version"));
  app.post("/api/media/audio", (_req, res) => sendError(res, 501, "unsupported_provider", "Not available in free version"));
  app.post("/api/media/video", (_req, res) => sendError(res, 501, "unsupported_provider", "Not available in free version"));

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
      const result = await generateOpenRouterText({
        prompt,
        systemInstruction: parseText(body.systemInstruction) || undefined,
        model: parseText(body.model) || undefined,
        outputType: "text"
      });
      return res.json({ text: result.data.text, model: result.data.model, route: result.data.route, warnings: result.warnings || [] });
    } catch (error: any) {
      return sendError(res, error.status || 500, error.code || "provider_server_error", error.message || "AI generation failed.", error.details, error.warnings);
    }
  });

  app.post("/api/ai/tts", (_req, res) => sendError(res, 501, "unsupported_provider", "Not available in free version"));

  return app;
};
