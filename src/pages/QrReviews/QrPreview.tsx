import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QrPreviewProps {
  url: string;
  size?: number;
  lang?: 'ar' | 'en';
}

export function QrPreview({ url, size = 128, lang = 'ar' }: QrPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderQr = async () => {
      if (!canvasRef.current || !url) return;

      setHasError(false);

      try {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#111111',
            light: '#FFFFFF',
          },
        });
      } catch (error) {
        if (!cancelled) {
          console.error('[Senda] QR render failed:', error);
          setHasError(true);
        }
      }
    };

    renderQr();

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  return (
    <div
      data-qr-url={url}
      style={{ width: size, height: size }}
      className="flex items-center justify-center"
    >
      {hasError ? (
        <div className="text-[10px] text-red-500 text-center leading-4">
          {lang === 'ar' ? 'فشل إنشاء QR' : 'QR generation failed'}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="block"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}
