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
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border cursor-pointer transition-all duration-300 flex items-center gap-4 group"
      style={{
        background: isSelected ? (isDark ? 'rgba(125,168,207,0.1)' : '#f0f7ff') : 'transparent',
        borderColor: isSelected ? '#7DA8CF' : (isDark ? '#111' : '#eee'),
      }}
    >
      <div className="relative shrink-0">
        {event.images?.[0] ? (
          <img src={event.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: isDark ? '#111' : '#f9f9f9' }}>
            <Ticket className="w-5 h-5" style={{ color: '#7DA8CF' }} />
          </div>
        )}
        {isSelected && (
          <motion.div layoutId="activeDot" className="absolute -left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full" style={{ background: '#7DA8CF' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate transition-colors" style={{ color: isSelected ? '#7DA8CF' : (isDark ? '#fff' : '#111') }}>{event.title}</p>
        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: isDark ? '#333' : '#bbb' }}>{event.date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-mono font-bold" style={{ color: '#7DA8CF' }}>{pct}%</p>
        <div className="w-12 h-1 rounded-full bg-gray-800 mt-1 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-blue-400" />
        </div>
      </div>
    </motion.button>
  );
}

function EventAnalyticsView({ analytics, isDark }) {
  if (!analytics) return null;

  const tooltipStyle = {
    background: isDark ? 'rgba(10,10,10,0.9)' : '#fff',
    border: `1px solid ${isDark ? '#333' : '#eee'}`,
    borderRadius: '12px',
    color: isDark ? '#fff' : '#111',
    fontSize: '12px',
    backdropFilter: 'blur(10px)',
  };

  const cards = [
    { label: 'Tickets Sold', value: analytics.bookings?.ticketsSold || 0, icon: Ticket,     color: '#4ADE80' },
    { label: 'Unsold',       value: analytics.seats?.available    || 0, icon: Users,      color: '#3B82F6' },
    { label: 'Cancelled',    value: analytics.bookings?.cancelled || 0, icon: TrendingUp, color: '#F59E0B' },
    { label: 'Resold',       value: analytics.bookings?.resold    || 0, icon: BarChart3,  color: '#F43F5E' },
    { label: 'Revenue',      value: Math.round((analytics.revenue?.total || 0) / 1000), 
      icon: DollarSign, color: '#7DA8CF', prefix: '₹', suffix: 'K' },
  ];

  const tierBreakdown = [
    { name: 'VIP',     value: analytics.breakdown?.vip?.total     || 0, fill: '#F472B6' },
    { name: 'General', value: analytics.breakdown?.general?.total || 0, fill: '#2DD4BF' },
  ].filter(t => t.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}>
            {analytics.event?.title}
          </h3>
          <p className="text-sm font-medium tracking-wide" style={{ color: isDark ? '#444' : '#999' }}>
            {analytics.event?.date} &middot; {analytics.event?.venue} &middot; {analytics.seats?.total} CAPACITY
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border p-5 relative overflow-hidden group"
            style={{ 
              borderColor: isDark ? '#1a1a1a' : '#eee', 
              background: isDark ? 'linear-gradient(135deg, #0a0a0a 0%, #050505 100%)' : '#fff',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div 
              className="absolute -right-4 -top-4 w-12 h-12 rounded-full opacity-5 transition-transform group-hover:scale-150"
              style={{ background: card.color }}
            />
            <div className="flex items-center gap-2 mb-3">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#444' : '#999' }}>{card.label}</span>
            </div>
            <AnimatedNumber value={card.value} prefix={card.prefix || ''} suffix={card.suffix || ''} isDark={isDark} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Donut) */}
        <div className="rounded-2xl border p-6" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#050505' : '#fff' }}>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-8" style={{ color: '#7DA8CF' }}>Seat Category Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                  {tierBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {tierBreakdown.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
                <span className="text-xs font-bold" style={{ color: isDark ? '#444' : '#666' }}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Trend (Area Chart) */}
        <div className="rounded-2xl border p-6" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#050505' : '#fff' }}>
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#7DA8CF' }}>Daily Sales Trend</h4>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400">Last {analytics.dailySales?.length || 0} days</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Total', value: analytics.dailySales?.reduce((s, i) => s + i.revenue, 0) || 0, color: '#7DA8CF' },
              { label: 'Highest Day', value: Math.max(...(analytics.dailySales?.map(i => i.revenue) || [0])), color: '#fff' }
            ].map(sub => (
              <div key={sub.label} className="p-4 rounded-xl" style={{ background: isDark ? '#0a0a0a' : '#f9f9f9', border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{sub.label}</p>
                <p className="text-xl font-bold font-mono" style={{ color: sub.color }}>₹{sub.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailySales} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7DA8CF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7DA8CF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1a1a1a' : '#eee'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#444' : '#999', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v/1000)}k`} tick={{ fill: isDark ? '#444' : '#999', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#7DA8CF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Details Table */}
      {analytics.salesDetails?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#050505' : '#fff' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#7DA8CF' }}>Daily Sales Details</h4>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10" style={{ background: isDark ? '#0a0a0a' : '#fafafa' }}>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? '#444' : '#999' }}>
                  <th className="px-6 py-4 font-bold border-b" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>Owner</th>
                  <th className="px-6 py-4 font-bold border-b" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>Seat</th>
                  <th className="px-6 py-4 font-bold border-b" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>Seat Type</th>
                  <th className="px-6 py-4 font-bold border-b text-right" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {analytics.salesDetails.map((item, idx) => (
                  <tr key={idx} className="group transition-colors" style={{ background: isDark ? (idx % 2 === 0 ? 'transparent' : '#050505') : 'transparent' }}>
                    <td className="px-6 py-4 font-medium" style={{ color: isDark ? '#ccc' : '#444' }}>{item.owner}</td>
                    <td className="px-6 py-4 font-mono font-bold" style={{ color: '#7DA8CF' }}>{item.seat}</td>
                    <td className="px-6 py-4" style={{ color: isDark ? '#666' : '#999' }}>
                      <span className="px-2 py-0.5 rounded text-[10px] border font-bold" 
                        style={{ 
                          borderColor: (item.type === 'VIP' ? '#F472B6' : item.type === 'Premium' ? '#FBBF24' : '#2DD4BF') + '33',
                          color: item.type === 'VIP' ? '#F472B6' : item.type === 'Premium' ? '#FBBF24' : '#2DD4BF',
                          background: (item.type === 'VIP' ? '#F472B6' : item.type === 'Premium' ? '#FBBF24' : '#2DD4BF') + '05'
                        }}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold" style={{ color: '#4ADE80' }}>₹{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    <div className="min-h-screen" style={{ background: isDark ? '#000' : '#fff' }}>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-12 md:mb-16">
          <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
            className="text-[10px] uppercase tracking-[0.4em] font-bold mb-3" style={{ color: '#7DA8CF' }}>
            Internal Management
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-heading" style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.03em' }}>
            Admin Dashboard
          </motion.h2>
        </div>

        {loadingEvents ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border" style={{ borderColor: isDark ? '#111' : '#eee', background: isDark ? '#050505' : '#fafafa' }}>
            <Ticket className="w-16 h-16 mx-auto mb-6 opacity-20" style={{ color: '#7DA8CF' }} />
            <p className="text-xl font-bold" style={{ color: isDark ? '#333' : '#ccc' }}>No events found</p>
            <p className="text-sm mt-2 max-w-xs mx-auto text-gray-500">Create your first event to start seeing performance analytics here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">
            {/* Sidebar */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: isDark ? '#333' : '#999' }}>
                  Event Catalog ({events.length})
                </h3>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
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

            {/* Analytics Content */}
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedEvent?.eventId}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  {loadingAnalytics ? (
                    <div className="flex items-center justify-center h-[500px]">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
                    </div>
                  ) : analytics ? (
                    <EventAnalyticsView analytics={analytics} isDark={isDark} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] rounded-3xl border" style={{ borderColor: isDark ? '#111' : '#eee', background: isDark ? '#050505' : '#fafafa' }}>
                      <BarChart3 className="w-12 h-12 mb-4 opacity-10" style={{ color: '#7DA8CF' }} />
                      <p className="text-gray-500 font-medium">Select an event to view data</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
