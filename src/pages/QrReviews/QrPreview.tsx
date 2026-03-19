import { useEffect, useRef } from 'react';

interface QrPreviewProps {
  url: string;
  size?: number;
}

// Minimal QR code generator using canvas
// Uses a simple QR encoding approach via a Google Charts API image
// For production, replace with a library like 'qrcode' npm package
export function QrPreview({ url, size = 128 }: QrPreviewProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Use Google Charts QR API for rendering (no npm dependency)
  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${Math.max(size, 200)}x${Math.max(size, 200)}&chl=${encodeURIComponent(url)}&choe=UTF-8&chld=M|2`;

  return (
    <div data-qr-url={url} style={{ width: size, height: size }}>
      <img
        ref={imgRef}
        src={qrImageUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="block"
        crossOrigin="anonymous"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
