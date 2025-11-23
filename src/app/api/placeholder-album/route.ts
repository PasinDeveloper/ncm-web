import { NextResponse } from 'next/server';

export async function GET() {
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#d1d5db;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#grad)" stroke="#9ca3af" stroke-width="2"/>
    <text x="50%" y="45%" font-size="16" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif">No Cover</text>
    <text x="50%" y="65%" font-size="12" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif">Available</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
} 