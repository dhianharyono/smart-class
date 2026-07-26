const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="236" fill="url(#emeraldGrad)" />
  <g transform="translate(94, 94) scale(13.5)" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </g>
</svg>`;

fs.writeFileSync(path.resolve('src/app/icon.svg'), svgContent);
fs.writeFileSync(path.resolve('public/icon.svg'), svgContent);
console.log('Created SVG icons');

const pngSrc = 'C:\\Users\\dhian\\.gemini\\antigravity-ide\\brain\\a1f76428-10c3-435d-bbb0-ec8d0dc6e3b8\\smart_class_emerald_book_favicon_1785082965633.png';
const targets = [
  'src/app/icon.png',
  'src/app/apple-icon.png',
  'public/icon.png',
  'src/app/favicon.ico'
];

targets.forEach(t => {
  fs.copyFileSync(pngSrc, path.resolve(t));
  console.log('Updated', t);
});
