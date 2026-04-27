import { inferSubject } from '../constants';
import { CapabilitiesMap, CapabilityKey, ContextBrief, Tool, ToolOutput } from '../types';

interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: string;
}

const SYSTEM_INSTRUCTION = `You are One AI Hub, a production content engine.
Return raw JSON only, no markdown or code fences.
Do not hallucinate URLs or files.
If facts are uncertain, clearly state uncertainty inside JSON fields.`;

const parseJson = (text: string) => JSON.parse(text.replace(/```json|```/g, '').trim());

const apiPost = async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Request failed (${response.status})`) as ApiError;
    error.code = payload?.error?.code;
    error.status = response.status;
    error.details = payload?.error?.details;
    throw error;
  }

  return payload as T;
};

const ensureCapabilities = (tool: Tool, capabilities: CapabilitiesMap | null) => {
  const required = tool.requiredCapabilities || ['text'];

  if (!capabilities) {
    throw new Error('Provider capabilities are unavailable. Check /api/ai/health and retry.');
  }

  for (const capability of required) {
    const state = capabilities[capability as CapabilityKey];
    if (!state || state.status !== 'available') {
      throw new Error(state?.message || `${capability} is not available for this tool.`);
    }
  }
};

const generateText = async (prompt: string): Promise<string> => {
  const response = await apiPost<{ data: { text: string } }>('/api/ai/text', {
    prompt,
    systemInstruction: SYSTEM_INSTRUCTION
  });

  if (!response?.data?.text?.trim()) throw new Error('Provider returned empty text.');
  return response.data.text;
};

const generateImage = async (prompt: string): Promise<string> => {
  const response = await apiPost<{ data: { imageUrl: string } }>('/api/media/image', { prompt });
  if (!response?.data?.imageUrl?.trim()) throw new Error('Provider returned empty image URL.');
  return response.data.imageUrl;
};

export const fetchGeminiBrief = async (topic: string, capabilities: CapabilitiesMap | null): Promise<ContextBrief> => {
  if (!capabilities?.research || capabilities.research.status !== 'available') {
    throw new Error(capabilities?.research?.message || 'Research provider is not configured.');
  }

  const response = await apiPost<{ data: { text: string } }>('/api/ai/research', {
    topic,
    systemInstruction: `${SYSTEM_INSTRUCTION}\nReturn JSON with keys summary, headlines[{title,source,time}], hashtags.`
  });

  const parsed = parseJson(response.data.text) as ContextBrief;
  if (!parsed?.summary || !Array.isArray(parsed?.headlines) || !Array.isArray(parsed?.hashtags)) {
    throw new Error('Research response structure is invalid.');
  }

  return parsed;
};

export const generateContent = async (tool: Tool, prompt: string, capabilities: CapabilitiesMap | null, options?: any): Promise<ToolOutput> => {
  ensureCapabilities(tool, capabilities);

  const { subject, keywords } = inferSubject(prompt);

  if (tool.id === 'blog-studio') {
    const text = await generateText(`Act as an expert copywriter. Write a complex blog post about "${subject}". Return JSON with {"ideas":[],"finalPost":{"title":"","subtitle":"","blocks":[]}}`);
    const imageUrl = await generateImage(`Cinematic professional header for ${subject}, ${keywords}`);
    const payload = parseJson(text);
    return { ...payload, type: 'blog', finalPost: { ...payload.finalPost, imageUrl } } as ToolOutput;
  }

  if (tool.id === 'storyboard') {
    const count = options?.frameCount || 4;
    const text = await generateText(`Create a ${count}-frame cinematic storyboard about "${subject}". Return JSON {"scenes":[{"description":""}]}`);
    const payload = parseJson(text);
    const scenes = await Promise.all(
      (payload.scenes || []).map(async (scene: { description: string }, index: number) => ({
        description: scene.description,
        imageUrl: await generateImage(`Cinematic storyboard scene ${index + 1} about ${subject}, ${keywords}`)
      }))
    );
    return { type: 'storyboard', scenes };
  }

  if (tool.id === 'ad-creator') {
    const text = await generateText(`Create high-conversion ad copy for "${subject}". Return JSON with headline and cta.`);
    const payload = parseJson(text);
    const imageUrl = await generateImage(`Vertical high-end advertisement visual for ${subject}`);
    return { type: 'ad', headline: payload.headline, cta: payload.cta, imageUrl };
  }

  if (tool.id === 'devils-advocate' || tool.id === 'campaign-master') {
    const text = await generateText(`Create a strategy critique for "${subject}". Return JSON with title and sections.`);
    const payload = parseJson(text);
    return { type: 'strategy', title: payload.title, sections: payload.sections };
  }

  if (tool.id === 'quiz-magnet') {
    const text = await generateText(`Create a 3-question quiz about "${subject}". Return JSON with questions.`);
    return { type: 'quiz', questions: parseJson(text).questions };
  }

  if (tool.id === 'landing-page') {
    const text = await generateText(`Design a landing page wireframe for "${subject}". Return JSON with sections.`);
    return { type: 'landing', sections: parseJson(text).sections } as ToolOutput;
  }

  if (tool.id === 'email-sequence') {
    const text = await generateText(`Write a 3-email drip sequence for "${subject}". Return JSON with emails.`);
    return { type: 'email', emails: parseJson(text).emails };
  }

  if (tool.id === 'carousel') {
    const text = await generateText(`Create a 5-slide LinkedIn carousel about "${subject}". Return JSON with slides.`);
    const payload = parseJson(text);
    const slides = await Promise.all(
      (payload.slides || []).map(async (slide: { title: string; content: string; color: string }) => ({
        ...slide,
        imageUrl: await generateImage(`Presentation slide about ${subject}, ${keywords}`)
      }))
    );
    return { type: 'carousel', slides } as ToolOutput;
  }

  if (tool.id === 'meme-lord') {
    const text = await generateText(`Create 3 meme concepts about "${subject}". Return JSON with memes [{topText,bottomText}].`);
    const payload = parseJson(text);
    const memes = await Promise.all(
      (payload.memes || []).map(async (meme: { topText: string; bottomText: string }) => ({
        ...meme,
        imageUrl: await generateImage(`Meme template visual about ${subject}, ${keywords}`)
      }))
    );
    return { type: 'meme', memes };
  }

  if (tool.id === 'podcaster-shots') {
    const prompts = [
      `Studio portrait host A about ${subject}`,
      `Studio portrait host B about ${subject}`,
      `Podcast recording scene for ${subject}`,
      `Podcast behind-the-scenes for ${subject}`
    ];
    const images = await Promise.all(prompts.map((imagePrompt) => generateImage(imagePrompt)));
    return { type: 'podcaster', characterA: [images[0], images[2]], characterB: [images[1], images[3]] };
  }

  throw new Error(`Unsupported tool: ${tool.id}`);
};
