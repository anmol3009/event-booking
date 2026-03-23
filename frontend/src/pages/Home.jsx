import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ArrowRight, Calendar, Sparkles, Zap, Shield, Users } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import EventCard from '../components/home/EventCard';
import useTheme from '../store/useTheme';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Fetch events from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        // Normalise backend shape → EventCard shape
        const normalised = (data.events || []).map((e) => ({
          id:          e.eventId,
          title:       e.title,
          date:        e.date,
          location:    e.venue,
          price:       e.price || e.generalPrice || 500,
          category:    e.category || 'LIVE SHOW',
          description: e.description,
          image:       e.images?.[0] || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
        }));
        setEvents(normalised);
      } catch {
        // If backend is offline, show empty with no error toast (to avoid noise on homepage)
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, []);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [searchQuery, events]);


  return (
    <div>
      {/* Hero — Parallax + 3D */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Background video — event highlights reel */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(40%) brightness(0.25)', transform: 'scale(1.1)' }}
          >
            <source src="https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_24fps.mp4" type="video/mp4" />
            <source src="https://videos.pexels.com/video-files/1190735/1190735-hd_1920_1080_30fps.mp4" type="video/mp4" />
          </video>
          {/* Fallback image if video doesn't load */}
          <img
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&h=900&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'grayscale(60%) brightness(0.25)', zIndex: -1 }}
          />
        </motion.div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, #000 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.6) 50%, #fff 100%)',
          }}
        />

        {/* Floating accent orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="float-animation absolute top-20 right-[20%] w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7DA8CF, transparent)', filter: 'blur(60px)' }} />
          <div className="float-animation absolute bottom-40 left-[10%] w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #A78BFA, transparent)', filter: 'blur(80px)', animationDelay: '3s' }} />
        </div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-6 flex flex-col justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '80px' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-bold mb-6" style={{ color: '#7DA8CF' }}>
                Smart Event Ticketing
              </p>
              <h1
                className="font-heading font-bold leading-[0.9] mb-6"
                style={{
                  fontSize: 'clamp(3rem, 9vw, 7rem)',
                  color: isDark ? '#fff' : '#111',
                  letterSpacing: '-0.04em',
                }}
              >
                Live events,<br />
                <span className="gradient-text">reimagined.</span>
              </h1>
              <p
                className="text-lg max-w-xl mb-10 leading-relaxed"
                style={{ color: isDark ? '#888' : '#666' }}
              >
                Real-time seat booking. Controlled resale. Smart waitlists.
                No double bookings, ever.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#events" className="btn-primary no-underline flex items-center gap-2 text-base py-3 px-8">
                  Browse Events <ArrowRight className="w-5 h-5" />
                </a>
                <Link to="/calendar" className="btn-outline no-underline flex items-center gap-2 py-3 px-8">
                  <Calendar className="w-4 h-4" /> View Calendar
                </Link>
              </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-6 h-10 rounded-full border-2 flex justify-center pt-2" style={{ borderColor: isDark ? '#333' : '#ccc' }}>
                <div className="w-1 h-2 rounded-full" style={{ background: '#7DA8CF' }} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
              What&apos;s On
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold font-heading"
              style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
            >
              Upcoming Events
            </h2>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDark ? '#555' : '#aaa' }} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all"
              style={{
                background: isDark ? '#0a0a0a' : '#fafafa',
                borderColor: isDark ? '#222' : '#e5e5e5',
                color: isDark ? '#fff' : '#333',
              }}
            />
          </div>
        </div>

        {/* Gallery Grid */}
        {loadingEvents ? (
          <div className="flex justify-center items-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-20">
                {searchQuery ? (
                  <>
                    <p style={{ color: isDark ? '#555' : '#aaa' }} className="text-lg">No events match &quot;{searchQuery}&quot;</p>
                    <button onClick={() => setSearchQuery('')} className="btn-outline text-sm mt-4">Clear search</button>
                  </>
                ) : (
                  <>
                    <p style={{ color: isDark ? '#555' : '#aaa' }} className="text-lg">No events listed yet</p>
                    <p className="text-sm mt-2" style={{ color: isDark ? '#444' : '#bbb' }}>Be the first to list an event!</p>
                    <a href="/list-event" className="btn-primary text-sm mt-4 inline-block no-underline">List an Event</a>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>


      {/* Features — 3D cards with icons */}
      <section
        id="about"
        className="border-t transition-colors relative"
        style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
              Why CookMyShow
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold font-heading"
              style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
            >
              Built Different
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                num: '01',
                title: 'Real-Time Booking',
                desc: 'Every seat syncs instantly across all users. Firebase transactions ensure zero double-bookings.',
              },
              {
                icon: Shield,
                num: '02',
                title: 'Smart Resale',
                desc: 'Controlled marketplace with 2x price cap. Set your price, negotiate live, close deals instantly.',
              },
              {
                icon: Users,
                num: '03',
                title: 'Auto Waitlist',
                desc: 'FIFO queue with automatic seat reassignment. Get notified the moment a spot opens up.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="rounded-xl border p-8 relative overflow-hidden group transition-all duration-500"
                style={{
                  background: isDark ? '#0a0a0a' : '#fafafa',
                  borderColor: isDark ? '#1a1a1a' : '#eee',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#7DA8CF';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(125,168,207,0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#1a1a1a' : '#eee';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Large watermark number */}
                <span
                  className="absolute -top-4 -right-2 text-8xl font-bold font-heading pointer-events-none select-none"
                  style={{ color: isDark ? '#0f0f0f' : '#f5f5f5' }}
                >
                  {f.num}
                </span>

                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-5 relative z-10"
                  style={{ background: 'rgba(125,168,207,0.1)' }}
                >
                  <f.icon className="w-6 h-6" style={{ color: '#7DA8CF' }} />
                </div>

                <h3
                  className="text-xl font-bold font-heading mb-3 relative z-10"
                  style={{ color: isDark ? '#fff' : '#111' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: isDark ? '#666' : '#888' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip — with count-up animation */}
      <section
        className="border-t transition-colors"
        style={{
          borderColor: isDark ? '#1a1a1a' : '#eee',
          background: isDark ? '#050505' : '#f8f8f8',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '12K+', label: 'Tickets Sold' },
            { value: '500+', label: 'Events Hosted' },
            { value: 'Zero', label: 'Double Bookings' },
            { value: '98%', label: 'Satisfaction' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="text-3xl md:text-4xl font-bold font-mono gradient-text">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: isDark ? '#555' : '#aaa' }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
