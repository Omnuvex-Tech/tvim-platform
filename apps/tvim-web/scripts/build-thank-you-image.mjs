// Builds the thank-you backdrop variants that ThankYou.tsx references.
//
// This one image is deliberately kept out of next/image. It is a flat
// illustration, so avif beats webp badly on it (44 KB at 46 dB against 83 KB
// at 42 dB), but the optimizer needs ~4 s to encode avif at full width against
// ~0.3 s for webp. That cost would land on the first visitor of the page the
// image is the largest paint of, and turning `formats` on in next.config would
// charge it to every product image on the site as well. Encoding here instead
// gives the avif bytes with no transcode on the request path at all.
//
// Run after changing assets/thank-you-master.webp:  node scripts/build-thank-you-image.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const master = join(root, "assets", "thank-you-master.webp");
const outDir = join(root, "public", "images", "thank-you");

// The backdrop is always full-bleed (sizes="100vw"), so these track viewport
// width. 1902 is the master's own width — resizing past it would invent
// detail, so it is the ceiling even on 2x displays.
const WIDTHS = [640, 750, 1080, 1440, 1902];

// avif is given quality 70 and webp 90 because they sit at the same visual
// quality on this image; they are not meant to be the same number.
const FORMATS = [
  { ext: "avif", encode: (p) => p.avif({ quality: 70, effort: 6 }) },
  { ext: "webp", encode: (p) => p.webp({ quality: 90, effort: 6 }) },
];

await mkdir(outDir, { recursive: true });

for (const width of WIDTHS) {
  for (const { ext, encode } of FORMATS) {
    const buffer = await encode(
      sharp(master).resize({ width, withoutEnlargement: true }),
    ).toBuffer();
    const name = `bg-${width}.${ext}`;
    await writeFile(join(outDir, name), buffer);
    console.log(`${name.padEnd(16)} ${(buffer.length / 1024).toFixed(1)} KB`);
  }
}
