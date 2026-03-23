import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Play, ArrowRight, Film } from 'lucide-react';
import useTheme from '../store/useTheme';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEMO_MOVIES = [
  {
    id: 'demo-pushpa2',
    title: 'Pushpa 2: The Rule',
    image: 'https://image.tmdb.org/t/p/w500/IE2bR3lpJ5wMVqhFajMCEIFV7Np.jpg',
    language: 'Telugu', genre: 'Action/Drama', rating: 8.4,
    duration: '3h 21m', certification: 'A',
    description: 'Pushpa Raj continues to expand his red sandalwood smuggling empire as a larger threat looms over him.',
    tiers: [{ name: 'General', price: 200 }, { name: 'VIP', price: 500 }, { name: 'Premium', price: 800 }],
    totalSeats: 200, date: '28 March 2026', venue: 'PVR Cinemas',
    eventId: 'demo-pushpa2', category: 'MOVIE',
  },
  {
    id: 'demo-stree2',
    title: 'Stree 2',
    image: 'https://image.tmdb.org/t/p/w500/c1yd6OMbEPiQAWOYOZnLS2GIxf5.jpg',
    language: 'Hindi', genre: 'Horror/Comedy', rating: 8.2,
    duration: '2h 20m', certification: 'UA',
    description: 'The townspeople of Chanderi face a new supernatural terror in this sequel to the hit horror-comedy.',
    tiers: [{ name: 'General', price: 200 }, { name: 'VIP', price: 450 }, { name: 'Premium', price: 700 }],
    totalSeats: 200, date: '12 April 2026', venue: 'INOX',
    eventId: 'demo-stree2', category: 'MOVIE',
  },
  {
    id: 'demo-kalki',
    title: 'Kalki 2898 AD',
    image: 'https://image.tmdb.org/t/p/w500/qbCZEBphOCbcCCfEXPnInb4q6o5.jpg',
    language: 'Telugu', genre: 'Sci-Fi/Action', rating: 8.0,
    duration: '3h 0m', certification: 'UA',
    description: 'A futuristic mythology saga — the story of a fierce warrior in the year 2898 AD.',
    tiers: [{ name: 'General', price: 250 }, { name: 'VIP', price: 600 }, { name: 'Premium', price: 900 }],
    totalSeats: 200, date: '20 April 2026', venue: 'Cinepolis',
    eventId: 'demo-kalki', category: 'MOVIE',
  },
  {
    id: 'demo-rrr',
    title: 'RRR',
    image: 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg',
    language: 'Telugu', genre: 'Action/Historical', rating: 8.8,
    duration: '3h 7m', certification: 'UA',
    description: 'A fictional take on the early lives of Telugu freedom fighters — Alluri Sitarama Raju and Komaram Bheem.',
    tiers: [{ name: 'General', price: 180 }, { name: 'VIP', price: 450 }, { name: 'Premium', price: 750 }],
    totalSeats: 200, date: '28 March 2026', venue: 'PVR Cinemas',
    eventId: 'demo-rrr', category: 'MOVIE',
  },
  {
    id: 'demo-kgf2',
    title: 'KGF: Chapter 2',
    image: 'https://image.tmdb.org/t/p/w500/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg',
    language: 'Kannada', genre: 'Action/Drama', rating: 8.3,
    duration: '2h 48m', certification: 'A',
    description: 'Rocky, the new ruler of the KGF gold mines, faces a bigger threat as the government declares war on him.',
    tiers: [{ name: 'General', price: 200 }, { name: 'VIP', price: 500 }, { name: 'Premium', price: 800 }],
    totalSeats: 200, date: '12 April 2026', venue: 'INOX Multiplex',
    eventId: 'demo-kgf2', category: 'MOVIE',
  },
  {
    id: 'demo-pathaan',
    title: 'Pathaan',
    image: 'https://image.tmdb.org/t/p/w500/aSVtBW3VmCPBORkWp9e9IgXqDaD.jpg',
    language: 'Hindi', genre: 'Action/Thriller', rating: 7.6,
    duration: '2h 26m', certification: 'UA',
    description: 'An Indian spy takes on the leader of a rogue private army that has threatened to use a deadly bio-weapon.',
    tiers: [{ name: 'General', price: 200 }, { name: 'VIP', price: 450 }, { name: 'Premium', price: 700 }],
    totalSeats: 200, date: '10 May 2026', venue: 'PVR Cinemas',
    eventId: 'demo-pathaan', category: 'MOVIE',
  },
  {
    id: 'demo-animal',
    title: 'Animal',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
    language: 'Hindi', genre: 'Action/Drama', rating: 7.9,
    duration: '3h 21m', certification: 'A',
    description: 'The son of a wealthy industrialist becomes increasingly possessive about his father.',
    tiers: [{ name: 'General', price: 200 }, { name: 'VIP', price: 500 }, { name: 'Premium', price: 800 }],
    totalSeats: 200, date: '15 May 2026', venue: 'Cinepolis',
    eventId: 'demo-animal', category: 'MOVIE',
  },
  {
    id: 'demo-jawan',
    title: 'Jawan',
    image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=450&fit=crop',
    language: 'Hindi', genre: 'Action/Thriller', rating: 7.5,
    duration: '2h 49m', certification: 'UA',
    description: 'A man is driven by a personal vendetta to rectify the wrongs in society.',
    tiers: [{ name: 'General', price: 200 }, { name: 'VIP', price: 450 }, { name: 'Premium', price: 700 }],
    totalSeats: 200, date: '20 May 2026', venue: 'INOX',
    eventId: 'demo-jawan', category: 'MOVIE',
  },
];

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
      <Link to={`/movie/${movie.id}`} state={{ movie }} className="no-underline block">
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
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        const data = await res.json();
        const backendMovies = (data.events || []).filter(e => e.category?.toUpperCase() === 'MOVIE').map(e => ({
          ...e,
          id: e.eventId,
          image: e.images?.[0] || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&h=450&fit=crop',
          language: e.language || 'Hindi',
          genre: e.genre || 'Action/Drama',
          rating: e.rating || 0,
          duration: e.duration || '2h 0m',
          certification: e.certification || 'UA',
          tiers: e.tiers || [{ price: e.price }],
        }));
        // Merge backend movies with demo movies (demo fills in when backend has none)
        const backendIds = new Set(backendMovies.map(m => m.id));
        const merged = [...backendMovies, ...DEMO_MOVIES.filter(d => !backendIds.has(d.id))];
        setMovies(merged);
      } catch (err) {
        setMovies(DEMO_MOVIES);
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
