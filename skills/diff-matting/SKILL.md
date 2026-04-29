---
name: diff-matting
description: Use when generating product images, logos, game assets, stickers, or any AI-generated image that needs a real transparent PNG background. Use when rembg, remove.bg, or segmentation tools give poor edges, colored halos, or destroy semi-transparent elements like glass, shadows, or glows.
---

# Diff Matting: AI Transparent Image Generation

## Overview

Generate the same subject on a white background and a black background, then extract the alpha channel from the pixel difference. Preserves semi-transparent elements—glass, shadows, smoke, soft edges—that segmentation-based tools destroy.

## Workflow

**Step 1 — Generate white background image**

Prompt must end with: `on a pure solid white #FFFFFF background`

**Step 2 — Edit to black background**

Feed the white-bg image into the model's **edit/inpaint mode** with:
`"Change the white background to a solid pure black #000000. Keep everything else exactly unchanged."`

**CRITICAL: Use edit mode, not re-generation.** Re-generation shifts foreground pixels between renders (pixel drift), creating halos and ghost edges in the final matte.

**Step 3 — Extract alpha channel**

**Python** (uses `diff_matting.py` in the project root):
```bash
pip install Pillow numpy
python3 diff_matting.py --white white-bg.png --black black-bg.png --output output.png

# If drift halos appear, erode the edges slightly:
python3 diff_matting.py --white white-bg.png --black black-bg.png --output output.png --erode 2
```

**TypeScript** (uses `matte.ts` in this skill directory):
```bash
npm install sharp && npm install -D tsx
npx tsx matte.ts white-bg.png black-bg.png output.png
```

Output is a real RGBA PNG with mathematically recovered alpha channel.

## Compatible Tools

Any model that can generate an image with a specified background colour and then edit that image to change only the background:

- **Nano Banana / Google Gemini** — image generation + edit mode (original technique)
- **Midjourney** — generate on white, then Vary (Subtle) with black background prompt
- **Stable Diffusion / SDXL** — img2img at low strength (0.2–0.3) for the edit step
- **DALL-E / GPT-image-1** — edit endpoint
- **Any instruction-following image editor** — the prompt matters more than the model

## Core Math

- `bgDist = √(3 × 255²) ≈ 441.67` — RGB distance from white to black
- `alpha = clamp(1 − pixelDist / bgDist, 0, 1)`
- `foreground = blackPixel / alpha` — un-premultiply to recover true color from black-bg composite

## Pixel Drift Warning

AI edit models rarely produce pixel-identical foregrounds. Residual drift creates faint halos around edges.

Mitigations:
- Add to prompt: `"Keep all foreground pixels pixel-perfect, completely unchanged"`
- Lower temperature / deterministic sampling if model supports it
- Production use: apply image alignment (ECC or template matching) before matting

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Re-generate instead of edit | Edit/inpaint mode — identical foreground required |
| JPEG inputs | Always use PNG — JPEG artifacts corrupt the math |
| Background not exactly white/black | Use exact #FFFFFF / #000000 in prompts |
| Prompt allows foreground to change | Explicit "keep everything else EXACTLY unchanged" |
| Missing alpha clamp | clamp to [0, 1] before ×255 conversion |

## vs Alternatives

| Tool | Semi-transparency | Edge quality | Complexity |
|------|------------------|--------------|------------|
| rembg / remove.bg | ✗ destroys it | Halos on AI gen | Zero setup |
| DiffuMatting (research) | ✓ | High | Complex |
| **Diff matting (this skill)** | ✓ preserves it | Good | One script |
