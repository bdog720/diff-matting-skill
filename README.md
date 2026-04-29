# diff-matting-skill

A Claude Code skill that generates AI images with **real transparent backgrounds** using difference matting — no segmentation models, no green screens, no halos.

Works by generating the same subject twice (white background, then black background) and mathematically extracting the alpha channel from the pixel difference. Preserves semi-transparent elements — glass, shadows, smoke, soft edges — that tools like rembg and remove.bg destroy.

> Inspired by [this technique](https://jidefr.medium.com/generating-transparent-background-images-with-nano-banana-pro-2-1866c88a33c5) demonstrated with Google's Nano Banana Pro 2 image model.

---

## Install (Claude Code Skill)

Add to your `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "diff-matting": {
      "source": {
        "source": "github",
        "repo": "bdog720/diff-matting-skill"
      }
    }
  },
  "enabledPlugins": {
    "diff-matting@diff-matting": true
  }
}
```

Restart Claude Code. The skill loads automatically — just ask Claude to generate a transparent background image and it will follow the diff-matting workflow.

---

## Use Without Claude Code

### Python (no Node required)

```bash
pip install Pillow numpy
python3 diff_matting.py --white white-bg.png --black black-bg.png --output result.png

# Faint halo around edges? Erode slightly:
python3 diff_matting.py --white white-bg.png --black black-bg.png --output result.png --erode 2
```

### TypeScript / Node

```bash
npm install && npx tsx skills/diff-matting/matte.ts white-bg.png black-bg.png result.png
```

---

## Compatible AI Tools

The technique works with any model that can generate an image with a specified background colour and then edit that image to change only the background.

| Tool | Notes |
|------|-------|
| **Nano Banana / Google Gemini** | Original technique — image generation + edit mode |
| **Midjourney** | Generate on white, Vary (Subtle) with black background prompt |
| **Stable Diffusion / SDXL** | img2img at low strength (0.2–0.3) for the edit step |
| **DALL-E / GPT-image-1** | Edit endpoint |
| **Adobe Firefly** | Generative Fill for background swap |
| **Any instruction-following editor** | The prompts below matter more than the specific model |

**Key requirement:** Use the model's **edit or image-to-image mode** for the background swap — not a fresh re-generation. Re-generation shifts foreground pixels, creating halos in the final matte.

---

## Prompts

Copy these directly into your image generation tool. Replace `[SUBJECT]` with your description.

### Step 1 — White background (generation)

**Product / object:**
```
[SUBJECT], professional product photography, soft diffused studio lighting,
pure solid white #FFFFFF background, centered, no shadows on background,
high detail, sharp focus
```

**Game asset / character:**
```
[SUBJECT], game asset concept art, clean cell-shaded illustration,
pure solid white #FFFFFF background, centered composition,
no background elements, no environment, isolated character
```

**Logo / icon:**
```
[SUBJECT], flat vector style icon, crisp edges,
pure solid white #FFFFFF background, centered,
no texture, no drop shadow, no background detail
```

**Food / organic subject:**
```
[SUBJECT], editorial food photography, natural top lighting,
pure solid white #FFFFFF background, centered, minimal shadows,
photorealistic, high detail
```

**Jewelry / luxury:**
```
[SUBJECT], luxury product photography, soft box lighting with subtle specular highlights,
pure solid white #FFFFFF background, centered, slight reflection on surface,
ultra high detail, commercial grade
```

---

### Step 2 — Black background (edit prompt)

Use this in your model's **edit / image-to-image / inpaint mode** with the white-bg image as input.

**Universal edit prompt:**
```
Change the background from white to pure solid black #000000.
Keep every foreground element completely unchanged — same colors,
same edges, same lighting, same position, pixel-perfect preservation.
Do not alter the subject in any way.
```

**If the model allows strength control** (Stability AI, FLUX img2img):
- Set strength to `0.2–0.3` — low enough to change only the background
- Higher strength increases foreground drift and edge artifacts

---

## How it works

```
white-bg.png  ─┐
               ├─→ diff_matting.py / matte.ts ─→ output.png (RGBA)
black-bg.png  ─┘
```

For each pixel:

```
bgDist = √(3 × 255²) ≈ 441.67        # distance from white to black in RGB space
alpha  = 1 − pixelDist / bgDist       # 0 = background, 1 = fully opaque
color  = blackPixel / alpha            # un-premultiply to recover true foreground color
```

Opaque pixels appear identical on both backgrounds → `pixelDist ≈ 0` → `alpha ≈ 1`.
Background pixels match their respective backgrounds → `pixelDist ≈ bgDist` → `alpha ≈ 0`.
Semi-transparent pixels (glass, shadow, smoke) fall between.

### Options (Python script)

| Flag | Default | Use |
|------|---------|-----|
| `--erode N` | 0 | Shrink the mask N pixels — removes halos from foreground drift |
| `--threshold T` | 0.0 | Clip low-alpha pixels to zero — sharpens edges on solid subjects |

---

## Troubleshooting

**Halo around the subject** — foreground drifted between renders. Try `--erode 1` or `--erode 2`. Use a lower edit strength next time.

**Background not fully transparent** — background wasn't pure white/black. Check your generation prompt uses exact hex values `#FFFFFF` / `#000000`.

**Color fringing on semi-transparent edges** — JPEG compression artifacts. Always save intermediate images as PNG.

**Subject changed between renders** — model re-generated instead of editing. Use edit/inpaint/image-to-image mode, not a fresh generation.

---

## 💬 Feedback & Issues

Found a bug or have a prompt that works particularly well? Please [open an issue](https://github.com/bdog720/diff-matting-skill/issues) on GitHub.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details on submitting pull requests or issues.

## 📄 License

Licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 💖 Support the Project

If this skill saves you time, consider buying me a coffee!

<a href="https://buymeacoffee.com/bdog720" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 217px !important;" ></a>
