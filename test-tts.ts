import { GoogleGenAI, Modality } from "@google/genai";

async function run() {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.log("No GEMINI_API_KEY");
    return;
  }
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: 'Say cheerfully: Have a wonderful day!' }] }],
      config: {
        responseModalities: [Modality.AUDIO], // MUST use string 'AUDIO' if enum fails
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    console.log("Audio generated, length:", base64Audio?.length);
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}
run();
