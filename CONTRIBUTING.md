# Contributing to diff-matting-skill

Thank you for your interest in contributing!

## Code of Conduct

Be respectful and constructive when engaging with other contributors or opening issues.

## Submitting Pull Requests

1. **Fork the repository** and clone it locally.
2. **Create a branch** from `main` (`git checkout -b feature/your-feature-name`).
3. **Make your changes** — see areas below for where contributions are most valuable.
4. **Test your changes** — run the Python or TypeScript matte scripts against real images and verify the alpha output looks correct.
5. **Submit a PR** referencing any related issues and describing what changed and why.

## Opening Issues

Bug reports and feature requests are welcome. When opening an issue please include:
- What you expected vs what happened
- Which image generation tool/model you used
- Whether the issue is in generation, editing, or the matte step
- Example images if possible (white-bg, black-bg, and broken output)

## Where Contributions Help Most

- **New model examples** — tested `generate.ts` / Python equivalents for other APIs (Gemini, OpenAI, Stability, Replicate)
- **Prompt improvements** — better prompts for specific subject types that reduce foreground drift
- **Matte algorithm improvements** — better handling of edge cases, coloured semi-transparency, or drift compensation
- **Additional language ports** — the matte algorithm is simple; ports to Go, Rust, Python-only, etc. are useful
- **Real example images** — before/after results showing the technique working on different subject types

## Skill Structure

```
skills/diff-matting/
  SKILL.md       — Claude Code skill definition (frontmatter + instructions)
  matte.ts       — TypeScript alpha extraction utility
  generate.ts    — End-to-end fal.ai pipeline (generation + edit + matte)
diff_matting.py  — Python alpha extraction utility (numpy + Pillow)
```

Changes to `SKILL.md` affect how Claude Code understands and uses the skill — test by reloading the skill in a Claude Code session and verifying the workflow still triggers correctly.
