import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Ticket, DollarSign, BarChart3 } from 'lucide-react';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TIER_COLORS = ['#2DD4BF', '#F472B6', '#FBBF24', '#A78BFA'];

function AnimatedNumber({ value, prefix = '', suffix = '', isDark }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return (
    <span className="text-2xl md:text-3xl font-bold font-mono" style={{ color: isDark ? '#fff' : '#111' }}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

function EventListItem({ event, isDark, isSelected, onClick }) {
  const pct = event.totalSeats > 0
    ? Math.round(((event.totalSeats - (event.availableSeats || 0)) / event.totalSeats) * 100)
    : 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border cursor-pointer transition-all duration-200 flex items-center gap-4"
      style={{
        background: isSelected ? (isDark ? '#0f0f0f' : '#f5f5f5') : 'transparent',
        borderColor: isSelected ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#eee'),
      }}
    >
      {event.images?.[0] ? (
        <img src={event.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center" style={{ background: isDark ? '#1a1a1a' : '#eee' }}>
          <Ticket className="w-6 h-6" style={{ color: '#7DA8CF' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: isDark ? '#fff' : '#111' }}>{event.title}</p>
        <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>{event.date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-mono font-bold" style={{ color: '#7DA8CF' }}>{pct}%</p>
        <p className="text-[10px]" style={{ color: isDark ? '#444' : '#bbb' }}>sold</p>
      </div>
    </button>
  );
}

function EventAnalyticsView({ analytics, isDark }) {
  if (!analytics) return null;

  const tooltipStyle = {
    background: isDark ? '#0a0a0a' : '#fff',
    border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}`,
    borderRadius: '8px',
    color: isDark ? '#fff' : '#111',
    fontSize: '13px',
  };

  const cards = [
    { label: 'Tickets Sold', value: analytics.bookings?.confirmed || 0, icon: Ticket,     color: '#4ADE80' },
    { label: 'Unsold',       value: analytics.seats?.available   || 0, icon: Users,       color: '#3B82F6' },
    { label: 'Cancelled',    value: analytics.bookings?.cancelled || 0, icon: TrendingUp,  color: '#F59E0B' },
    { label: 'Revenue',      value: Math.round((analytics.revenue?.total || 0) / 1000),
      icon: DollarSign, color: '#7DA8CF', prefix: '₹', suffix: 'K' },
  ];

  const tierBreakdown = [
    { name: 'VIP',     value: analytics.breakdown?.vip?.total     || 0, fill: '#F472B6' },
    { name: 'General', value: analytics.breakdown?.general?.total || 0, fill: '#2DD4BF' },
  ].filter(t => t.value > 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold font-heading" style={{ color: isDark ? '#fff' : '#111' }}>{analytics.event?.title}</h3>
          <p className="text-xs uppercase tracking-wider" style={{ color: isDark ? '#555' : '#999' }}>
            {analytics.event?.date} · {analytics.event?.venue} · {analytics.seats?.total} capacity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-lg border p-4" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? '#555' : '#999' }}>{card.label}</span>
            </div>
            <AnimatedNumber value={card.value} prefix={card.prefix || ''} suffix={card.suffix || ''} isDark={isDark} />
          </motion.div>
        ))}
      </div>

      {tierBreakdown.length > 0 && (
        <div className="rounded-lg border p-5" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: '#7DA8CF' }}>Seat Category Breakdown</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {tierBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {tierBreakdown.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.fill }} />
                <span className="text-[11px]" style={{ color: isDark ? '#666' : '#999' }}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { mode } = useTheme();
  const { user } = useStore();
  const isDark = mode === 'dark';
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch all events from the backend on mount
  useEffect(() => {
    if (!user?.token) return;
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await fetch(`${API_BASE}/api/admin/events`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        setEvents(data.events || []);
        if (data.events?.length > 0) setSelectedEvent(data.events[0]);
      } catch (err) {
        toast.error('Could not load events. Is the backend running?');
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [user]);

  // Fetch analytics whenever selected event changes
  useEffect(() => {
    if (!selectedEvent) return;
    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const token = user?.token;
        const res = await fetch(`${API_BASE}/api/admin/analytics/${selectedEvent.eventId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch (err) {
        setAnalytics(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [selectedEvent, user]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>Analytics</p>
        <h2 className="text-4xl md:text-5xl font-bold font-heading" style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}>
          Admin Dashboard
        </h2>
        <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#999' }}>
          {events.length > 0 ? 'Select an event to view detailed analytics' : 'No events found. Create your first event!'}
        </p>
      </div>

      {loadingEvents ? (
        <div className="flex items-center justify-center py-24">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 rounded-xl border" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
          <Ticket className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? '#1a1a1a' : '#e5e5e5' }} />
          <p className="text-lg font-bold" style={{ color: isDark ? '#444' : '#bbb' }}>No events listed yet</p>
          <p className="text-sm mt-1" style={{ color: isDark ? '#333' : '#ccc' }}>Create an event first to see analytics here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          {/* Event list sidebar */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: '#7DA8CF' }}>
              <BarChart3 className="w-4 h-4" /> Your Events
            </h3>
            <div className="space-y-2">
              {events.map((event) => (
                <EventListItem
                  key={event.eventId}
                  event={event}
                  isDark={isDark}
                  isSelected={selectedEvent?.eventId === event.eventId}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          </div>

          {/* Analytics panel */}
          <AnimatePresence mode="wait">
            <motion.div key={selectedEvent?.eventId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-24">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
                </div>
              ) : analytics ? (
                <EventAnalyticsView analytics={analytics} isDark={isDark} />
              ) : (
                <div className="flex items-center justify-center py-24">
                  <p style={{ color: isDark ? '#555' : '#aaa' }}>Could not load analytics for this event.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
