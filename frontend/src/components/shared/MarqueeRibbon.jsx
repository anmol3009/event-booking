import useTheme from '../../store/useTheme';

const items = [
  'Arijit Singh Live — 12 Apr',
  'Zakir Khan Comedy Night — 20 Apr',
  'Tech Fest 2026 — 12 Apr',
  'EDM Festival — 10 Apr',
  'IPL Screening — 10 Apr',
  'Zero Double Bookings',
  'Smart Resale Marketplace',
  'Real-Time Seat Booking',
  'Automated Waitlist',
  'Secure Payments',
];

export default function MarqueeRibbon() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const separator = (
    <span
      className="mx-6 text-xs"
      style={{ color: '#7DA8CF', opacity: 0.6 }}
    >
      ✦
    </span>
  );

  const content = items.map((item, i) => (
    <span key={i} className="flex items-center shrink-0">
      <span
        className="text-xs uppercase tracking-[0.2em] font-bold whitespace-nowrap"
        style={{ color: isDark ? '#888' : '#666' }}
      >
        {item}
      </span>
      {separator}
    </span>
  ));

  return (
    <div
      className="border-y overflow-hidden py-3 relative"
      style={{
        borderColor: isDark ? '#1a1a1a' : '#e5e5e5',
        background: isDark ? '#050505' : '#f8f8f8',
      }}
    >
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10"
        style={{ background: `linear-gradient(to right, ${isDark ? '#050505' : '#f8f8f8'}, transparent)` }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10"
        style={{ background: `linear-gradient(to left, ${isDark ? '#050505' : '#f8f8f8'}, transparent)` }}
      />

      <div className="marquee-track">
        {content}
        {content}
      </div>
    </div>
  );
}
