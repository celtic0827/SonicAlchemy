
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

  // Defs: Gradients and Filters
  svgContent += `
    <defs>
      <linearGradient id="grad${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colorSet[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colorSet[1]};stop-opacity:1" />
      </linearGradient>
      
      <filter id="glow-${hash}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="shadow-${hash}">
        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/>
      </filter>

      <pattern id="grid-${hash}" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
    </defs>
  `;

  // 1. Background
  svgContent += `<rect width="${width}" height="${height}" fill="url(#grad${hash})" />`;
  // Add subtle texture
  svgContent += `<rect width="${width}" height="${height}" fill="url(#grid-${hash})" />`;

  // 2. Overlay Pattern (Geometric Shapes)
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
     svgContent += `<rect x="${x}" y="${y}" width="140" height="140" transform="rotate(${hash % 90} ${x+70} ${y+70})" fill="${accentColor}" />`;
     svgContent += `<rect x="${width - x}" y="${height - y}" width="80" height="80" fill="none" stroke="${accentColor}" stroke-width="4" />`;
  } else {
     // Stripe/Diagonal for high energy
     svgContent += `<path d="M0 0 L${width} ${height}" stroke="${accentColor}" stroke-width="60" />`;
     svgContent += `<path d="M${width} 0 L0 ${height}" stroke="${accentColor}" stroke-width="30" />`;
     svgContent += `<path d="M0 ${height} L${width} 0" stroke="${accentColor}" stroke-width="10" />`;
  }

  // 3. Center Content: Emoji or Text
  if (options.emoji && options.emoji.trim() !== "") {
    // Spotlight behind emoji
    svgContent += `<circle cx="${width/2}" cy="${height/2}" r="110" fill="rgba(0,0,0,0.2)" filter="url(#glow-${hash})" />`;
    // Emoji text
    svgContent += `
        <text x="50%" y="55%" dy=".1em" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="180" filter="url(#shadow-${hash})">
            ${options.emoji}
        </text>
    `;
  } else {
    // Fallback Text
    const firstLetter = title.charAt(0).toUpperCase();
    svgContent += `
        <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="150" fill="rgba(255,255,255,0.25)">
        ${firstLetter}
        </text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgContent}</svg>`;
  
  // Base64 encode
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};
