import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Calendar, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import useTheme from '../store/useTheme';

export default function Confirmation() {
  const location = useLocation();
  const { event, seats, tier, total, bookingId: stateBookingId } = location.state || {};
  const confettiDone = useRef(false);
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    if (!confettiDone.current) {
      confettiDone.current = true;
      const colors = ['#7DA8CF', '#67E8F9', '#A78BFA', '#4ADE80'];
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors });
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, colors }), 500);
    }
  }, []);

  const bookingId = stateBookingId || `CMS-${Date.now().toString(36).toUpperCase()}`;

  if (!event) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center"><h2 style={{ color: isDark ? '#fff' : '#111' }}>No booking data found.</h2></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }} className="text-center mb-10">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(74,222,128,0.15)' }}>
          <Check className="w-8 h-8" style={{ color: '#4ADE80' }} />
        </div>
        <h2 className="text-3xl font-bold font-heading mb-2" style={{ color: isDark ? '#fff' : '#111' }}>Booking Confirmed</h2>
        <p style={{ color: isDark ? '#666' : '#999' }}>Your tickets are ready</p>
      </motion.div>

      {/* Boarding Pass */}
      <motion.div
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: isDark ? '#0a0a0a' : '#fff', border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}
      >
        {/* Shimmer */}
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute inset-0 w-1/3 z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(125,168,207,0.08), rgba(167,139,250,0.08), transparent)' }}
          />

          <div className="flex flex-col md:flex-row">
            {/* Main */}
            <div className="flex-1 p-8">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7DA8CF' }}>CookMyShow</span>
                <span className="text-xs" style={{ color: isDark ? '#444' : '#ccc' }}>•</span>
                <span className="text-xs uppercase tracking-widest" style={{ color: isDark ? '#444' : '#ccc' }}>Boarding Pass</span>
              </div>

              <h3 className="text-2xl font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>{event.title}</h3>
              <p className="text-sm mb-6" style={{ color: isDark ? '#666' : '#999' }}>{event.date} &middot; {event.location}</p>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Tier', value: tier },
                  { label: 'Seats', value: seats.length },
                  { label: 'Total', value: `₹${total?.toLocaleString()}` },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: isDark ? '#444' : '#bbb' }}>{item.label}</p>
                    <p className="text-sm font-semibold font-mono" style={{ color: isDark ? '#fff' : '#111' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6" style={{ borderTop: `2px dashed ${isDark ? '#1a1a1a' : '#eee'}` }}>
                <p className="text-xs uppercase tracking-widest" style={{ color: isDark ? '#444' : '#bbb' }}>Booking ID</p>
                <p className="text-sm font-mono font-bold mt-1" style={{ color: isDark ? '#fff' : '#111' }}>{bookingId}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px" style={{ background: `repeating-linear-gradient(to bottom, ${isDark ? '#1a1a1a' : '#eee'} 0px, ${isDark ? '#1a1a1a' : '#eee'} 6px, transparent 6px, transparent 12px)` }} />
            <div className="md:hidden h-px" style={{ background: `repeating-linear-gradient(to right, ${isDark ? '#1a1a1a' : '#eee'} 0px, ${isDark ? '#1a1a1a' : '#eee'} 6px, transparent 6px, transparent 12px)` }} />

            {/* QR */}
            <div className="w-full md:w-48 p-8 flex flex-col items-center justify-center">
              <QRCodeSVG
                value={`${window.location.origin}/ticket/${bookingId}`}
                size={120}
                level="M"
                bgColor="transparent"
                fgColor={isDark ? '#fff' : '#111'}
              />
              <p className="text-xs font-mono mt-3" style={{ color: isDark ? '#444' : '#bbb' }}>{bookingId}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-wrap justify-center gap-3">
        {[
          { icon: Download, label: 'Download' },
          { icon: Copy, label: 'Copy Link', onClick: () => { navigator.clipboard?.writeText(`CookMyShow Ticket: ${bookingId}`); toast.success('Copied!'); }},
          { icon: Share2, label: 'Share' },
          { icon: Calendar, label: 'Calendar' },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className="btn-outline flex items-center gap-2 text-xs"
          >
            <btn.icon className="w-3.5 h-3.5" /> {btn.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
