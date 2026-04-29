import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const [,, prompt] = process.argv;
if (!prompt) {
  console.error('Usage: npx tsx generate.ts "<subject description>"');
  console.error('Example: npx tsx generate.ts "a glass perfume bottle with gold cap"');
  console.error('\nRequires: FAL_KEY env var — get one at fal.ai');
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY! });

async function saveUrl(url: string, dest: string): Promise<string> {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`  saved → ${dest}`);
  return dest;
}

async function main() {
  // Step 1: Generate on pure white background
  console.log('\n[1/3] Generating white-background image...');
  const genResult = await fal.subscribe('fal-ai/flux/dev', {
    input: {
      prompt: `${prompt}, on a pure solid white #FFFFFF background, clean product photography`,
      image_size: 'square_hd',
      num_inference_steps: 28,
    },
  });
  const whitePath = await saveUrl(genResult.data.images[0].url, 'white-bg.png');

  // Step 2: Edit to pure black background using instruction-following model.
  // FLUX Kontext is purpose-built for this — it follows "change only X" instructions
  // reliably while minimizing foreground drift.
  console.log('\n[2/3] Editing to black background...');
  const imageData = `data:image/png;base64,${fs.readFileSync(whitePath).toString('base64')}`;
  const editResult = await fal.subscribe('fal-ai/flux-kontext/dev', {
    input: {
      image_url: imageData,
      prompt: 'Change the white background to a pure solid black #000000. Keep all foreground elements completely unchanged, pixel-perfect.',
    },
  });
  await saveUrl(editResult.data.images[0].url, 'black-bg.png');

  // Step 3: Extract alpha channel via diff-matte
  console.log('\n[3/3] Extracting alpha channel...');
  const mattePath = path.join(__dirname, 'matte.ts');
  execSync(`npx tsx "${mattePath}" white-bg.png black-bg.png output.png`, { stdio: 'inherit' });

  console.log('\nDone. Transparent PNG → output.png');
  console.log('Intermediate files: white-bg.png, black-bg.png (keep for debugging)');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
