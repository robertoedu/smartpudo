import { useMemo } from "react";
import { encodeCode128B } from "../utils/code128";

export default function Barcode({ value }) {
  const bars = useMemo(() => {
    const pattern = encodeCode128B(value);
    let position = 10;
    const rectangles = [];
    [...pattern].forEach((width, index) => {
      const size = Number(width);
      if (index % 2 === 0) rectangles.push({ x: position, width: size });
      position += size;
    });
    return { rectangles, width: position + 10 };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={`Código de barras do produto ${value}`}
      viewBox={`0 0 ${bars.width} 64`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height: 64, background: "white" }}
    >
      {bars.rectangles.map((bar) => (
        <rect key={`${bar.x}-${bar.width}`} x={bar.x} y="0" width={bar.width} height="64" fill="#000" />
      ))}
    </svg>
  );
}
