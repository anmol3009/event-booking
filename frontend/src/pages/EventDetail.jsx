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

  // Normalize tiers to preserve General/VIP/Premium in legend and layout.
  const menuTiers = ['Premium', 'VIP', 'General'];
  const normalizedTiers = menuTiers.map((name) => {
    const found = tiers.find((t) => t.name.toLowerCase() === name.toLowerCase());
    return found || { name, price: 0 };
  });

  // Prepare row labels A-Z, excluding M (user requested removal of section M) so layout does not render M.
  const allRowLabels = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).filter((label) => label !== 'M');
  const totalRows = Math.min(Math.ceil(totalSeats / seatsPerRow), allRowLabels.length);
  const premiumRows = Math.max(2, Math.floor(totalRows * 0.2));
  const vipRows = Math.max(2, Math.floor(totalRows * 0.3));
  const generalRows = totalRows - premiumRows - vipRows;

  const getTier = (index) => {
    if (index < premiumRows) return 'Premium';
    if (index < premiumRows + vipRows) return 'VIP';
    return 'General';
  };

  let currentRow = 0;

  // Ground Floor
  const groundTotal = Math.min(totalRows, Math.ceil(totalRows * 0.5));
  const groundRowsArr = [];
  for (let r = 0; r < groundTotal; r++) {
    const tier = getTier(currentRow);
    const seatCount = r < 2 ? seatsPerRow - 4 : r < 4 ? seatsPerRow - 2 : seatsPerRow;
    groundRowsArr.push({
      label: allRowLabels[currentRow],
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
      const tier = 'General';
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

function SeatLegend({ isDark, tiers, seatStates, venueLayout, selectedTier, onTierSelect }) {
  // Calculate availability per tier
  const tierData = useMemo(() => {
    const counts = {};
    const available = {};

    // Initialize counts
    tiers.forEach((t) => {
      counts[t.name] = 0;
      available[t.name] = 0;
    });

    // Build seat index to tier mapping
    const seatToTier = {};
    let seatIndex = 0;
    venueLayout.forEach((section) => {
      section.rows.forEach((row) => {
        for (let i = 0; i < row.seats; i++) {
          seatToTier[seatIndex + i] = row.tier;
        }
        counts[row.tier] = (counts[row.tier] || 0) + row.seats;
        seatIndex += row.seats;
      });
    });

    // Count available seats
    Object.keys(seatStates).forEach((seatIdx) => {
      const idx = parseInt(seatIdx);
      const tier = seatToTier[idx];
      if (tier && seatStates[seatIdx] === 'available') {
        available[tier]++;
      }
    });

    return { counts, available };
  }, [seatStates, venueLayout, tiers]);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: '#7DA8CF' }}>Seat Availability</h3>
      <div className="space-y-3">
        {tiers.map((t) => {
          const isSelected = selectedTier === t.name;
          return (
            <motion.button
              key={t.name}
              onClick={() => onTierSelect(isSelected ? null : t.name)}
              className="w-full rounded-lg p-4 border transition-all duration-200 cursor-pointer text-left"
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isSelected ? (isDark ? 'rgba(125,168,207,0.15)' : 'rgba(125,168,207,0.1)') : (isDark ? '#111' : '#fff'),
                border: `2px solid ${isSelected ? (TIER_COLORS[t.name] || '#2DD4BF') : (isDark ? '#1a1a1a' : '#eee')}`,
                boxShadow: isSelected ? `0 0 16px ${TIER_COLORS[t.name] || '#2DD4BF'}44` : 'none',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ background: TIER_COLORS[t.name] || '#2DD4BF', boxShadow: isSelected ? `0 0 12px ${TIER_COLORS[t.name] || '#2DD4BF'}` : `0 0 8px ${TIER_COLORS[t.name] || '#2DD4BF'}33` }} />
                  <span className="text-[12px] uppercase tracking-wider font-bold" style={{ color: isDark ? '#ccc' : '#444' }}>{t.name}</span>
                </div>
                <span className="text-[10px] font-bold" style={{ color: '#7DA8CF' }}>₹{t.price}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: isDark ? '#666' : '#999' }}>Available</span>
                <span className="font-bold" style={{ color: TIER_COLORS[t.name] || '#2DD4BF' }}>{tierData.available[t.name] || 0}/{tierData.counts[t.name] || 0}</span>
              </div>
            </motion.button>
          );
        })}
        <motion.button
          onClick={() => onTierSelect(null)}
          className="w-full rounded-lg p-4 border transition-all duration-200 cursor-pointer text-left"
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: !selectedTier ? (isDark ? 'rgba(125,168,207,0.15)' : 'rgba(125,168,207,0.1)') : (isDark ? '#111' : '#fff'),
            border: `2px solid ${!selectedTier ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#eee')}`,
            boxShadow: !selectedTier ? `0 0 16px rgba(125,168,207,0.3)` : 'none',
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm" style={{ background: isDark ? '#444' : '#ddd', boxShadow: !selectedTier ? `0 0 12px rgba(125,168,207,0.5)` : 'none' }} />
              <span className="text-[12px] uppercase tracking-wider font-bold" style={{ color: isDark ? '#ccc' : '#444' }}>All Seats</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: isDark ? '#666' : '#999' }}>View</span>
            <span className="font-bold" style={{ color: '#7DA8CF' }}>{Object.values(seatStates).filter(s => s === 'available').length} available</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

function Seat({ index, status, isSelected, onSelect, isDark, label, tierColor, isHighlighted }) {
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
      onClick={() => (status === 'available' || isSelected) && onSelect(index)}

      className="relative border-none transition-all duration-200 rounded-md focus:outline-none"
      style={{
        width: 22,
        height: 22,
        background: getColor(),
        opacity: status === 'booked' ? 0.45 : status === 'held' ? 0.25 : 1,
        boxShadow: isSelected 
          ? `0 0 20px ${tierColor}cc, 0 0 12px ${tierColor}, 0 4px 12px rgba(0,0,0,0.4), inset 0 0 8px rgba(255,255,255,0.3)` 
          : isHighlighted && canSelect
          ? `0 0 14px ${tierColor}99, 0 0 8px ${tierColor}66, inset 0 0 4px ${tierColor}44`
          : canSelect
          ? `0 0 6px ${tierColor}66`
          : 'none',
        borderRadius: 4,
        border: isSelected 
          ? `2.5px solid #fff` 
          : isHighlighted && canSelect
          ? `1.5px solid ${tierColor}`
          : canSelect
          ? `1.5px solid ${tierColor}`
          : status === 'booked' || status === 'held'
          ? `1px solid ${isDark ? '#444' : '#999'}`
          : 'none',
      }}
      title={`${label} — ${status === 'booked' ? 'Booked' : status === 'held' ? 'Held' : 'Available'}`}
    />
  );
}

function VenueSection({ section, seatStates, selectedSeats, selectSeat, isDark, highlightTier }) {
  return (
    <motion.div 
      className="mb-10 rounded-lg p-6 backdrop-blur-sm transition-all duration-200"
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
          const shouldHide = highlightTier && highlightTier !== row.tier;
          if (shouldHide) return null;
          const isHighlightedRow = highlightTier === row.tier;

          // Split into 3 blocks with 2 aisles (like BookMyShow)
          const blockSize = Math.ceil(row.seats / 3);
          const block1 = seatsArr.slice(0, blockSize);
          const block2 = seatsArr.slice(blockSize, blockSize * 2);
          const block3 = seatsArr.slice(blockSize * 2);

          return (
            <motion.div 
              key={row.label} 
              className="flex items-center justify-center transition-all duration-200 px-3 py-2 rounded-lg"
              whileHover={{ scale: 1.02 }}
              style={{
                background: isHighlightedRow ? (isDark ? 'rgba(125,168,207,0.08)' : 'rgba(125,168,207,0.05)') : 'transparent',
                borderLeft: isHighlightedRow ? `3px solid ${row.color}` : 'none',
              }}
            >
              <span className="w-6 text-[10px] font-bold text-right mr-3 shrink-0" style={{ color: row.color, letterSpacing: '0.05em' }}>
                {row.label}
              </span>
              {[block1, block2, block3].map((block, bi) => (
                <div key={bi} className="flex items-center">
                  <div className="flex gap-[4px]">
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
                        isHighlighted={isHighlightedRow}
                      />
                    ))}
                  </div>
                  {bi < 2 && <div style={{ width: 16 }} />}
                </div>
              ))}

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

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const { seatStates, initializeSeats, selectedSeats, selectSeat: storeSelectSeat, selectedTier, setSelectedTier } = useStore();
  const { user } = useStore();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Wrapper for selectSeat with 4-seat limit enforcement + toast notification
  const selectSeat = useCallback((seatIndex) => {
    if (selectedSeats.includes(seatIndex)) {
      // Deselecting — always allowed
      storeSelectSeat(seatIndex);
    } else {
      // Attempting to select
      if (selectedSeats.length >= 4) {
        toast.error('Maximum 4 seats per booking');
        return;
      }
      storeSelectSeat(seatIndex);
    }
  }, [selectedSeats, storeSelectSeat]);

  // Fetch event from backend
  useEffect(() => {
    const load = async (isInitial = false) => {
      try {
        if (isInitial) setLoadingEvent(true);
        const res = await fetch(`${API_BASE}/api/events/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const e = data.event;
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
            { name: 'Premium', price: e.premiumPrice || 2500 },
            { name: 'VIP', price: e.vipPrice || 1500 },
            { name: 'General', price: e.generalPrice || 500 }
          ],
        };
        if (isInitial) setEvent(normalised);
        // Refresh seat states every poll — reflects cancellations/new bookings
        initializeSeats(normalised.totalSeats, data.seats || []);
      } catch (err) {
        if (isInitial) {
          setEvent(null);
          toast.error('Failed to load event details');
        }
      } finally {
        if (isInitial) setLoadingEvent(false);
      }
    };
    load(true);
    // Poll every 30 seconds so seat layout stays current (cancellations, new bookings)
    const poll = setInterval(() => load(false), 30000);
    return () => clearInterval(poll);
  }, [id, initializeSeats]);

  const venueLayout = useMemo(() => {
    if (!event) return [];
    return generateVenueLayout(event.totalSeats, event.tiers);
  }, [event]);

  const seatPriceMap = useMemo(() => {
    if (!event?.tiers) return {};
    return event.tiers.reduce((acc, tier) => {
      acc[tier.name] = Number(tier.price) || 0;
      return acc;
    }, {});
  }, [event?.tiers]);

  const seatTierByIndex = useMemo(() => {
    const map = {};
    let pointer = 0;
    venueLayout.forEach((section) => {
      section.rows.forEach((row) => {
        for (let seat = 0; seat < row.seats; seat++) {
          map[pointer] = row.tier;
          pointer += 1;
        }
      });
    });
    return map;
  }, [venueLayout]);

  const selectedSeatsTotal = useMemo(() => {
    if (!selectedSeats?.length) return 0;
    return selectedSeats.reduce((sum, seatIndex) => {
      const tierName = seatTierByIndex[seatIndex] || selectedTier || (event?.tiers?.[0]?.name);
      const price = seatPriceMap[tierName] ?? event?.price ?? 0;
      return sum + price;
    }, 0);
  }, [selectedSeats, seatTierByIndex, seatPriceMap, selectedTier, event]);

  const activeTier = (() => {
    if (selectedSeats.length > 0) {
      const firstTier = seatTierByIndex[selectedSeats[0]];
      return event?.tiers?.find((t) => t.name === firstTier) || event?.tiers?.[0];
    }
    if (selectedTier) return event?.tiers?.find((t) => t.name === selectedTier);
    return event?.tiers?.[0];
  })();

  const totalPrice = selectedSeats.length ? selectedSeatsTotal : (activeTier?.price || event?.price || 0);

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
          tier: selectedSeats.length > 0 ? seatTierByIndex[selectedSeats[0]] || (selectedTier || event.tiers[0].name) : (selectedTier || event.tiers[0].name),
          total: totalPrice,
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
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: isDark ? '#888' : '#666' }}>
              Please select a category of your choice. It will get highlighted on the layout.
            </p>
            <p className="text-xs" style={{ color: selectedSeats.length >= 4 ? '#F472B6' : '#7DA8CF' }}>
              Seats selected: {selectedSeats.length}/4 (Maximum 4 seats per booking)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: '#7DA8CF' }} />
            <span className="text-sm font-mono" style={{ color: isDark ? '#ccc' : '#444' }}>{event.totalSeats} seats</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left — Seat Availability */}
          <div>
            {/* Seat Availability Legend */}
            <div className="rounded-lg p-4 border" style={{ background: isDark ? '#0a0a0a' : '#f9f9f9', border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
              <SeatLegend isDark={isDark} tiers={event.tiers} seatStates={seatStates} venueLayout={venueLayout} selectedTier={selectedTier} onTierSelect={setSelectedTier} />
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
