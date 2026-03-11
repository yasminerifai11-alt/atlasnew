"use client";

interface PulsingDotProps {
  color?: string;
  size?: number;
}

export function PulsingDot({ color = "#22c55e", size = 6 }: PulsingDotProps) {
  return (
    <span className="relative inline-flex">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ backgroundColor: color, width: size, height: size }}
      />
    </span>
  );
}
