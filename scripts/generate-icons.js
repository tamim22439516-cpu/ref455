import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

// Primary source: Original pristine 3D TZ shopping bag logo uploaded by user
const srcLogo = path.join(publicDir, 'assets/aistudio/3D_TZ_Shopping_Bag_Logo-Picsart-AiImageEnhancer_57618c1d.png');

if (!fs.existsSync(srcLogo)) {
  console.error('Source pristine 3D logo not found at:', srcLogo);
  process.exit(1);
}

async function generateAllIcons() {
  console.log('[IconGenerator] Generating clean, full-bleed 3D TZ icons directly from pristine source (ZERO inner shape, 100% edge-to-edge)...');

  // 1. PWA 512x512 Icon - Clean full bleed, no inner squircle, no borders
  const pwa512 = await sharp(srcLogo)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'pwa-512x512.png'), pwa512);
  console.log('✓ Created pwa-512x512.png (512x512 clean full-bleed)');

  // 2. PWA Maskable 512x512 Icon - MUST be clean full-bleed with NO inner shape or squircle
  // The mobile OS launcher natively applies its squircle/circle mask to this image.
  // Because there is NO inner squircle inside the image, the mobile launcher displays a pristine clean shape with zero internal borders.
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'pwa-maskable-512x512.png'), pwa512);
  console.log('✓ Created pwa-maskable-512x512.png (512x512 clean full-bleed, NO inner shape)');

  // 3. PWA 192x192 Icon
  const pwa192 = await sharp(srcLogo)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'pwa-192x192.png'), pwa192);
  console.log('✓ Created pwa-192x192.png (192x192 clean full-bleed)');

  // 4. Apple Touch Icon 180x180 (iOS home screen - 100% opaque full bleed)
  const appleTouch = await sharp(srcLogo)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'apple-touch-icon.png'), appleTouch);
  console.log('✓ Created apple-touch-icon.png (180x180 clean full-bleed)');

  // 5. Logo PNG 512x512 (used by UI / brand logo fallback)
  fs.writeFileSync(path.join(publicDir, 'logo.png'), pwa512);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'logo.png'), pwa512);
  console.log('✓ Created public/logo.png (512x512 clean original logo)');

  // 6. Favicon PNG 64x64
  const fav64 = await sharp(srcLogo)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), fav64);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'favicon.png'), fav64);
  console.log('✓ Created favicon.png (64x64 clean)');

  // 7. Favicon ICO 32x32
  const fav32 = await sharp(srcLogo)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), fav32);
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'favicon.ico'), fav32);
  console.log('✓ Created favicon.ico (32x32 clean)');

  // 8. Generate SVG Icon embedding the clean 512x512 PNG
  const base64Png512 = pwa512.toString('base64');
  const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="512" height="512" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/png;base64,${base64Png512}" />
</svg>
`;
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
  if (fs.existsSync(distDir)) fs.writeFileSync(path.join(distDir, 'icon.svg'), svgContent, 'utf-8');
  console.log('✓ Created public/icon.svg (clean SVG wrapper)');

  console.log('\n[IconGenerator] All PWA icons generated with 100% full-bleed coverage, zero inner shapes, and pristine clarity!');
}

generateAllIcons().catch((err) => {
  console.error('[IconGenerator] Failed:', err);
  process.exit(1);
});
