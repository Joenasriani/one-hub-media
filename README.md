<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2b65dd05-c32b-45cc-b659-5831efbe287f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the required env vars in `.env.local`:
   - `OPENROUTER_API_KEY`
   - `AI_MODEL=openrouter/auto`
   - `TEXT_MODEL=openrouter/auto`
   - `RESEARCH_MODEL=openrouter/auto`
   - `VISION_MODEL=meta-llama/llama-3.2-vision-instruct:free`
   - Optional image generation: `REPLICATE_API_KEY` and `IMAGE_MODEL=stability-ai/sdxl`
3. Run the app:
   `npm run dev`
