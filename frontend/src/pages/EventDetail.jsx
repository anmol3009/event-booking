import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowLeft, Clock, ZoomIn, ZoomOut } from 'lucide-react';
import useStore from '../store/useStore';
import useTheme from '../store/useTheme';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Tier color mapping (BookMyShow style) ── */
const TIER_COLORS = {
  General: '#2DD4BF',   // cyan/teal
  VIP: '#F472B6',       // pink
  Premium: '#FBBF24',   // amber/orange
  Held: '#A78BFA',      // purple
};

/* ── Generate multi-floor venue with tier-colored rows ── */
function generateVenueLayout(totalSeats, tiers) {
  const sections = [];
  const seatsPerRow = 16;
  const tierNames = tiers.map((t) => t.name);

  // Assign tiers to rows: front rows = Premium, middle = VIP, back = General, last = Held
  const totalRows = Math.ceil(totalSeats / seatsPerRow);
  const tierRanges = {};
  const premiumRows = Math.max(2, Math.floor(totalRows * 0.15));
  const vipRows = Math.max(2, Math.floor(totalRows * 0.25));
  const heldRows = Math.max(1, Math.floor(totalRows * 0.1));
  const generalRows = totalRows - premiumRows - vipRows - heldRows;

  let currentRow = 0;

  // Ground Floor
  const groundTotal = Math.min(totalRows, Math.ceil(totalRows * 0.5));
  const groundRowsArr = [];
  for (let r = 0; r < groundTotal; r++) {
    let tier;
    if (currentRow < premiumRows) tier = 'Premium';
    else if (currentRow < premiumRows + vipRows) tier = 'VIP';
    else tier = 'General';

    const seatCount = r < 2 ? seatsPerRow - 4 : r < 4 ? seatsPerRow - 2 : seatsPerRow;
    groundRowsArr.push({
      label: String.fromCharCode(65 + currentRow),
      seats: seatCount,
      tier,
      color: TIER_COLORS[tier] || '#2DD4BF',
    });
    currentRow++;
  }
  sections.push({ name: 'GROUND FLOOR', startIndex: 0, rows: groundRowsArr });

  let usedSeats = groundRowsArr.reduce((s, r) => s + r.seats, 0);

  // First Floor Balcony
  const balc1Total = Math.min(totalRows - groundTotal, Math.ceil(totalRows * 0.3));
  if (balc1Total > 0) {
    const balcRows = [];
    for (let r = 0; r < balc1Total; r++) {
      let tier;
      if (currentRow < premiumRows + vipRows) tier = 'VIP';
      else if (currentRow >= totalRows - heldRows) tier = 'Held';
      else tier = 'General';

      balcRows.push({
        label: String.fromCharCode(65 + currentRow),
        seats: seatsPerRow - 2,
        tier,
        color: TIER_COLORS[tier] || '#2DD4BF',
      });
      currentRow++;
    }
    sections.push({ name: 'FIRST FLOOR BALCONY', startIndex: usedSeats, rows: balcRows });
    usedSeats += balcRows.reduce((s, r) => s + r.seats, 0);
  }

  // Second Floor Balcony
  const remaining = totalRows - groundTotal - balc1Total;
  if (remaining > 0) {
    const balc2Rows = [];
    for (let r = 0; r < remaining; r++) {
      const tier = currentRow >= totalRows - heldRows ? 'Held' : 'General';
      balc2Rows.push({
        label: String.fromCharCode(65 + currentRow),
        seats: seatsPerRow - 4,
        tier,
        color: TIER_COLORS[tier] || '#2DD4BF',
      });
      currentRow++;
    }
    sections.push({ name: 'SECOND FLOOR BALCONY', startIndex: usedSeats, rows: balc2Rows });
  }

  return sections;
}

function SeatLegend({ isDark, tiers }) {
  return (
    <div className="flex flex-wrap justify-center gap-5 mt-5">
      {tiers.map((t) => (
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
    </div>
  );
}

function Seat({ index, status, isSelected, onSelect, isDark, label, tierColor, dimmed }) {
  const getColor = () => {
    if (isSelected) return '#FFFFFF';
    if (status === 'booked') return isDark ? '#222' : '#ddd';
    if (status === 'held') return isDark ? '#1a1a1a' : '#e5e5e5';
    return tierColor;
  };

  const canSelect = status === 'available' && !dimmed;

  return (
    <motion.button
      whileHover={canSelect ? { scale: 1.5, zIndex: 10 } : {}}
      whileTap={canSelect ? { scale: 0.85 } : {}}
      onClick={() => !dimmed && (status === 'available' || isSelected) && onSelect(index)}
      className="rounded-sm border-none transition-all duration-200 relative"
      style={{
        width: 20,
        height: 20,
        background: getColor(),
        opacity: dimmed ? 0.12 : status === 'booked' ? 0.4 : status === 'held' ? 0.2 : 1,
        cursor: canSelect || isSelected ? 'pointer' : dimmed ? 'default' : 'not-allowed',
        boxShadow: isSelected ? '0 0 10px #fff, 0 0 3px #fff' : 'none',
        borderRadius: 3,
      }}
      title={`${label} — ${status === 'booked' ? 'Booked' : status === 'held' ? 'Held' : 'Available'}`}
    />
  );
}

function VenueSection({ section, seatStates, selectedSeats, selectSeat, isDark, highlightTier }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1" style={{ background: isDark ? '#1a1a1a' : '#e5e5e5' }} />
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold px-3 py-1 rounded-full" style={{ color: isDark ? '#555' : '#aaa', background: isDark ? '#0a0a0a' : '#f0f0f0' }}>
          {section.name}
        </span>
        <div className="h-px flex-1" style={{ background: isDark ? '#1a1a1a' : '#e5e5e5' }} />
      </div>

      <div className="space-y-[3px]">
        {section.rows.map((row, rowIdx) => {
          const rowStart = section.startIndex + section.rows.slice(0, rowIdx).reduce((sum, r) => sum + r.seats, 0);
          const seatsArr = Array.from({ length: row.seats }, (_, i) => rowStart + i);
          const isDimmed = highlightTier && highlightTier !== row.tier;

          // Split into 3 blocks with 2 aisles (like BookMyShow)
          const blockSize = Math.ceil(row.seats / 3);
          const block1 = seatsArr.slice(0, blockSize);
          const block2 = seatsArr.slice(blockSize, blockSize * 2);
          const block3 = seatsArr.slice(blockSize * 2);

          return (
            <div key={row.label} className="flex items-center justify-center">
              <span className="w-4 text-[9px] font-mono text-right mr-2 shrink-0" style={{ color: isDark ? '#333' : '#ccc' }}>
                {row.label}
              </span>

              {[block1, block2, block3].map((block, bi) => (
                <div key={bi} className="flex items-center">
                  <div className="flex gap-[3px]">
                    {block.map((seatIdx, i) => (
                      <Seat
                        key={seatIdx}
                        index={seatIdx}
                        status={seatStates[seatIdx] || 'available'}
                        isSelected={selectedSeats.includes(seatIdx)}
                        onSelect={selectSeat}
                        isDark={isDark}
                        label={`${row.label}${(bi * blockSize) + i + 1}`}
                        tierColor={row.color}
                        dimmed={isDimmed}
                      />
                    ))}
                  </div>
                  {bi < 2 && <div style={{ width: 14 }} />}
                </div>
              ))}

              <span className="w-4 text-[9px] font-mono ml-2 shrink-0" style={{ color: isDark ? '#333' : '#ccc' }}>
                {row.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const { seatStates, initializeSeats, selectedSeats, selectSeat, selectedTier, setSelectedTier } = useStore();
  const { user } = useStore();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Fetch event from backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEvent(true);
        const res = await fetch(`${API_BASE}/api/events/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const e = data.event;
        // Normalise backend shape → UI shape
        const normalised = {
          id:         e.eventId,
          title:      e.title,
          date:       e.date,
          location:   e.venue,
          price:      e.price || e.generalPrice || 500,
          category:   e.category || 'LIVE SHOW',
          description: e.description,
          image:      e.images?.[0] || '',
          totalSeats: e.totalSeats,
          tiers:      e.tiers || [
            { name: 'General', price: e.generalPrice || 500 },
            { name: 'VIP', price: e.vipPrice || 1500 }
          ],
        };
        setEvent(normalised);
        // Initialize with real seats from backend (returned as data.seats)
        initializeSeats(normalised.totalSeats, data.seats || []);
      } catch (err) {
        setEvent(null);
        toast.error('Failed to load event details');
      } finally {
        setLoadingEvent(false);
      }
    };
    load();
  }, [id, initializeSeats]);

  const venueLayout = useMemo(() => {
    if (!event) return [];
    return generateVenueLayout(event.totalSeats, event.tiers);
  }, [event]);

  const activeTier = selectedTier ? event?.tiers.find((t) => t.name === selectedTier) : event?.tiers[0];
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
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          seatIds: selectedSeats.map(s => s.toString()) // Backend expects strings
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to hold seats');

      navigate('/checkout', {
        state: {
          event,
          seats: selectedSeats,
          tier: selectedTier || event.tiers[0].name,
          total: totalPrice || event.tiers[0].price * selectedSeats.length,
          holdExpiry: data.holdExpiry
        },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }, [selectedSeats, selectedTier, totalPrice, event, user, navigate]);

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 style={{ color: isDark ? '#fff' : '#111' }}>Event not found</h2>
        <button onClick={() => navigate(-1)} className="btn-outline mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative" style={{ height: '40vh', minHeight: 280 }}>
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" style={{ filter: isDark ? 'brightness(0.4)' : 'brightness(0.7)' }} />
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to top, #000 15%, transparent 60%)' : 'linear-gradient(to top, #fff 15%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-6">
          <button onClick={() => navigate(-1)} className="link-more mb-2 text-sm bg-transparent border-none cursor-pointer flex items-center gap-1" style={{ color: '#7DA8CF' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2" style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}>
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: isDark ? '#888' : '#666' }}>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" style={{ color: '#7DA8CF' }} /> {event.date}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" style={{ color: '#7DA8CF' }} /> {event.location}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" style={{ color: '#7DA8CF' }} /> 7:30 PM</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Info bar */}
        <div
          className="rounded-lg border p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
          style={{ background: isDark ? '#0a0a0a' : '#fafafa', borderColor: isDark ? '#1a1a1a' : '#eee' }}
        >
          <p className="text-sm" style={{ color: isDark ? '#888' : '#666' }}>
            Please select a category of your choice. It will get highlighted on the layout.
          </p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: '#7DA8CF' }} />
            <span className="text-sm font-mono" style={{ color: isDark ? '#ccc' : '#444' }}>{event.totalSeats} seats</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left — Price tiers (BookMyShow sidebar) */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: isDark ? '#555' : '#aaa' }}>
              filter by price
            </p>
            <div className="space-y-1">
              {event.tiers.map((tier) => {
                const active = (selectedTier || event.tiers[0].name) === tier.name;
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
                      <span className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>
                        ₹{tier.price}
                      </span>
                    </div>
                    <svg className="w-4 h-4 transition-transform" style={{ color: isDark ? '#444' : '#ccc', transform: active ? 'rotate(180deg)' : 'rotate(0)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                );
              })}
            </div>

            {/* About */}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: '#7DA8CF' }}>About</h3>
              <p className="text-sm leading-7" style={{ color: isDark ? '#888' : '#555' }}>{event.description}</p>
            </div>
          </div>

          {/* Right — Venue Map */}
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

              {/* Stage */}
              <div className="text-center mb-8">
                <div
                  className="inline-block rounded-b-[60%] px-20 py-3 text-[10px] uppercase tracking-[0.3em] font-bold relative"
                  style={{
                    background: isDark
                      ? 'linear-gradient(180deg, #1a1a1a, #0a0a0a)'
                      : 'linear-gradient(180deg, #e5e5e5, #f5f5f5)',
                    color: isDark ? '#555' : '#aaa',
                  }}
                >
                  Stage
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-0.5 rounded-full" style={{ background: '#7DA8CF', opacity: 0.6 }} />
                </div>
              </div>

              {/* Scrollable map */}
              <div className="overflow-auto pb-2" style={{ maxHeight: '55vh' }}>
                <div
                  className="transition-transform duration-200 origin-top-center mx-auto"
                  style={{ transform: `scale(${zoom})`, width: 'fit-content' }}
                >
                  {venueLayout.map((section) => (
                    <VenueSection
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

              <SeatLegend isDark={isDark} tiers={event.tiers} />

              {/* Doors */}
              <div className="flex justify-between mt-4 px-2">
                {['DOOR', 'DOOR'].map((d, i) => (
                  <span key={i} className="text-[9px] uppercase tracking-widest flex items-center gap-1" style={{ color: isDark ? '#333' : '#ccc' }}>
                    🚪 {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom bar — summary + proceed */}
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
                      {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>
                      {activeTier?.name} &middot; ₹{activeTier?.price} each
                    </p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: isDark ? '#555' : '#999' }}>
                    ₹{event.price} onwards
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
                  className="py-3 px-8 rounded font-bold text-sm uppercase tracking-wider transition-all duration-300 border-none cursor-pointer flex items-center justify-center min-w-[140px]"
                  style={{
                    background: selectedSeats.length > 0 ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#e5e5e5'),
                    color: selectedSeats.length > 0 ? '#000' : (isDark ? '#555' : '#aaa'),
                    cursor: selectedSeats.length > 0 && !processing ? 'pointer' : 'not-allowed',
                  }}
                >
                  {processing ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                  ) : 'Proceed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
