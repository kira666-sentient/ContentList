export function getCategoryGradient(category) {
  const gradients = {
    movie: ['#f43f5e', '#fb923c'],
    tv: ['#8b5cf6', '#d946ef'],
    anime: ['#f472b6', '#f43f5e'],
    game: ['#10b981', '#3b82f6'],
    book: ['#f59e0b', '#ef4444'],
    music: ['#06b6d4', '#3b82f6'],
    podcast: ['#8b5cf6', '#6366f1'],
    default: ['#64748b', '#334155']
  };
  return gradients[category] || gradients.default;
}

export function getCategoryIconPath(category) {
  const icons = {
    movie: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>',
    tv: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>',
    anime: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>',
    game: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 12h.01M9 10.5h.01M15 13.5h.01M16.5 12h.01"/>',
    book: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
    music: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>',
    podcast: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>',
    default: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>'
  };
  return icons[category] || icons.default;
}

export function generateCustomPlaceholder(title, category) {
  const [color1, color2] = getCategoryGradient(category);
  const iconPath = getCategoryIconPath(category);
  
  // Clean up title for SVG rendering
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const words = safeTitle.split(' ');
  const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.4"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="600" height="900" fill="url(#grad)" />
      
      <!-- Pattern Overlay -->
      <path d="M0 0l600 900M600 0L0 900" stroke="#ffffff" stroke-width="2" stroke-opacity="0.05" />
      <circle cx="300" cy="450" r="250" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.05" />
      <circle cx="300" cy="450" r="150" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.05" />
      
      <!-- Icon -->
      <g transform="translate(220, 320) scale(6)" filter="url(#shadow)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" style="opacity: 0.95;">
          ${iconPath}
        </svg>
      </g>
      
      <!-- Text -->
      <text x="300" y="650" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
        ${firstLine}
      </text>
      <text x="300" y="700" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
        ${secondLine}
      </text>
      
      <text x="300" y="760" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#ffffff" opacity="0.7" text-anchor="middle" text-transform="uppercase" letter-spacing="4">
        CUSTOM ${category.toUpperCase()}
      </text>
    </svg>
  `;

  // Encode SVG to Data URI safely
  const encodedSvg = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}
