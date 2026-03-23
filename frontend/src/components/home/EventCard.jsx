import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import useTheme from '../../store/useTheme';

const categoryColors = {
  'LIVE SHOW': '#7DA8CF',
  'COMEDY': '#F59E0B',
  'FAILED': '#EF4444',
};

export default function EventCard({ event }) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
    >
      <Link to={`/event/${event.id}`} className="no-underline block">
        {/* Image with grayscale-to-color on hover (bridgeworx signature) */}
        <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
            style={{
              filter: isDark ? 'grayscale(100%) brightness(0.8)' : 'grayscale(40%)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.filter = 'grayscale(0%) brightness(1)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.filter = isDark ? 'grayscale(100%) brightness(0.8)' : 'grayscale(40%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
          {/* Category badge — top right */}
          <div className="absolute top-3 right-3">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm"
              style={{
                background: categoryColors[event.category] || '#7DA8CF',
                color: '#000',
              }}
            >
              {event.category}
            </span>
          </div>
          {/* Gradient at bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3"
            style={{
              background: `linear-gradient(to top, ${isDark ? '#000' : '#fff'}, transparent)`,
            }}
          />
        </div>

        {/* Content below image */}
        <div className="pt-4 pb-2">
          <h4
            className="text-lg font-bold font-heading mb-1 transition-colors duration-300 group-hover:opacity-80"
            style={{ color: isDark ? '#fff' : '#111' }}
          >
            {event.title}
          </h4>
          <p
            className="text-xs uppercase tracking-widest mb-2 font-medium"
            style={{ color: isDark ? '#555' : '#999' }}
          >
            {event.date} &middot; {event.location}
          </p>
          <p
            className="text-sm leading-relaxed mb-3 line-clamp-2"
            style={{ color: isDark ? '#777' : '#666' }}
          >
            {event.description?.slice(0, 100)}...
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold" style={{ color: '#7DA8CF' }}>
              ₹{event.price}
              <span className="text-xs font-normal ml-1" style={{ color: isDark ? '#555' : '#999' }}>onwards</span>
            </span>
            <span className="link-more text-xs group-hover:gap-2 transition-all">
              Learn more <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
