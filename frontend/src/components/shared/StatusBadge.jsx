const badgeStyles = {
  'LIVE SHOW': 'bg-teal-400 text-primary',
  'COMEDY': 'bg-amber-500 text-primary',
  'FAILED': 'bg-red-500 text-white',
  'upcoming': 'bg-teal-400 text-primary',
  'completed': 'bg-green-500 text-white',
  'failed': 'bg-red-500 text-white',
  'waiting': 'bg-amber-500 text-primary',
};

export default function StatusBadge({ status, className = '' }) {
  const style = badgeStyles[status] || 'bg-gray-500 text-white';
  return (
    <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-sm inline-block ${style} ${className}`}>
      {status}
    </span>
  );
}
