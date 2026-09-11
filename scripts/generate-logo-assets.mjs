// Rasterizes the source vector artwork in brand/ into every logo/favicon
// asset the app actually references (see grep for "logo-mark|logo-full|
// favicon|apple-touch-icon" across src/ for the full list of consumers).
// Re-run this whenever brand/logo-mark.svg or brand/logo-full.svg changes —
// nothing reads the SVGs directly at runtime, only these generated rasters.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const brand = path.join(root, "brand");
const pub = path.join(root, "public");

const markSvg = readFileSync(path.join(brand, "logo-mark.svg"));
const fullSvg = readFileSync(path.join(brand, "logo-full.svg"));

async function png(svgBuffer, size, outFile) {
  const buf = await sharp(svgBuffer, { density: 384 }).resize(size, size).png().toBuffer();
  writeFileSync(outFile, buf);
  console.log(`wrote ${path.relative(root, outFile)} (${size}x${size})`);
  return buf;
}

// Minimal ICO container: a directory of PNG-compressed frames (valid per the
// ICO spec since Vista — no need to hand-roll raw BMP pixel data).
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const imageData = [];
  let offset = 6 + count * 16;

  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    imageData.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageData]);
}

async function main() {
  // App icon / nav mark
  await png(markSvg, 512, path.join(pub, "logo-mark-512.png"));

  // Favicons
  const fav16 = await png(markSvg, 16, path.join(pub, "favicon-16.png"));
  const fav32 = await png(markSvg, 32, path.join(pub, "favicon-32.png"));
  const fav48 = await sharp(markSvg, { density: 384 }).resize(48, 48).png().toBuffer();

  const ico = buildIco([
    { size: 16, buf: fav16 },
    { size: 32, buf: fav32 },
    { size: 48, buf: fav48 },
  ]);
  writeFileSync(path.join(root, "src", "app", "favicon.ico"), ico);
  console.log("wrote src/app/favicon.ico (16/32/48 multi-res)");

  // Apple touch icon — iOS applies its own corner rounding, so a full-bleed
  // square (no extra padding) is the right input.
  await png(markSvg, 180, path.join(pub, "apple-touch-icon.png"));

  // Full horizontal lockup (mark + wordmark) — used in the email header and
  // as the Open Graph share image. Rendered oversized then trimmed to the
  // actual ink (the wordmark doesn't fill the source viewBox's full width),
  // so the exported PNG has no dead whitespace after ".online".
  const fullBuf = await sharp(fullSvg, { density: 384 }).png().toBuffer();
  const trimmed = await sharp(fullBuf).trim({ background: "#ffffff", threshold: 5 }).toBuffer();
  const final = await sharp(trimmed).resize({ width: 700 }).png().toBuffer();
  writeFileSync(path.join(pub, "logo-full.png"), final);
  const meta = await sharp(final).metadata();
  console.log(`wrote public/logo-full.png (${meta.width}x${meta.height}, trimmed)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
