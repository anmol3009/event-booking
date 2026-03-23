import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowLeft, Star, ZoomIn, ZoomOut, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import useTheme from '../store/useTheme';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Tier color mapping ── */
const TIER_COLORS = {
  General: '#2DD4BF',
  VIP: '#F472B6',
  Premium: '#FBBF24',
};

/* ── Generate theatre layout (cinema style — curved rows, screen at front) ── */
function generateTheatreLayout(totalSeats, tiers) {
  const sections = [];
  const seatsPerRow = 14;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);

  const premiumRows = Math.max(2, Math.floor(totalRows * 0.2));
  const vipRows = Math.max(2, Math.floor(totalRows * 0.3));
  const generalRows = totalRows - premiumRows - vipRows;

  let currentRow = 0;
  let usedSeats = 0;

  // Premium — front rows closest to screen
  const premiumArr = [];
  for (let r = 0; r < premiumRows; r++) {
    const seatCount = Math.min(seatsPerRow - 2, totalSeats - usedSeats);
    if (seatCount <= 0) break;
    premiumArr.push({
      label: String.fromCharCode(65 + currentRow),
      seats: seatCount,
      tier: 'Premium',
      color: TIER_COLORS.Premium,
    });
    usedSeats += seatCount;
    currentRow++;
  }
  sections.push({ name: 'PREMIUM — FRONT', startIndex: 0, rows: premiumArr });

  // VIP — middle rows
  const vipArr = [];
  const vipStart = usedSeats;
  for (let r = 0; r < vipRows; r++) {
    const seatCount = Math.min(seatsPerRow, totalSeats - usedSeats);
    if (seatCount <= 0) break;
    vipArr.push({
      label: String.fromCharCode(65 + currentRow),
      seats: seatCount,
      tier: 'VIP',
      color: TIER_COLORS.VIP,
    });
    usedSeats += seatCount;
    currentRow++;
  }
  sections.push({ name: 'VIP — MIDDLE', startIndex: vipStart, rows: vipArr });

  // General — back rows
  const generalArr = [];
  const generalStart = usedSeats;
  for (let r = 0; r < generalRows; r++) {
    const seatCount = Math.min(seatsPerRow + 2, totalSeats - usedSeats);
    if (seatCount <= 0) break;
    generalArr.push({
      label: String.fromCharCode(65 + currentRow),
      seats: seatCount,
      tier: 'General',
      color: TIER_COLORS.General,
    });
    usedSeats += seatCount;
    currentRow++;
  }
  sections.push({ name: 'GENERAL — REAR', startIndex: generalStart, rows: generalArr });

  return sections;
}

function Seat({ index, status, isSelected, onSelect, isDark, label, tierColor }) {
  const getColor = () => {
    if (isSelected) return tierColor;
    if (status === 'booked') return isDark ? '#333' : '#d0d0d0';
    if (status === 'held') return isDark ? '#222' : '#e8e8e8';
    return 'transparent';
  };

  const canSelect = status === 'available';

  return (
    <motion.button
      whileHover={canSelect ? { scale: 1.6, zIndex: 20, y: -3 } : {}}
      whileTap={canSelect ? { scale: 0.9 } : {}}
      onClick={() => (canSelect || isSelected) && onSelect(index)}
      className="relative border-none transition-all duration-200 rounded-md focus:outline-none"
      style={{
        width: 24,
        height: 24,
        background: getColor(),
        opacity: status === 'booked' ? 0.45 : status === 'held' ? 0.25 : 1,
        cursor: canSelect || isSelected ? 'pointer' : 'not-allowed',
        boxShadow: isSelected 
          ? `0 0 20px ${tierColor}cc, 0 0 12px ${tierColor}, 0 4px 12px rgba(0,0,0,0.4), inset 0 0 8px rgba(255,255,255,0.3)` 
          : canSelect
          ? `0 0 6px ${tierColor}66`
          : 'none',
        borderRadius: 4,
        border: isSelected ? `2.5px solid #fff` : canSelect ? `1.5px solid ${tierColor}` : 'none',
      }}
      title={`${label} — ${status === 'booked' ? 'Booked' : status === 'held' ? 'Held' : 'Available'}`}
    />
  );
}

function TheatreSection({ section, seatStates, selectedSeats, selectSeat, isDark, highlightTier }) {
  return (
    <motion.div 
      className="mb-8 rounded-lg p-6 backdrop-blur-sm transition-all duration-200"
      style={{ 
        background: isDark ? 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)' : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}`,
        boxShadow: `0 4px 20px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1" style={{ background: isDark ? '#1a1a1a' : '#ddd' }} />
        <motion.span 
          className="text-[11px] uppercase tracking-[0.3em] font-bold px-4 py-2 rounded-full whitespace-nowrap"
          style={{ 
            color: '#7DA8CF', 
            background: isDark ? '#0a0a0a' : '#f0f0f0',
            border: `1px solid ${isDark ? '#1a1a1a' : '#ddd'}`
          }}
          whileHover={{ scale: 1.05 }}
        >
          {section.name}
        </motion.span>
        <div className="h-px flex-1" style={{ background: isDark ? '#1a1a1a' : '#ddd' }} />
      </div>

      <div className="space-y-2">
        {section.rows.map((row, rowIdx) => {
          const rowStart = section.startIndex + section.rows.slice(0, rowIdx).reduce((sum, r) => sum + r.seats, 0);
          const seatsArr = Array.from({ length: row.seats }, (_, i) => rowStart + i);
          
          // Hide rows that don't match selected tier (show-only filter)
          const shouldHide = highlightTier && highlightTier !== row.tier;
          if (shouldHide) return null;

          // Split into 2 blocks with center aisle (cinema style)
          const half = Math.ceil(row.seats / 2);
          const blockL = seatsArr.slice(0, half);
          const blockR = seatsArr.slice(half);
          return (
            <motion.div 
              key={row.label} 
              className="flex items-center justify-center transition-all duration-200"
              whileHover={{ scale: 1.02 }}
            >
              <span className="w-6 text-[10px] font-bold text-right mr-3 shrink-0" style={{ color: row.color, letterSpacing: '0.05em' }}>
                {row.label}
              </span>

              <div className="flex gap-[4px]">
                {blockL.map((seatIdx, i) => (
                  <Seat
                    key={seatIdx}
                    index={seatIdx}
                    status={seatStates[seatIdx] || 'available'}
                    isSelected={selectedSeats.includes(seatIdx)}
                    onSelect={selectSeat}
                    isDark={isDark}
                    label={`${row.label}${i + 1}`}
                    tierColor={row.color}
                  />
                ))}
              </div>
              <div style={{ width: 24 }} />
              <div className="flex gap-[4px]">
                {blockR.map((seatIdx, i) => (
                  <Seat
                    key={seatIdx}
                    index={seatIdx}
                    status={seatStates[seatIdx] || 'available'}
                    isSelected={selectedSeats.includes(seatIdx)}
                    onSelect={selectSeat}
                    isDark={isDark}
                    label={`${row.label}${half + i + 1}`}
                    tierColor={row.color}
                  />
                ))}
              </div>

              <span className="w-6 text-[10px] font-bold ml-3 shrink-0" style={{ color: row.color, letterSpacing: '0.05em' }}>
                {row.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const { seatStates, initializeSeats, selectedSeats, selectSeat, selectedTier, setSelectedTier, clearSeats, user } = useStore();
  const [processing, setProcessing] = useState(false);
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [zoom, setZoom] = useState(1);
  const [showtime, setShowtime] = useState('7:30 PM');
  const location = useLocation();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${id}`);
        const data = await res.json();
        if (data.success && data.event) {
          const m = data.event;
          const mappedMovie = {
            ...m,
            id: m.eventId,
            image: m.images?.[0] || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300&h=450&fit=crop',
            language: m.language || 'Hindi',
            genre: m.genre || 'Action/Drama',
            rating: m.rating || 0,
            duration: m.duration || '2h 0m',
            certification: m.certification || 'UA',
            releaseDate: m.date,
            tiers: m.tiers || [{ name: 'General', price: 200 }, { name: 'VIP', price: 500 }, { name: 'Premium', price: 800 }],
          };
          setMovie(mappedMovie);
          clearSeats();
          initializeSeats(m.totalSeats, data.seats || []);
        } else {
          // Fallback: use movie data passed via navigation state (for demo movies)
          const demoMovie = location.state?.movie;
          if (demoMovie) {
            setMovie(demoMovie);
            clearSeats();
            initializeSeats(demoMovie.totalSeats || 200, []);
          }
        }
      } catch (err) {
        const demoMovie = location.state?.movie;
        if (demoMovie) {
          setMovie(demoMovie);
          clearSeats();
          initializeSeats(demoMovie.totalSeats || 200, []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  const theatreLayout = useMemo(() => {
    if (!movie) return [];
    return generateTheatreLayout(movie.totalSeats, movie.tiers);
  }, [movie]);

  const activeTier = selectedTier ? movie?.tiers.find((t) => t.name === selectedTier) : movie?.tiers[0];
  const totalPrice = (activeTier?.price || 0) * selectedSeats.length;

  const handleProceed = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    if (!user?.token) {
      toast.error('Please sign in to book tickets');
      navigate('/auth/login');
      return;
    }
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE}/api/bookings/hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId: movie.id,
          seatIds: selectedSeats.map(s => s.toString()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to hold seats');
      navigate('/checkout', {
        state: {
          event: { ...movie, date: movie.releaseDate, location: movie.venue || 'PVR Cinemas' },
          seats: selectedSeats,
          tier: selectedTier || movie.tiers[0].name,
          total: totalPrice || movie.tiers[0].price * selectedSeats.length,
          holdExpiry: data.holdExpiry,
        },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }, [selectedSeats, selectedTier, totalPrice, movie, user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-40">
         <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 style={{ color: isDark ? '#fff' : '#111' }}>Movie not found</h2>
        <button onClick={() => navigate('/movies')} className="btn-outline mt-4">Go Back</button>
      </div>
    );
  }

  const showtimes = ['10:30 AM', '1:45 PM', '4:30 PM', '7:30 PM', '10:15 PM'];

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative" style={{ height: '35vh', minHeight: 250 }}>
        <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" style={{ filter: isDark ? 'brightness(0.35)' : 'brightness(0.6)' }} />
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to top, #000 20%, transparent 60%)' : 'linear-gradient(to top, #fff 20%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-6">
          <button onClick={() => navigate('/movies')} className="link-more mb-2 text-sm bg-transparent border-none cursor-pointer flex items-center gap-1" style={{ color: '#7DA8CF' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Movies
          </button>
          <div className="flex items-start gap-5">
            <img src={movie.image} alt="" className="w-20 h-28 rounded-lg object-cover hidden sm:block" style={{ border: '2px solid rgba(125,168,207,0.3)' }} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}>
                {movie.title}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm" style={{ color: isDark ? '#888' : '#666' }}>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} /> {movie.rating}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" style={{ color: '#7DA8CF' }} /> {movie.duration}</span>
                <span>{movie.genre}</span>
                <span>{movie.language}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm" style={{ background: '#7DA8CF', color: '#000' }}>{movie.certification}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Showtime selector */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: isDark ? '#555' : '#aaa' }}>
            Select Showtime — Today
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {showtimes.map((t) => (
              <button
                key={t}
                onClick={() => setShowtime(t)}
                className="text-xs font-mono font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all border whitespace-nowrap"
                style={{
                  background: showtime === t ? '#7DA8CF' : 'transparent',
                  color: showtime === t ? '#000' : (isDark ? '#888' : '#666'),
                  borderColor: showtime === t ? '#7DA8CF' : (isDark ? '#222' : '#ddd'),
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Left — Price tiers */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: isDark ? '#555' : '#aaa' }}>
              Select Category
            </p>
            <div className="space-y-1">
              {movie.tiers.map((tier) => {
                const active = (selectedTier || movie.tiers[0].name) === tier.name;
                const color = TIER_COLORS[tier.name] || '#2DD4BF';

                return (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedTier(tier.name)}
                    className="w-full p-3 text-left cursor-pointer border transition-all duration-200 flex items-center justify-between rounded-lg"
                    style={{
                      background: active ? (isDark ? '#0f0f0f' : '#f5f5f5') : 'transparent',
                      borderColor: active ? color : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-sm" style={{ background: color }} />
                      <div>
                        <span className="text-sm font-semibold block" style={{ color: isDark ? '#fff' : '#111' }}>{tier.name}</span>
                        <span className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>₹{tier.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Movie info */}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#7DA8CF' }}>About</h3>
              <p className="text-sm leading-7" style={{ color: isDark ? '#888' : '#555' }}>{movie.description}</p>
            </div>
          </div>

          {/* Right — Theatre Seat Map */}
          <div>
            <div
              className="rounded-xl border p-6 relative overflow-hidden"
              style={{ background: isDark ? '#050505' : '#f9f9f9', borderColor: isDark ? '#1a1a1a' : '#eee' }}
            >
              {/* Zoom controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
                  className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer"
                  style={{ background: isDark ? '#111' : '#fff', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#ccc' : '#444' }}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
                  className="w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer"
                  style={{ background: isDark ? '#111' : '#fff', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#ccc' : '#444' }}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              {/* Screen */}
              <div className="text-center mb-8">
                <div
                  className="inline-block px-24 py-2 text-[10px] uppercase tracking-[0.3em] font-bold relative"
                  style={{
                    background: isDark
                      ? 'linear-gradient(180deg, #1a1a1a, transparent)'
                      : 'linear-gradient(180deg, #e5e5e5, transparent)',
                    color: isDark ? '#555' : '#aaa',
                    borderRadius: '0 0 60% 60%',
                  }}
                >
                  <Monitor className="w-4 h-4 inline mr-2" />
                  Screen
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-0.5 rounded-full" style={{ background: '#7DA8CF', opacity: 0.6 }} />
                </div>
              </div>

              {/* Scrollable seat map */}
              <div className="overflow-auto pb-2" style={{ maxHeight: '50vh' }}>
                <div
                  className="transition-transform duration-200 origin-top-center mx-auto"
                  style={{ transform: `scale(${zoom})`, width: 'fit-content' }}
                >
                  {theatreLayout.map((section) => (
                    <TheatreSection
                      key={section.name}
                      section={section}
                      seatStates={seatStates}
                      selectedSeats={selectedSeats}
                      selectSeat={selectSeat}
                      isDark={isDark}
                      highlightTier={selectedTier}
                    />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-5 mt-5">
                {movie.tiers.map((t) => (
                  <div key={t.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: TIER_COLORS[t.name] || '#2DD4BF' }} />
                    <span className="text-[11px] font-medium" style={{ color: isDark ? '#888' : '#666' }}>
                      {t.name} — ₹{t.price}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: isDark ? '#222' : '#ddd' }} />
                  <span className="text-[11px] font-medium" style={{ color: isDark ? '#888' : '#666' }}>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: '#FFFFFF', border: '1px solid #555' }} />
                  <span className="text-[11px] font-medium" style={{ color: isDark ? '#888' : '#666' }}>Selected</span>
                </div>
              </div>

              {/* Exits */}
              <div className="flex justify-between mt-4 px-2">
                {['EXIT', 'EXIT'].map((d, i) => (
                  <span key={i} className="text-[9px] uppercase tracking-widest" style={{ color: isDark ? '#333' : '#ccc' }}>
                    🚪 {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div
              className="mt-4 rounded-lg border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4"
              style={{
                background: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.95)',
                borderColor: selectedSeats.length > 0 ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#eee'),
                backdropFilter: 'blur(12px)',
                boxShadow: selectedSeats.length > 0 ? '0 -4px 30px rgba(125,168,207,0.1)' : 'none',
              }}
            >
              <div>
                {selectedSeats.length > 0 ? (
                  <>
                    <p className="text-sm font-medium" style={{ color: isDark ? '#fff' : '#111' }}>
                      {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} &middot; {showtime}
                    </p>
                    <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>
                      {activeTier?.name} &middot; ₹{activeTier?.price} each
                    </p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: isDark ? '#555' : '#999' }}>
                    Select seats to proceed &middot; ₹{movie.tiers[0].price} onwards
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {selectedSeats.length > 0 && (
                  <span className="text-2xl font-bold font-mono" style={{ color: '#7DA8CF' }}>
                    ₹{totalPrice.toLocaleString()}
                  </span>
                )}
                <button
                  onClick={handleProceed}
                  disabled={selectedSeats.length === 0 || processing}
                  className="py-3 px-8 rounded font-bold text-sm uppercase tracking-wider transition-all duration-300 border-none cursor-pointer"
                  style={{
                    background: selectedSeats.length > 0 ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#e5e5e5'),
                    color: selectedSeats.length > 0 ? '#000' : (isDark ? '#555' : '#aaa'),
                    cursor: selectedSeats.length > 0 && !processing ? 'pointer' : 'not-allowed',
                  }}
                >
                  {processing ? 'Holding...' : 'Proceed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
