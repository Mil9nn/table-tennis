import React from "react";

/**
  BlinkingDotsLoader
  A modern, accessible blinking-dots loader built as a single-file React component.
  Props:
   - size: total size (px) of each dot (default 16)
   - color: CSS color string for the dots (default 'currentColor')
   - speed: cycle duration in seconds (default 0.9)
   - className: extra wrapper classes
   - label: accessible label (aria-label)
 */
export default function BlinkingDotsLoader({
  size = 6,
  color = "gray",
  speed = 2,
  className = "",
  label = "Loading",
}) {
  // ensure sensible values
  const dotSize = Math.max(6, Math.round(size));
  const gap = Math.max(3, Math.round(size * 0.4));

  const wrapperStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: `${gap}px`,
  };

  const dotBase = {
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: "9999px",
    background: color,
    display: "inline-block",
    transform: "translateY(0)",
    // hardware-accelerate for smoother transforms
    willChange: "opacity, transform",
  };

  return (
    <div role="status" aria-label={label} className={className} style={wrapperStyle}>
      {/* Scoped keyframes so the component is portable */}
      <style>{`
        @keyframes bdl-blink {
          0%, 80%, 100% { opacity: 0.18; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-1px); }
        }
      `}</style>

      <span
        aria-hidden
        style={{
          ...dotBase,
          animation: `bdl-blink ${speed}s infinite ease-in-out`,
          animationDelay: `0s`,
        }}
      />

      <span
        aria-hidden
        style={{
          ...dotBase,
          animation: `bdl-blink ${speed}s infinite ease-in-out`,
          animationDelay: `${(speed / 3).toFixed(3)}s`,
        }}
      />

      <span
        aria-hidden
        style={{
          ...dotBase,
          animation: `bdl-blink ${speed}s infinite ease-in-out`,
          animationDelay: `${((speed / 3) * 2).toFixed(3)}s`,
        }}
      />
    </div>
  );
}