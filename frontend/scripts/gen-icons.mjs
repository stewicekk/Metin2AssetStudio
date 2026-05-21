import { readFileSync, writeFileSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';

const sizes = [192, 512];

async function main() {
  const svg = readFileSync('public/icon.svg', 'utf-8');
  const img = await loadImage(Buffer.from(svg));
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    writeFileSync(`public/icon-${size}.png`, canvas.toBuffer('image/png'));
    console.log(`Generated public/icon-${size}.png (${size}x${size})`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
