# Vercel environment setup (One Hub Media)

For reliable production behavior, configure environment variables in all relevant Vercel environments:

## Required by environment

- **Production**: values must be set for the live domain.
- **Preview**: values must be set for PR/branch preview deployments.
- **Development**: values must be set for local development (`vercel dev` / `npm run dev`).

## Core variables

- `OPENROUTER_API_KEY` (required)
- `OPENROUTER_SITE_URL=https://<your-production-domain>` (recommended for OpenRouter attribution and routing)
- `OPENROUTER_APP_NAME=One Hub Media` (recommended for OpenRouter attribution)
- `AI_MODEL=openrouter/auto` (fallback model)
- `TEXT_MODEL=openrouter/auto` (text route model)
- `RESEARCH_MODEL=openrouter/auto` (research route model)
- `VISION_MODEL=meta-llama/llama-3.2-vision-instruct:free` (vision route model)
- `REPLICATE_API_KEY` (optional; required only for image generation)
- `IMAGE_MODEL=stability-ai/sdxl` (optional image model override for Replicate)
- `OPENROUTER_TIMEOUT_MS` (optional; defaults to `30000`)

## Important deployment notes

1. After changing env vars in Vercel, you **must redeploy** for changes to take effect.
2. Text/research/vision generation use OpenRouter with `POST https://openrouter.ai/api/v1/chat/completions`.
3. Image generation is only available when `REPLICATE_API_KEY` is set; audio and video are intentionally disabled in the free version.
4. Never expose secret keys in `NEXT_PUBLIC_*` or other client-exposed variables.
5. `OPENROUTER_API_KEY` must be the raw key string only (no `Bearer ` prefix, no quotes).
6. If you see `User not found`, the key is invalid/revoked or belongs to a different OpenRouter account; generate a fresh key and redeploy.
