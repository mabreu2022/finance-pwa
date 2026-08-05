const fs = require('fs');
const path = require('path');

// Ícone SVG base
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad1)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">CF</text>
</svg>`;

// Criar um PNG simples usando canvas (simulado com um buffer de imagem base64)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Para simplificar, vamos criar arquivos SVG com os tamanhos corretos nos nomes
// Em um cenário real, você converteria SVG para PNG

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png.svg`;
  const filepath = path.join(iconsDir, filename);
  
  // Criar um SVG que representa o PNG
  const sizedSvg = svgIcon.replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`);
  
  fs.writeFileSync(filepath.replace('.png.svg', '.svg'), sizedSvg);
  console.log(`Created ${filename}`);
});

console.log('Icons generated successfully!');
