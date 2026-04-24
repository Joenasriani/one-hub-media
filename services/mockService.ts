import { getMockData, getMockBrief, inferSubject, generateImageURL, MOCK_AUDIO_BLOB, CHARACTER_A_IDS, CHARACTER_B_IDS } from '../constants';
import { ToolOutput, ContextBrief } from '../types';

// System Instructions for the AI
const SYSTEM_INSTRUCTION = `You are One AI Hub, a futuristic AI engine. 
Your goal is to generate high-quality, professional, and strictly structured JSON content. 
You must adhere to the user's specific topic ("Deep Subject"). 
Do not use markdown formatting in the response, only return the raw JSON object.`;

/**
 * Common helper for AI generation via backend proxy
 */
const callAI = async (prompt: string, systemInstruction: string = SYSTEM_INSTRUCTION): Promise<string | null> => {
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        model: "openrouter/auto"
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    // OpenRouter / OpenAI format
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return null;
  }
};

// Helper to delay for UI pacing
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a real image using Pollinations (Flux) - reliable and no-auth for prototype
 */
const generateRealImage = async (prompt: string, width: number = 1200, height: number = 600): Promise<string | null> => {
  const seed = Math.floor(Math.random() * 100000);
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}&width=${width}&height=${height}&nologo=true&model=flux`;
};

/**
 * Mock audio - OpenRouter doesn't support TTS natively in same call easily
 */
const generateRealAudio = async (text: string): Promise<string | null> => {
  return null; // Fallback to mock audio
};

export const fetchGeminiBrief = async (topic: string): Promise<ContextBrief> => {
  const { subject } = inferSubject(topic);
  const prompt = `Generate a briefing about "${subject}". Return JSON with:
  {
    "summary": "string",
    "headlines": [{"title": "string", "source": "string", "time": "string"}],
    "hashtags": ["string"]
  }`;

  const aiResult = await callAI(prompt);
  if (aiResult) {
    try {
      return JSON.parse(aiResult.replace(/```json|```/g, '').trim()) as ContextBrief;
    } catch (e) {
      console.warn("Brief JSON parse failed", e);
    }
  }
  return getMockBrief(topic);
};

export const generateContent = async (toolId: string, prompt: string, options?: any): Promise<ToolOutput> => {
  const latency = toolId === 'short-video' ? 3000 : 1500;
  const start = Date.now();
  const { subject, keywords } = inferSubject(prompt);
  const seed = Math.floor(Math.random() * 10000);
  
  let resultData: any = null;

  if (toolId === 'blog-studio') {
    const aiPrompt = `Act as an expert copywriter. Write a complex blog post about "${subject}". 
    The tone should be professional and thought-provoking.
    Return JSON with:
    {
      "ideas": ["string", "string", "string"],
      "finalPost": {
        "title": "string",
        "subtitle": "string",
        "blocks": [
          {"type": "heading", "content": "string", "level": 2},
          {"type": "paragraph", "content": "string"},
          {"type": "quote", "content": "string"},
          {"type": "list", "items": ["string", "string"]},
          {"type": "separator"}
        ]
      }
    }`;

    const [aiResult, imageUrl] = await Promise.all([
      callAI(aiPrompt),
      generateRealImage(`Cinematic professional header for ${subject}, professional photography, high-tech style`)
    ]);

    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'blog';
        resultData.finalPost.imageUrl = imageUrl || generateImageURL(`Cinematic professional header for ${subject}, ${keywords}`, 1200, 600, seed);
      } catch (e) {}
    }

  } else if (toolId === 'storyboard') {
    const count = options?.frameCount || 4;
    const aiPrompt = `Create a ${count}-frame cinematic storyboard about "${subject}". 
    The narrative must build tension or curiosity.
    CRITICAL: The FINAL frame MUST contain a shocking, subversive, or deeply ironic twist that completely recontextualizes the previous frames. Think like a "Black Mirror" or "Twilight Zone" ending.
    Return JSON with:
    {
      "scenes": [{"description": "string"}]
    }`;

    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'storyboard';
        resultData.scenes = resultData.scenes.map((s: any, i: number) => ({
          description: s.description,
          imageUrl: generateImageURL(`Cinematic storyboard scene ${i + 1} about ${subject}, ${keywords}, dramatic lighting`, 800, 450, seed + i)
        }));
      } catch (e) {}
    }

  } else if (toolId === 'ad-creator') {
    const aiPrompt = `Create high-conversion ad copy for "${subject}". 
    Return JSON with:
    {
      "headline": "string",
      "cta": "string"
    }`;

    const [aiResult, imageUrl] = await Promise.all([
      callAI(aiPrompt),
      generateRealImage(`Vertical minimalist high-end advertisement visual for ${subject}`, 1080, 1920)
    ]);

    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'ad';
        resultData.imageUrl = imageUrl || generateImageURL(`High-end vertical advertisement visual for ${subject}, ${keywords}`, 1080, 1920, seed);
      } catch (e) {}
    }

  } else if (toolId === 'podcast') {
    const aiPrompt = `Write a short podcast intro script about "${subject}". 
    Return JSON with:
    {
      "topicOptions": ["string", "string"],
      "script": "string"
    }`;

    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'audio';
        resultData.audioUrl = MOCK_AUDIO_BLOB; // OpenRouter doesn't do TTS
      } catch (e) {}
    }

  } else if (toolId === 'devils-advocate') {
    const aiPrompt = `Critique "${subject}" brutally but professionally. 
    Return JSON with:
    {
      "title": "string",
      "sections": [{"heading": "string", "items": ["string"]}]
    }`;

    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'strategy';
      } catch (e) {}
    }

  } else if (toolId === 'quiz-magnet') {
    const aiPrompt = `Create a 3-question quiz about "${subject}". 
    Return JSON with:
    {
      "questions": [{"q": "string", "options": ["string"], "answer": "string"}]
    }`;

    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'quiz';
      } catch (e) {}
    }
  } else if (toolId === 'landing-page') {
    const aiPrompt = `Design a landing page wireframe for "${subject}".
    Return JSON with:
    {
      "sections": [
        {"type": "hero", "title": "string", "content": "string"},
        {"type": "features", "title": "string", "content": "string"},
        {"type": "social", "title": "string", "content": "string"}
      ]
    }`;
    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'landing';
        // Add a primary high-res hero image in the result
        resultData.heroImageUrl = generateImageURL(`Cinematic 8k high fidelity hero visual for ${subject}, professional photography, realistic, atmospheric`, 1200, 800, seed);
      } catch (e) {}
    }
  } else if (toolId === 'email-sequence') {
    const aiPrompt = `Write a 3-email drip sequence for "${subject}".
    Return JSON with:
    {
      "emails": [{"type": "string", "subject": "string", "body": "string"}]
    }`;
    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'email';
      } catch (e) {}
    }
  } else if (toolId === 'carousel') {
    const aiPrompt = `Create a 5-slide LinkedIn carousel about "${subject}".
    Return JSON with:
    {
      "slides": [{"title": "string", "content": "string", "color": "bg-blue-600"}]
    }`;
    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'carousel';
        resultData.slides = resultData.slides.map((s: any, i: number) => ({
          ...s,
          imageUrl: generateImageURL(`Expert presentation slide about ${subject}, professional clean design, ${keywords}`, 1080, 1350, seed + i)
        }));
      } catch (e) {}
    }
  } else if (toolId === 'campaign-master') {
    const aiPrompt = `Create a marketing campaign strategy for "${subject}".
    Return JSON with:
    {
      "title": "string",
      "sections": [{"heading": "string", "items": ["string"]}]
    }`;
    const aiResult = await callAI(aiPrompt);
    if (aiResult) {
      try {
        resultData = JSON.parse(aiResult.replace(/```json|```/g, '').trim());
        resultData.type = 'strategy';
      } catch (e) {}
    }
  }

  const elapsed = Date.now() - start;
  if (elapsed < latency) await wait(latency - elapsed);

  if (resultData) return resultData as ToolOutput;
  return getMockData(toolId, prompt, options);
};

