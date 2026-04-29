import sharp from 'sharp';

const [,, whitePath, blackPath, outputPath] = process.argv;

if (!whitePath || !blackPath || !outputPath) {
  console.error('Usage: npx tsx matte.ts <white-bg.png> <black-bg.png> <output.png>');
  process.exit(1);
}

async function diffMatte(whiteBgPath: string, blackBgPath: string, out: string) {
  const [white, black] = await Promise.all([
    sharp(whiteBgPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(blackBgPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  const { width, height } = white.info;
  const wData = white.data;
  const bData = black.data;
  const result = Buffer.alloc(width * height * 4);

  // Euclidean distance from pure white (#FFF) to pure black (#000) in RGB space
  const bgDist = Math.sqrt(3 * 255 * 255);

  for (let px = 0; px < width * height; px++) {
    const i = px * 4;
    const dr = wData[i]     - bData[i];
    const dg = wData[i + 1] - bData[i + 1];
    const db = wData[i + 2] - bData[i + 2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    const alpha = Math.max(0, Math.min(1, 1 - dist / bgDist));

    if (alpha < 1 / 255) {
      result[i] = result[i + 1] = result[i + 2] = result[i + 3] = 0;
    } else if (alpha > 254 / 255) {
      // Fully opaque — use black-bg values directly (avoids division near 1.0)
      result[i]     = bData[i];
      result[i + 1] = bData[i + 1];
      result[i + 2] = bData[i + 2];
      result[i + 3] = 255;
    } else {
      // Un-premultiply: recover foreground color from black-bg composite
      result[i]     = Math.min(255, Math.round(bData[i]     / alpha));
      result[i + 1] = Math.min(255, Math.round(bData[i + 1] / alpha));
      result[i + 2] = Math.min(255, Math.round(bData[i + 2] / alpha));
      result[i + 3] = Math.round(alpha * 255);
    }
  }

  await sharp(result, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(out);

  console.log(`Saved: ${out} (${width}×${height})`);
}

diffMatte(whitePath, blackPath, outputPath).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
