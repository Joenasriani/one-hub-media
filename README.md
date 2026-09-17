# One Hub Media

**Author:** Joe Nasr  
**Identity:** https://joe-nasr-signals.vercel.app/v2/

One Hub Media is an experimental browser workspace that groups text, research, image, audio, and media planning tools behind a shared topic context.

## Current status

Working prototype.

The application includes interfaces for article drafting, storyboard planning, advertising concepts, landing page structures, campaign hypotheses, email sequences, quizzes, carousel drafts, and other media planning tasks. Provider availability depends on configured environment variables and the capability map exposed by the application.

## Data boundary

Fallback content in `constants.ts` is explicitly demo material. It must not be represented as live reporting, verified market data, published research, real user statistics, or sourced performance evidence.

Live factual research requires a configured research provider and source verification. Generated copy should be treated as a draft until factual claims, dates, quotations, numbers, and named sources are checked.

## Providers

Primary text routing uses OpenRouter. Optional image generation can use the configured external image provider. Audio, TTS, and video tools remain unavailable unless the corresponding external provider is configured.

## Local setup

Prerequisite: Node.js.

```bash
npm install
```

Copy the environment template and configure the providers you intend to use.

```bash
cp .env.example .env.local
npm run dev
```

Repository: https://github.com/Joenasriani/one-hub-media
