export interface ImageAdjustment {
  zoom: number;
  x: number;
  y: number;
}

export function parsePhotoUrl(url: string | null | undefined): { url: string; adjustments: ImageAdjustment } {
  if (!url) {
    return { url: "", adjustments: { zoom: 1, x: 0, y: 0 } };
  }
  try {
    const parsed = new URL(url);
    const zoom = parseFloat(parsed.searchParams.get("zoom") || "1");
    const x = parseFloat(parsed.searchParams.get("x") || "0");
    const y = parseFloat(parsed.searchParams.get("y") || "0");
    const cleanUrl = url.split("?")[0];
    return { url: cleanUrl, adjustments: { zoom, x, y } };
  } catch {
    const cleanUrl = url.split("?")[0];
    const matchZoom = url.match(/[?&]zoom=([^&]+)/);
    const matchX = url.match(/[?&]x=([^&]+)/);
    const matchY = url.match(/[?&]y=([^&]+)/);
    return {
      url: cleanUrl,
      adjustments: {
        zoom: matchZoom ? parseFloat(matchZoom[1]) || 1 : 1,
        x: matchX ? parseFloat(matchX[1]) || 0 : 0,
        y: matchY ? parseFloat(matchY[1]) || 0 : 0,
      }
    };
  }
}

export function buildPhotoUrl(url: string, adjustments: ImageAdjustment): string {
  if (!url) return "";
  const cleanUrl = url.split("?")[0];
  const { zoom, x, y } = adjustments;
  if (zoom === 1 && x === 0 && y === 0) {
    return cleanUrl;
  }
  return `${cleanUrl}?zoom=${zoom.toFixed(3)}&x=${x.toFixed(1)}&y=${y.toFixed(1)}`;
}

export function getPhotoAdjustStyle(adjustments: ImageAdjustment) {
  const { zoom, x, y } = adjustments;
  return {
    transform: `scale(${zoom}) translate(${x}%, ${y}%)`,
    transformOrigin: "center center",
  };
}
