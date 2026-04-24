import { getMockData, getMockBrief, inferSubject, generateImageURL, MOCK_AUDIO_BLOB, CHARACTER_A_IDS, CHARACTER_B_IDS } from '../constants';
import { ToolOutput, ContextBrief } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize with safe API key access (environment variable)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System Instructions for Gemini
const SYSTEM_INSTRUCTION = `You are One AI Hub, a futuristic AI engine. 
Your goal is to generate high-quality, professional, and strictly structured JSON content. 
You must adhere to the user's specific topic ("Deep Subject"). 
Do not use markdown formatting in the response, only return the raw JSON object.`;

// Helper to delay for fallback simulation or UI pacing
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a real image using Imagen 4.0
 */
const generateRealImage = async (prompt: string, aspectRatio: string = '16:9'): Promise<string | null> => {
  if (!process.env.API_KEY) return null;
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio as any, // '16:9' | '9:16' | '1:1' | '3:4' | '4:3'
        outputMimeType: 'image/jpeg'
      }
    });
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64) {
      return `data:image/jpeg;base64,${base64}`;
    }
    return null;
  } catch (e) {
    console.warn("Imagen generation failed:", e);
    return null;
  }
};

/**
 * Generates real audio using Gemini TTS
 */
const generateRealAudio = async (text: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/wav;base64,${base64Audio}`;
    }
    return null;
  } catch (e) {
    console.warn("TTS generation failed:", e);
    return null;
  }
};

export const fetchGeminiBrief = async (topic: string): Promise<ContextBrief> => {
  try {
    if (!process.env.API_KEY) throw new Error("No API Key");

    const { subject } = inferSubject(topic);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a briefing about "${subject}". Return JSON with summary, headlines (3 items with title, source, time), and hashtags (4 items).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            headlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  time: { type: Type.STRING },
                }
              }
            },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ContextBrief;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.warn("Gemini Brief failed, using fallback", error);
    return getMockBrief(topic);
  }
};

export const generateContent = async (toolId: string, prompt: string, options?: any): Promise<ToolOutput> => {
  // Simulate minimal latency for UX consistency even if AI is fast
  const latency = toolId === 'short-video' ? 3000 : 1500;
  const start = Date.now();

  try {
    if (!process.env.API_KEY) throw new Error("No API Key");

    const { subject, keywords } = inferSubject(prompt);
    const seed = Math.floor(Math.random() * 10000);
    
    let resultData: any = null;

    // --- TOOL SPECIFIC AI LOGIC ---

    if (toolId === 'blog-studio') {
      // Parallel Execution: Text Content + Banner Image
      const [textResponse, imageResponse] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Write a blog post about "${subject}". Return JSON with 3 headline ideas and a finalPost object containing a title, a subtitle (engaging lead-in), and an array of content blocks (heading, paragraph, quote, list, separator).`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ideas: { type: Type.ARRAY, items: { type: Type.STRING } },
                finalPost: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    blocks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ['heading', 'paragraph', 'quote', 'list', 'separator'] },
                          content: { type: Type.STRING, nullable: true },
                          level: { type: Type.INTEGER, nullable: true },
                          items: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        generateRealImage(`A high quality, abstract, cinematic header image representing ${subject}, futuristic style, 8k resolution`, '16:9')
      ]);

      if (textResponse.text) {
        resultData = JSON.parse(textResponse.text);
        resultData.type = 'blog';
        // Use Real Image if successful, else Fallback
        resultData.finalPost.imageUrl = imageResponse || generateImageURL(keywords + ',abstract,technology', 1200, 600, seed);
      }

    } else if (toolId === 'storyboard') {
      const count = options?.frameCount || 4;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a ${count}-frame storyboard about "${subject}". The story must have a beginning, middle, and end. The FINAL frame must contain a clever narrative twist or surprise. Return JSON with an array of scenes, each having a description.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { description: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });

      if (response.text) {
        resultData = JSON.parse(response.text);
        resultData.type = 'storyboard';
        // Note: Generating 4-6 real images takes too long for this prototype flow, so we use the mock URL generator for the sequence
        resultData.scenes = resultData.scenes.map((s: any, i: number) => ({
          description: s.description,
          imageUrl: generateImageURL(`${keywords}, cinematic, storyboard scene ${i + 1}`, 800, 450, seed + i)
        }));
      }

    } else if (toolId === 'ad-creator') {
      // Parallel Execution: Ad Copy + Vertical Image
      const [textResponse, imageResponse] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Create a high-conversion ad copy for "${subject}". Return JSON with headline and cta.`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                cta: { type: Type.STRING }
              }
            }
          }
        }),
        generateRealImage(`A vertical, minimalist, high-end advertisement background for ${subject}, with empty space at the bottom for text`, '9:16')
      ]);

      if (textResponse.text) {
        resultData = JSON.parse(textResponse.text);
        resultData.type = 'ad';
        resultData.imageUrl = imageResponse || generateImageURL(keywords + ',vertical,minimalist', 1080, 1920, seed);
      }

    } else if (toolId === 'podcast') {
      // Sequential Execution: Script -> Audio
      const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short podcast intro script about "${subject}". Return JSON with topicOptions array and a script string.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topicOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              script: { type: Type.STRING }
            }
          }
        }
      });

      if (textResponse.text) {
        resultData = JSON.parse(textResponse.text);
        resultData.type = 'audio';
        // Generate Audio from the script
        const audioUrl = await generateRealAudio(resultData.script);
        resultData.audioUrl = audioUrl || MOCK_AUDIO_BLOB;
      }

    } else if (toolId === 'devils-advocate') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Critique the concept of "${subject}". Provide 3 weak points and a recommendation. Return JSON.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      });
      if (response.text) {
        resultData = JSON.parse(response.text);
        resultData.type = 'strategy';
      }

    } else if (toolId === 'quiz-magnet') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a 3-question quiz about "${subject}". Return JSON.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    q: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      if (response.text) {
        resultData = JSON.parse(response.text);
        resultData.type = 'quiz';
      }
    }

    // Ensure we wait at least the latency time for UX consistency (so transitions aren't too fast)
    const elapsed = Date.now() - start;
    if (elapsed < latency) await wait(latency - elapsed);

    if (resultData) {
      return resultData as ToolOutput;
    }

    // If we reached here and resultData is null but no error threw, throw to trigger fallback
    throw new Error("Tool not implemented in AI logic or empty result");

  } catch (e) {
    console.warn(`Gemini generation failed for ${toolId}, falling back to mock data.`, e);
    const elapsed = Date.now() - start;
    if (elapsed < latency) await wait(latency - elapsed);
    return getMockData(toolId, prompt, options);
  }
};
