import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar, MapPin, Clock } from 'lucide-react';
import useTheme from '../store/useTheme';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* Parse "12 April 2026" → Date object */
function parseEventDate(dateStr) {
  const parts = dateStr.split(' ');
  if (parts.length < 3) return null;
  const months = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  return new Date(Number(parts[2]), months[parts[1]], Number(parts[0]));
}

/* Group events by date key "YYYY-MM-DD" */
function groupEventsByDate(events) {
  const map = {};
  events.forEach((ev) => {
    const d = parseEventDate(ev.date);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  });
  return map;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventCalendar() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then((r) => r.json())
      .then((data) => {
        const normalised = (data.events || []).map((e) => ({
          id:       e.eventId,
          title:    e.title,
          date:     e.date,
          location: e.venue,
          price:    e.price,
          image:    e.images?.[0] || '',
        }));
        setEvents(normalised);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = eventsByDate[key] || [];
    if (events.length > 0) {
      setSelectedDate(day);
      setSelectedEvents(events);
    }
  };

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (day) => day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getEventsForDay = (day) => {
    if (!day) return [];
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate[key] || [];
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
          Schedule
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold font-heading"
          style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
        >
          Event Calendar
        </h2>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer transition-all"
          style={{ background: 'transparent', borderColor: isDark ? '#222' : '#ddd', color: isDark ? '#ccc' : '#444' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-2xl font-bold font-heading" style={{ color: isDark ? '#fff' : '#111' }}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer transition-all"
          style={{ background: 'transparent', borderColor: isDark ? '#222' : '#ddd', color: isDark ? '#ccc' : '#444' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs uppercase tracking-widest font-bold py-2" style={{ color: isDark ? '#444' : '#bbb' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const events = getEventsForDay(day);
          const hasEvent = events.length > 0;
          const topEvent = events[0];

          return (
            <motion.div
              key={i}
              whileHover={day ? { scale: 1.05 } : {}}
              onClick={() => day && handleDateClick(day)}
              className="relative rounded-lg overflow-hidden transition-all"
              style={{
                aspectRatio: '1',
                background: !day ? 'transparent' : hasEvent ? 'transparent' : (isDark ? '#0a0a0a' : '#f5f5f5'),
                border: `1px solid ${!day ? 'transparent' : isToday(day) ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#eee')}`,
                cursor: day ? (hasEvent ? 'pointer' : 'default') : 'default',
              }}
            >
              {day && (
                <>
                  {/* Event thumbnail as background */}
                  {hasEvent && topEvent && (
                    <>
                      <img
                        src={topEvent.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: isDark ? 'brightness(0.4)' : 'brightness(0.6)' }}
                      />
                      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
                    </>
                  )}

                  {/* Day number */}
                  <div className="relative z-10 p-1.5 flex flex-col h-full">
                    <span
                      className="text-sm font-bold font-mono"
                      style={{
                        color: hasEvent ? '#fff' : isToday(day) ? '#7DA8CF' : (isDark ? '#888' : '#444'),
                      }}
                    >
                      {day}
                    </span>

                    {/* Event list preview (top 3) */}
                    {hasEvent && (
                      <div className="mt-1 space-y-0.5 overflow-hidden" style={{ maxHeight: '55px' }}>
                        {events.slice(0, 3).map((ev, idx) => (
                          <div
                            key={`${ev.id}-${idx}`}
                            className="text-[10px] leading-tight font-semibold truncate"
                            style={{ color: '#fff', opacity: 0.95 }}
                          >
                            • {ev.title}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#fff' }}>
                            +{events.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected date events modal */}
      <AnimatePresence>
        {selectedDate && selectedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="rounded-xl border p-6 max-w-lg w-full"
              style={{ background: isDark ? '#0a0a0a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#eee' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#7DA8CF' }}>
                    {MONTH_NAMES[month]} {selectedDate}, {year}
                  </p>
                  <h3 className="text-lg font-bold font-heading mt-1" style={{ color: isDark ? '#fff' : '#111' }}>
                    {selectedEvents.length} Event{selectedEvents.length > 1 ? 's' : ''}
                  </h3>
                </div>
                <button onClick={() => setSelectedDate(null)} className="bg-transparent border-none cursor-pointer" style={{ color: isDark ? '#555' : '#999' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/event/${ev.id}`}
                    className="no-underline flex items-center gap-4 p-3 rounded-lg border transition-all"
                    style={{
                      borderColor: isDark ? '#1a1a1a' : '#eee',
                      background: isDark ? '#111' : '#f9f9f9',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#7DA8CF'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = isDark ? '#1a1a1a' : '#eee'; }}
                  >
                    <img src={ev.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-heading truncate" style={{ color: isDark ? '#fff' : '#111' }}>{ev.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs flex items-center gap-1" style={{ color: isDark ? '#666' : '#999' }}>
                          <Clock className="w-3 h-3" style={{ color: '#7DA8CF' }} /> 7:30 PM
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: isDark ? '#666' : '#999' }}>
                          <MapPin className="w-3 h-3" style={{ color: '#7DA8CF' }} /> {ev.location}
                        </span>
                      </div>
                      <p className="text-sm font-mono font-bold mt-1" style={{ color: '#7DA8CF' }}>₹{ev.price} onwards</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
