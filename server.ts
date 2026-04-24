import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, model = "openrouter/auto", systemInstruction } = req.body;
    let openRouterKey = process.env.OPENROUTER_API_KEY || process.env.ONE_HUB_MEDIA_API;
    let geminiKey = process.env.GEMINI_API_KEY;

    try {
      // If we have a Gemini API key exposed by AI Studio, we'll use it to guarantee free generation
      // and prevent 402 Insufficient Credit errors that happen with openrouter/auto
      if (geminiKey && !openRouterKey) {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json"
          }
        });
        return res.json({ text: response.text });
      }

      if (!openRouterKey && !geminiKey) {
        return res.status(500).json({ error: "No API Key configured." });
      }

      // Automatically map to a free model on OpenRouter if 'auto' or 'free' is requested
      let targetModel = model;
      if (model.includes("auto") || model.includes("free")) {
         targetModel = "google/gemini-2.5-pro"; // Fallback to a solid model if auto fails. (Requires paid openrouter though)
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "One AI Hub",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model.includes("free") ? "google/gemini-2.5-pro:free" : targetModel,
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      
      // If OpenRouter returns an error (like 402), fallback to Gemini if available
      if (data.error) {
         if (geminiKey) {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const geminiRes = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
              }
            });
            return res.json({ text: geminiRes.text });
         }
         throw new Error(data.error.message || "OpenRouter failed");
      }
      
      const text = data.choices?.[0]?.message?.content || null;
      res.json({ text });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
  });

  app.post("/api/ai/tts", async (req, res) => {
    const { text, voice = "Kore" } = req.body;
    let geminiKey = process.env.GEMINI_API_KEY;

    try {
      if (geminiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: geminiKey });

          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: text }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                  },
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            return res.json({ audio: `data:audio/wav;base64,${base64Audio}` });
          }
        } catch (geminiError: any) {
          console.warn("Gemini TTS failed, falling back...", geminiError.message);
        }
      }

      // Fallback to free google-tts-api
      const googleTTS = await import('google-tts-api');
      const base64Audio = await googleTTS.getAudioBase64(text.substring(0, 200), {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });
      return res.json({ audio: `data:audio/mp3;base64,${base64Audio}` });

    } catch (error: any) {
      console.error("TTS generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate TTS" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
