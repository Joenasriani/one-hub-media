# Vercel environment setup (One Hub Media)

For reliable production behavior, configure environment variables in all relevant Vercel environments:

## Required by environment

- **Production**: values must be set for the live domain.
- **Preview**: values must be set for PR/branch preview deployments.
- **Development**: values must be set for local development (`vercel dev` / `npm run dev`).

## Core variables

- `OPENROUTER_API_KEY` (canonical OpenRouter key for text/research routes)
- `OPENROUTER_TEXT_MODEL` (optional; defaults to `openrouter/auto`)
- `ONE_HUB_MEDIA_API` (optional backward-compatible alias for `OPENROUTER_API_KEY`)
- `GEMINI_API_KEY` (required for TTS/audio routes)
- `GEMINI_TTS_MODEL` (optional; defaults to `gemini-3.1-flash-tts-preview`)
- `GEMINI_TTS_VOICE` (optional; defaults to `Kore`)
- `TTS_MAX_CHARS` (optional; if set, truncation warning is returned)
- `VIDEO_PROVIDER_API_KEY` (required for future real video generation)

## Important deployment notes

1. After changing env vars in Vercel, you **must redeploy** for changes to take effect.
2. Text/research generation uses OpenRouter routes only.
3. OpenRouter key does **not** imply support for all modalities—image/audio/video/PDF are routed independently.
4. Never expose secret keys in `NEXT_PUBLIC_*` or other client-exposed variables.
