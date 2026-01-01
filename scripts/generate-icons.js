const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '../public/favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Icon sizes to generate
const sizes = [
  { size: 192, name: 'icon-192x192.png', maskable: false },
  { size: 512, name: 'icon-512x512.png', maskable: false },
  { size: 192, name: 'icon-192x192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512x512-maskable.png', maskable: true },
];

// Function to create maskable version (with padding in safe zone)
async function createIcon(size, name, maskable) {
  const outputPath = path.join(__dirname, '../public', name);
  
  if (maskable) {
    // Maskable icons need 80% safe zone - so add 25% padding on each side
    const paddedSize = Math.round(size * 0.8); // Content should be 80% of total
    const padding = Math.round((size - paddedSize) / 2);
    
    // Create a background with the warm paper color
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 250, g: 248, b: 245, alpha: 1 } // #faf8f5
      }
    })
    .composite([{
      input: await sharp(svgBuffer)
        .resize(paddedSize, paddedSize)
        .toBuffer(),
      top: padding,
      left: padding
    }])
    .png()
    .toFile(outputPath);
    
    console.log(`✓ Created maskable icon: ${name} (${size}x${size}px with safe zone)`);
  } else {
    // Standard icons - direct conversion
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created icon: ${name} (${size}x${size}px)`);
  }
}

// Generate all icons
async function generateIcons() {
  console.log('🎨 Generating PWA icons from favicon.svg...\n');
  
  try {
    for (const { size, name, maskable } of sizes) {
      await createIcon(size, name, maskable);
    }
    
    console.log('\n✨ All PWA icons generated successfully!');
    console.log('📍 Icons saved to: public/');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
