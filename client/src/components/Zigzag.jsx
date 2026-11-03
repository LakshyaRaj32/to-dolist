/** Decorative zigzag lines from the Figma onboarding screen. */
export default function Zigzag({ className }) {
  const rows = [10, 24, 38, 52];
  const line = (y) => Array.from({ length: 9 }, (_, i) => `${i * 12},${i % 2 ? y - 8 : y}`).join(' ');
  return (
    <svg viewBox="0 0 96 60" fill="none" className={className} aria-hidden>
      {rows.map((y) => (
        <polyline key={y} points={line(y)} stroke="currentColor" strokeWidth="4.5" strokeLinejoin="miter" />
      ))}
    </svg>
  );
}
