
// A simple utility to generate consistent, deterministic SVG covers based on a string (e.g., title)

const COLORS = [
  ['#4f46e5', '#818cf8'], // Indigo
  ['#2563eb', '#60a5fa'], // Blue
  ['#7c3aed', '#a78bfa'], // Violet
  ['#db2777', '#f472b6'], // Pink
  ['#ea580c', '#fb923c'], // Orange
  ['#059669', '#34d399'], // Emerald
  ['#0891b2', '#22d3ee'], // Cyan
  ['#be123c', '#fb7185'], // Rose
];

const PATTERNS = [
    'circle', 'rect', 'diagonal'
];

// Simple hash function to turn a string into a number
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

interface CoverOptions {
    bpm?: number;
    customColors?: string[];
    emoji?: string;
}

export const generateTrackCover = (title: string, options: CoverOptions = {}): string => {
  const hash = hashCode(title);
  
  // Deterministic defaults
  const defaultColorSet = COLORS[hash % COLORS.length];
  const colorSet = (options.customColors && options.customColors.length >= 2) ? options.customColors : defaultColorSet;
  
  // Pattern Logic based on BPM or Hash
  let pattern = PATTERNS[hash % PATTERNS.length];
  if (options.bpm) {
      if (options.bpm < 100) pattern = 'circle'; // Slow -> Circles/Soft
      else if (options.bpm > 130) pattern = 'diagonal'; // Fast -> Diagonal/Sharp
      else pattern = 'rect'; // Medium -> Blocky
  }

  // Generate SVG string
  let svgContent = '';
  
  const width = 400;
  const height = 400;

  // Background Gradient
  svgContent += `
    <defs>
      <linearGradient id="grad${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colorSet[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colorSet[1]};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad${hash})" />
  `;

  // Overlay Pattern
  const accentColor = "rgba(255, 255, 255, 0.15)";
  
  if (pattern === 'circle') {
     const cx = (hash * 7) % width;
     const cy = (hash * 13) % height;
     const r = ((hash * 3) % 100) + 50;
     // Concentric ripples for slow vibes
     svgContent += `<circle cx="${width/2}" cy="${height/2}" r="${width*0.4}" fill="none" stroke="${accentColor}" stroke-width="2" />`;
     svgContent += `<circle cx="${width/2}" cy="${height/2}" r="${width*0.3}" fill="none" stroke="${accentColor}" stroke-width="4" />`;
     svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${accentColor}" />`;
  } else if (pattern === 'rect') {
     const x = (hash * 5) % width;
     const y = (hash * 11) % height;
     // Grid-like for mid tempo
     svgContent += `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#grid)" />`;
     svgContent += `<rect x="${x}" y="${y}" width="120" height="120" transform="rotate(${hash % 90} ${x+60} ${y+60})" fill="${accentColor}" />`;
  } else {
     // Stripe/Diagonal for high energy
     svgContent += `<path d="M0 0 L${width} ${height}" stroke="${accentColor}" stroke-width="40" />`;
     svgContent += `<path d="M${width} 0 L0 ${height}" stroke="${accentColor}" stroke-width="20" />`;
     svgContent += `<path d="M0 ${height/2} L${width} ${height/2}" stroke="${accentColor}" stroke-width="10" transform="rotate(45 ${width/2} ${height/2})" />`;
  }

  // Center Content: Emoji or Text
  if (options.emoji) {
    svgContent += `
        <text x="50%" y="55%" dy=".1em" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="160">
            ${options.emoji}
        </text>
    `;
  } else {
    const firstLetter = title.charAt(0).toUpperCase();
    svgContent += `
        <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="120" fill="rgba(255,255,255,0.2)">
        ${firstLetter}
        </text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svgContent}</svg>`;
  
  // Base64 encode
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};