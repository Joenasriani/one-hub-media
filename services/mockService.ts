import { inferSubject, CHARACTER_A_IDS, CHARACTER_B_IDS } from '../constants';
import { ToolOutput, ContextBrief } from '../types';

interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: string;
}

const SYSTEM_INSTRUCTION = `You are One AI Hub, a production content engine.
Return raw JSON only, no markdown or code fences.
Do not hallucinate URLs or files.
If facts are uncertain, clearly state uncertainty inside JSON fields.`;

const assertNotPlaceholder = (value: string, fieldName: string) => {
  const normalized = value.toLowerCase();
  const blocked = ["placeholder", "lorem ipsum", "example.com", "fake", "mock"];
  if (blocked.some((token) => normalized.includes(token))) {
    const error = new Error(`${fieldName} contains placeholder content.`) as ApiError;
    error.code = 'invalid_provider_response';
    throw error;
  }
};

const apiPost = async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Request failed: ${response.status}`) as ApiError;
    error.code = payload?.error?.code;
    error.status = response.status;
    error.details = payload?.error?.details;
    throw error;
  }

  return payload as T;
};

const extractJson = (text: string): any => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

const callTextModel = async (prompt: string, systemInstruction: string = SYSTEM_INSTRUCTION): Promise<string> => {
  const response = await apiPost<{ data: { text: string } }>('/api/ai/text', {
    prompt,
    systemInstruction,
    model: 'openrouter/auto'
  });

  const text = response?.data?.text?.trim();
  if (!text) {
    const error = new Error('Provider returned empty text.') as ApiError;
    error.code = 'empty_generation_result';
    throw error;
  }

  assertNotPlaceholder(text, 'Generated text');
  return text;
};

const generateImage = async (prompt: string, width: number, height: number): Promise<string> => {
  const response = await apiPost<{ data: { imageUrl: string } }>('/api/media/image', { prompt, width, height });
  const url = response?.data?.imageUrl;
  if (!url) {
    const error = new Error('Image provider returned no image URL.') as ApiError;
    error.code = 'empty_generation_result';
    throw error;
  }
  assertNotPlaceholder(url, 'Image URL');
  return url;
};

const generateAudio = async (text: string): Promise<string> => {
  const response = await apiPost<{ data: { audioUrl: string } }>('/api/media/tts', { text, voice: 'Kore' });
  const url = response?.data?.audioUrl;
  if (!url) {
    const error = new Error('TTS provider returned no audio URL.') as ApiError;
    error.code = 'empty_generation_result';
    throw error;
  }
  return url;
};

export const fetchGeminiBrief = async (topic: string): Promise<ContextBrief> => {
  const response = await apiPost<{ data: { text: string } }>('/api/ai/research', { topic });
  const parsed = extractJson(response.data.text) as ContextBrief;
  if (!parsed.summary || !parsed.headlines || !parsed.hashtags) {
    throw new Error('Research response structure is invalid.');
  }
  return parsed;
};

export const generateContent = async (toolId: string, prompt: string, options?: any): Promise<ToolOutput> => {
  const { subject, keywords } = inferSubject(prompt);

  if (toolId === 'blog-studio') {
    const aiPrompt = `Act as an expert copywriter. Write a complex blog post about "${subject}".
Return JSON with {"ideas":[],"finalPost":{"title":"","subtitle":"","blocks":[]}}`;
    const [text, imageUrl] = await Promise.all([
      callTextModel(aiPrompt),
      generateImage(`Cinematic professional header for ${subject}, ${keywords}`, 1200, 600)
    ]);

    const payload = extractJson(text);
    payload.type = 'blog';
    payload.finalPost.imageUrl = imageUrl;
    return payload as ToolOutput;
  }

  if (toolId === 'storyboard') {
    const count = options?.frameCount || 4;
    const aiPrompt = `Create a ${count}-frame cinematic storyboard about "${subject}". Return JSON {"scenes":[{"description":""}]}`;
    const text = await callTextModel(aiPrompt);
    const payload = extractJson(text);

    if (!Array.isArray(payload.scenes) || payload.scenes.length === 0) {
      throw new Error('Storyboard scenes are missing.');
    }

    const scenes = await Promise.all(
      payload.scenes.map(async (scene: { description: string }, index: number) => ({
        description: scene.description,
        imageUrl: await generateImage(`Cinematic storyboard scene ${index + 1} about ${subject}, ${keywords}, dramatic lighting`, 800, 450)
      }))
    );

    return { type: 'storyboard', scenes };
  }

  if (toolId === 'ad-creator') {
    const text = await callTextModel(`Create high-conversion ad copy for "${subject}". Return JSON with headline and cta.`);
    const payload = extractJson(text);
    const imageUrl = await generateImage(`Vertical high-end advertisement visual for ${subject}`, 1080, 1920);
    return { type: 'ad', headline: payload.headline, cta: payload.cta, imageUrl };
  }

  if (toolId === 'podcast') {
    const text = await callTextModel(`Write a short podcast intro script about "${subject}". Return JSON with topicOptions and script.`);
    const payload = extractJson(text);
    const audioUrl = await generateAudio(payload.script);
    return { type: 'audio', topicOptions: payload.topicOptions, script: payload.script, audioUrl };
  }

  if (toolId === 'devils-advocate' || toolId === 'campaign-master') {
    const text = await callTextModel(`Create a strategy critique for "${subject}". Return JSON with title and sections.`);
    const payload = extractJson(text);
    return { type: 'strategy', title: payload.title, sections: payload.sections };
  }

  if (toolId === 'quiz-magnet') {
    const text = await callTextModel(`Create a 3-question quiz about "${subject}". Return JSON with questions.`);
    const payload = extractJson(text);
    return { type: 'quiz', questions: payload.questions };
  }

  if (toolId === 'landing-page') {
    const text = await callTextModel(`Design a landing page wireframe for "${subject}". Return JSON with sections.`);
    const payload = extractJson(text);
    const heroImageUrl = await generateImage(`Cinematic hero visual for ${subject}, ${keywords}`, 1200, 800);
    return { type: 'landing', sections: payload.sections, heroImageUrl } as ToolOutput;
  }

  if (toolId === 'email-sequence') {
    const text = await callTextModel(`Write a 3-email drip sequence for "${subject}". Return JSON with emails.`);
    const payload = extractJson(text);
    return { type: 'email', emails: payload.emails };
  }

  if (toolId === 'carousel') {
    const text = await callTextModel(`Create a 5-slide LinkedIn carousel about "${subject}". Return JSON with slides.`);
    const payload = extractJson(text);
    const slides = await Promise.all(
      payload.slides.map(async (slide: { title: string; content: string; color: string }) => ({
        ...slide,
        imageUrl: await generateImage(`Presentation slide about ${subject}, ${keywords}`, 1080, 1350)
      }))
    );
    return { type: 'carousel', slides } as ToolOutput;
  }

  if (toolId === 'meme-lord') {
    const text = await callTextModel(`Create 3 meme concepts about "${subject}". Return JSON with memes [{topText,bottomText}].`);
    const payload = extractJson(text);
    const memes = await Promise.all(
      payload.memes.map(async (meme: { topText: string; bottomText: string }) => ({
        ...meme,
        imageUrl: await generateImage(`Meme template visual about ${subject}, ${keywords}`, 500, 500)
      }))
    );
    return { type: 'meme', memes };
  }

  if (toolId === 'podcaster-shots') {
    const prompts = [
      `Studio portrait host A about ${subject}`,
      `Studio portrait host B about ${subject}`,
      `Podcast recording scene for ${subject}`,
      `Podcast behind-the-scenes for ${subject}`
    ];

    const images = await Promise.all(prompts.map((imagePrompt) => generateImage(imagePrompt, 600, 800)));
    return {
      type: 'podcaster',
      characterA: [images[0], images[2] || CHARACTER_A_IDS[0]],
      characterB: [images[1], images[3] || CHARACTER_B_IDS[0]]
    };
  }

  if (toolId === 'short-video') {
    const response = await apiPost<{ data: { videoUrl: string } }>('/api/media/video', {
      prompt: `Create a short promotional video about ${subject}`
    });
    return { type: 'video', videoUrl: response.data.videoUrl, duration: 'unknown' };
  }

  throw new Error(`Unsupported tool: ${toolId}`);
};
