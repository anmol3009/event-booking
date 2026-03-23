import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Play, ArrowRight, Film } from 'lucide-react';
import useTheme from '../store/useTheme';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FILTERS = ['All', 'Hindi', 'English', 'Tamil', 'Action', 'Comedy', 'Sci-Fi', 'Romance'];

function MovieCard({ movie, isDark, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/movie/${movie.id}`} className="no-underline block">
        {/* Poster */}
        <div className="relative overflow-hidden rounded-xl mb-3" style={{ aspectRatio: '2/3' }}>
          <img
            src={movie.image}
            alt={movie.title}
            className="w-full h-full object-cover transition-all duration-700"
            style={{ filter: isDark ? 'grayscale(100%) brightness(0.8)' : 'grayscale(40%) brightness(0.9)' }}
            onMouseOver={(e) => { e.currentTarget.style.filter = 'grayscale(0%) brightness(1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = isDark ? 'grayscale(100%) brightness(0.8)' : 'grayscale(40%) brightness(0.9)'; e.currentTarget.style.transform = 'scale(1)'; }}
          />

          {/* Rating badge */}
          <div className="absolute top-3 left-3">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#4ADE80', backdropFilter: 'blur(4px)' }}
            >
              <Star className="w-3 h-3 fill-current" /> {movie.rating}
            </span>
          </div>

          {/* Certification badge */}
          <div className="absolute top-3 right-3">
            <span
              className="text-[9px] font-bold uppercase px-2 py-1 rounded-sm"
              style={{ background: movie.certification === 'A' ? '#EF4444' : '#7DA8CF', color: movie.certification === 'A' ? '#fff' : '#000' }}
            >
              {movie.certification}
            </span>
          </div>

          {/* Book Now overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <Play className="w-6 h-6 fill-white" style={{ color: '#fff' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg" style={{ background: '#7DA8CF', color: '#000' }}>
              Book Now
            </span>
          </div>

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: `linear-gradient(to top, ${isDark ? '#000' : '#fff'}, transparent)` }} />
        </div>

        {/* Info */}
        <h4 className="text-sm font-bold font-heading mb-1 truncate" style={{ color: isDark ? '#fff' : '#111' }}>
          {movie.title}
        </h4>
        <p className="text-xs mb-1" style={{ color: isDark ? '#555' : '#999' }}>
          {movie.genre}
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? '#444' : '#bbb' }}>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {movie.duration}</span>
          <span>&middot;</span>
          <span>{movie.language}</span>
        </div>
        <p className="text-sm font-mono font-bold mt-1.5" style={{ color: '#7DA8CF' }}>
          ₹{movie.tiers[0].price} onwards
        </p>
      </Link>
    </motion.div>
  );
}

export default function Movies() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        const data = await res.json();
        const movieEvents = (data.events || []).filter(e => e.category?.toUpperCase() === 'MOVIE').map(e => ({
          ...e,
          id: e.eventId,
          image: e.images?.[0] || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&h=450&fit=crop',
          // Backend might not have these specific movie fields yet, using defaults or mapping
          language: e.language || 'Hindi',
          genre: e.genre || 'Action/Drama',
          rating: e.rating || 0,
          duration: e.duration || '2h 0m',
          certification: e.certification || 'UA',
          tiers: e.tiers || [{ price: e.price }]
        }));
        setMovies(movieEvents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const filteredMovies = useMemo(() => {
    if (activeFilter === 'All') return movies;
    return movies.filter(
      (m) =>
        m.language.toLowerCase() === activeFilter.toLowerCase() ||
        m.genre.toLowerCase().includes(activeFilter.toLowerCase())
    );
  }, [activeFilter, movies]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
          Now Showing
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold font-heading"
          style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
        >
          Book Movies
        </h2>
        <p className="text-sm mt-2 max-w-lg" style={{ color: isDark ? '#666' : '#999' }}>
          Explore the latest blockbusters in theatres now. Select a movie to book your seats instantly.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer transition-all border whitespace-nowrap"
            style={{
              background: activeFilter === f ? '#7DA8CF' : 'transparent',
              color: activeFilter === f ? '#000' : (isDark ? '#888' : '#666'),
              borderColor: activeFilter === f ? '#7DA8CF' : (isDark ? '#222' : '#ddd'),
              fontWeight: activeFilter === f ? 700 : 500,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Movie grid */}
      {loading ? (
        <div className="flex justify-center py-20">
           <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-20">
          <Film className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p style={{ color: isDark ? '#555' : '#888' }}>No movies available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} isDark={isDark} index={i} />
          ))}
        </div>
      )}

      {filteredMovies.length === 0 && (
        <div className="text-center py-20">
          <p style={{ color: isDark ? '#555' : '#aaa' }} className="text-lg">No movies found</p>
          <button onClick={() => setActiveFilter('All')} className="btn-outline text-sm mt-4">
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
