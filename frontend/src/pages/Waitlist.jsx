import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Bell, BellRing } from 'lucide-react';
import useTheme from '../store/useTheme';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DigitRoller({ value, isDark }) {
  return (
    <motion.span
      key={value}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="inline-block text-5xl md:text-7xl font-bold font-mono"
      style={{ color: '#7DA8CF' }}
    >
      #{value}
    </motion.span>
  );
}

export default function Waitlist() {
  const { eventId } = useParams();
  const [eventTitle, setEventTitle] = useState('Loading…');
  const [position, setPosition] = useState(42);
  const [totalInQueue, setTotalInQueue] = useState(67);
  const [notifications, setNotifications] = useState({ email: true, sms: false });
  const [claimModal, setClaimModal] = useState(false);
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    fetch(`${API_BASE}/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => setEventTitle(data.event?.title || 'Event'))
      .catch(() => setEventTitle('Event'));
  }, [eventId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((p) => {
        if (p <= 1) {
          setClaimModal(true);
          return 1;
        }
        return p - 1;
      });
      setTotalInQueue((t) => Math.max(t - 1, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const queueDots = Math.min(totalInQueue, 30);
  const userDotIndex = Math.round((position / totalInQueue) * queueDots);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
          Queue
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold font-heading"
          style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
        >
          Waitlist
        </h2>
        <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#999' }}>{eventTitle}</p>
      </div>

      {/* Position Card */}
      <motion.div
        layout
        className="rounded-lg border p-10 text-center mb-8"
        style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}
      >
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: isDark ? '#555' : '#999' }}>Your position in queue</p>
        <AnimatePresence mode="wait">
          <DigitRoller value={position} isDark={isDark} />
        </AnimatePresence>
        <p className="text-sm mt-4" style={{ color: isDark ? '#555' : '#999' }}>
          out of {totalInQueue} people waiting
        </p>
      </motion.div>

      {/* Queue Visualization */}
      <div className="rounded-lg border p-6 mb-8" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
        <h3 className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: '#7DA8CF' }}>Queue Visualization</h3>
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-1">
          {Array.from({ length: queueDots }, (_, i) => {
            const isUser = i === userDotIndex;
            return (
              <motion.div
                key={i}
                animate={isUser ? { scale: [1, 1.3, 1] } : {}}
                transition={isUser ? { repeat: Infinity, duration: 2 } : {}}
                className="rounded-full flex-shrink-0 transition-all"
                style={{
                  width: isUser ? 20 : 12,
                  height: isUser ? 20 : 12,
                  background: isUser ? '#7DA8CF' : (i < userDotIndex ? (isDark ? '#333' : '#ccc') : (isDark ? '#1a1a1a' : '#e5e5e5')),
                  boxShadow: isUser ? '0 0 12px rgba(125,168,207,0.5)' : 'none',
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-xs" style={{ color: isDark ? '#444' : '#bbb' }}>
          <span>Front of queue</span>
          <span>Back of queue</span>
        </div>
      </div>

      {/* Estimated Wait */}
      <div
        className="rounded-lg border p-6 mb-8 flex items-center gap-4"
        style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(125,168,207,0.1)' }}>
          <Clock className="w-6 h-6" style={{ color: '#7DA8CF' }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: isDark ? '#555' : '#999' }}>Estimated wait</p>
          <p className="text-xl font-bold font-mono" style={{ color: isDark ? '#fff' : '#111' }}>~{position * 3} minutes</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-lg border p-6" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
        <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: '#7DA8CF' }}>
          <Bell className="w-4 h-4" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Notifications' },
            { key: 'sms', label: 'SMS Notifications' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: isDark ? '#ccc' : '#444' }}>{label}</span>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                className="w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none"
                style={{ background: notifications[key] ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#e5e5e5') }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: '#fff',
                    left: notifications[key] ? '22px' : '2px',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {claimModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="rounded-lg border p-8 max-w-md w-full text-center"
              style={{ background: isDark ? '#0a0a0a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#eee' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(125,168,207,0.15)' }}>
                <BellRing className="w-8 h-8" style={{ color: '#7DA8CF' }} />
              </div>
              <h3 className="text-xl font-bold font-heading mb-2" style={{ color: isDark ? '#fff' : '#111' }}>A Spot Just Opened!</h3>
              <p className="mb-6" style={{ color: isDark ? '#666' : '#999' }}>
                You have <span className="font-mono font-bold" style={{ color: '#7DA8CF' }}>5:00</span> minutes to claim your seat.
              </p>
              <button
                onClick={() => setClaimModal(false)}
                className="w-full py-3.5 rounded font-bold text-sm uppercase tracking-wider border-none cursor-pointer"
                style={{ background: '#7DA8CF', color: '#000' }}
              >
                Claim Now!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
