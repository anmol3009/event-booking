import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Tag, X, MapPin } from 'lucide-react';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Tier colors (same as EventDetail) ── */
const TIER_COLORS = {
  General: '#2DD4BF',
  VIP: '#F472B6',
  Premium: '#FBBF24',
  Held: '#A78BFA',
};

/* ── Mini venue layout for the seatmap modal ── */
function generateMiniLayout(totalSeats, tiers) {
  const seatsPerRow = 16;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);
  const rows = [];
  const premiumRows = Math.max(2, Math.floor(totalRows * 0.15));
  const vipRows = Math.max(2, Math.floor(totalRows * 0.25));
  const heldRows = Math.max(1, Math.floor(totalRows * 0.1));

  let seatIdx = 0;
  for (let r = 0; r < totalRows; r++) {
    let tier;
    if (r < premiumRows) tier = 'Premium';
    else if (r < premiumRows + vipRows) tier = 'VIP';
    else if (r >= totalRows - heldRows) tier = 'Held';
    else tier = 'General';

    const seatCount = r < 2 ? seatsPerRow - 4 : r < 4 ? seatsPerRow - 2 : seatsPerRow;
    rows.push({
      label: String.fromCharCode(65 + r),
      startIndex: seatIdx,
      seats: seatCount,
      tier,
      color: TIER_COLORS[tier] || '#2DD4BF',
    });
    seatIdx += seatCount;
  }
  return rows;
}

function SeatMapModal({ ticket, onClose, isDark }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/events/${ticket.eventId}`)
      .then(r => r.json())
      .then(data => setEvent(data.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [ticket.eventId]);

  const rows = useMemo(() => {
    if (!event) return [];
    return generateMiniLayout(event.totalSeats, event.tiers);
  }, [event]);

  if (loading) return null;
  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="rounded-xl border p-6 max-w-2xl w-full max-h-[85vh] overflow-auto"
        style={{ background: isDark ? '#0a0a0a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#eee' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#7DA8CF' }}>
              Seat Location
            </p>
            <h3 className="text-lg font-bold font-heading mt-1" style={{ color: isDark ? '#fff' : '#111' }}>
              {ticket.eventTitle}
            </h3>
            <p className="text-xs mt-1" style={{ color: isDark ? '#555' : '#999' }}>
              Seller: {ticket.seller} &middot; Seat <span className="font-mono font-bold" style={{ color: '#7DA8CF' }}>{ticket.seat}</span> &middot; {ticket.tier}
            </p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: isDark ? '#555' : '#999' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Stage */}
        <div className="text-center mb-5">
          <div
            className="inline-block rounded-b-[60%] px-16 py-2 text-[9px] uppercase tracking-[0.3em] font-bold"
            style={{
              background: isDark ? 'linear-gradient(180deg, #1a1a1a, #0a0a0a)' : 'linear-gradient(180deg, #e5e5e5, #f5f5f5)',
              color: isDark ? '#555' : '#aaa',
            }}
          >
            Stage
          </div>
        </div>

        {/* Seat grid with enhanced styling */}
        <div className="overflow-auto pb-4 rounded-lg" style={{ background: isDark ? 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)' : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}`, padding: '16px' }}>
          <div className="mx-auto" style={{ width: 'fit-content' }}>
            {rows.map((row) => {
              const seatsArr = Array.from({ length: row.seats }, (_, i) => row.startIndex + i);
              const blockSize = Math.ceil(row.seats / 3);
              const blocks = [seatsArr.slice(0, blockSize), seatsArr.slice(blockSize, blockSize * 2), seatsArr.slice(blockSize * 2)];

              return (
                <motion.div 
                  key={row.label} 
                  className="flex items-center justify-center mb-2.5 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="w-5 text-[9px] font-bold text-right mr-2 shrink-0" style={{ color: row.color, letterSpacing: '0.05em' }}>
                    {row.label}
                  </span>
                  {blocks.map((block, bi) => (
                    <div key={bi} className="flex items-center">
                      <div className="flex gap-[3px]">
                        {block.map((idx) => {
                          const isSellerSeat = idx === ticket.seatIndex;
                          return (
                            <motion.div
                              key={idx}
                              whileHover={isSellerSeat ? { scale: 1.5, y: -4 } : {}}
                              className="transition-all duration-300 rounded-sm cursor-pointer"
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 3,
                                background: isSellerSeat ? '#FFFFFF' : row.color,
                                opacity: isSellerSeat ? 1 : 0.2,
                                boxShadow: isSellerSeat ? `0 0 16px ${row.color}, 0 0 6px #fff, 0 4px 12px rgba(0,0,0,0.3)` : 'none',
                                border: isSellerSeat ? `2px solid ${row.color}` : 'none',
                                transform: isSellerSeat ? 'scale(1.8)' : 'scale(1)',
                                zIndex: isSellerSeat ? 10 : 1,
                                position: 'relative',
                              }}
                              title={isSellerSeat ? `${row.label}${(bi * blockSize) + block.indexOf(idx) + 1} — Your Ticket` : `${row.label}${(bi * blockSize) + block.indexOf(idx) + 1}`}
                            />
                          );
                        })}
                      </div>
                      {bi < 2 && <div style={{ width: 12 }} />}
                    </div>
                  ))}
                  <span className="w-5 text-[9px] font-bold ml-2 shrink-0" style={{ color: row.color, letterSpacing: '0.05em' }}>
                    {row.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-6 p-4 rounded-lg" style={{ background: isDark ? '#0a0a0a' : '#f9f9f9', border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
          {event.tiers.map((t) => (
            <motion.div key={t.name} className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <span className="w-3 h-3 rounded-sm" style={{ background: TIER_COLORS[t.name] || '#2DD4BF', boxShadow: `0 0 8px ${TIER_COLORS[t.name] || '#2DD4BF'}33` }} />
              <span className="text-[10px] font-medium" style={{ color: isDark ? '#666' : '#999' }}>{t.name}</span>
            </motion.div>
          ))}
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
            <span className="w-3 h-3 rounded-sm" style={{ background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.3)', border: `1.5px solid ${isDark ? '#555' : '#ccc'}` }} />
            <span className="text-[10px] font-bold" style={{ color: '#7DA8CF' }}>This Ticket</span>
          </motion.div>
        </div>

        {/* Ticket info bar */}
        <div
          className="rounded-lg border p-4 flex items-center justify-between"
          style={{ background: isDark ? '#111' : '#f9f9f9', borderColor: isDark ? '#1a1a1a' : '#eee' }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#111' }}>
              Seat {ticket.seat} — {ticket.tier}
            </p>
            <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>
              Original ₹{ticket.originalPrice} → Resale ₹{ticket.resalePrice}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold font-mono" style={{ color: '#7DA8CF' }}>₹{ticket.resalePrice}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? '#444' : '#bbb' }}>
              {Math.round((ticket.resalePrice / ticket.originalPrice) * 100)}% of original
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResaleTicketCard({ ticket, onViewSeat }) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [sliderValue, setSliderValue] = useState(ticket.resalePrice);
  const [status, setStatus] = useState('idle');
  const minPrice = Math.round(ticket.originalPrice * 0.5);
  const maxPrice = ticket.originalPrice * 2;

  const { user } = useStore();

  const handleQuote = async () => {
    if (!user?.token) {
      toast.error('Please sign in to make an offer');
      return;
    }
    
    try {
      setStatus('pending');
      const res = await fetch(`${API_BASE}/api/resale/${ticket.listingId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ offerPrice: sliderValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send offer');

      toast.success(`Offer of ₹${sliderValue} sent to seller!`);
      setStatus('sent');
      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      toast.error(err.message);
      setStatus('idle');
    }
  };

  const handleBuy = async () => {
    if (!user?.token) {
      toast.error('Please sign in to buy');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/resale/${ticket.listingId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Purchased seat ${ticket.seat} for ₹${ticket.resalePrice}!`);
        window.location.reload(); // Refresh to update listings
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.error(err.message || 'Purchase failed');
    }
  };

  const pricePercent = ((sliderValue - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-lg aspect-[3/2] mb-4 cursor-pointer" onClick={() => onViewSeat(ticket)}>
        <img
          src={ticket.image}
          alt={ticket.eventTitle}
          className="w-full h-full object-cover transition-all duration-700"
          style={{ filter: isDark ? 'grayscale(100%)' : 'grayscale(30%)' }}
          onMouseOver={(e) => { e.currentTarget.style.filter = 'grayscale(0%)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseOut={(e) => { e.currentTarget.style.filter = isDark ? 'grayscale(100%)' : 'grayscale(30%)'; e.currentTarget.style.transform = 'scale(1)'; }}
        />
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-1" style={{ background: '#4ADE80', color: '#000' }}>
            <Check className="w-3 h-3" /> 2x Cap
          </span>
        </div>
        {/* View seat overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(125,168,207,0.9)', color: '#000' }}>
            <MapPin className="w-3.5 h-3.5" /> View Seat Location
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <h4 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>
          {ticket.eventTitle}
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
            style={{ background: TIER_COLORS[ticket.tier] || '#2DD4BF', color: '#000' }}
          >
            {ticket.tier}
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: isDark ? '#555' : '#999' }}>
            Seat {ticket.seat} &middot; {ticket.seller}
          </span>
        </div>

        {/* Prices */}
        <div className="flex flex-col gap-1 mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: isDark ? '#aaa' : '#777' }}>
            Seller asking price: ₹{ticket.resalePrice.toLocaleString()}
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-sm line-through" style={{ color: isDark ? '#555' : '#bbb' }}>₹{ticket.originalPrice}</span>
            <span className="text-2xl font-bold font-mono" style={{ color: '#7DA8CF' }}>₹{sliderValue}</span>
          </div>
        </div>

        {/* Price Slider */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2" style={{ color: isDark ? '#555' : '#aaa' }}>
            <span>₹{minPrice}</span>
            <span className="font-medium" style={{ color: '#7DA8CF' }}>Your offer</span>
            <span>₹{maxPrice}</span>
          </div>
          <div className="relative">
            <div className="w-full h-1.5 rounded-full" style={{ background: isDark ? '#1a1a1a' : '#e5e5e5' }} />
            <div className="absolute top-0 left-0 h-1.5 rounded-full transition-all duration-150" style={{ width: `${pricePercent}%`, background: '#7DA8CF' }} />
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={10}
              value={sliderValue}
              onChange={(e) => { setSliderValue(Number(e.target.value)); setStatus('idle'); }}
              className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
              style={{ margin: 0 }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-150"
              style={{ left: `calc(${pricePercent}% - 8px)`, background: isDark ? '#000' : '#fff', borderColor: '#7DA8CF', top: '3px' }}
            />
          </div>
          <div className="relative mt-1">
            <div className="absolute text-[10px] -translate-x-1/2" style={{ left: `${((ticket.resalePrice - minPrice) / (maxPrice - minPrice)) * 100}%`, color: isDark ? '#555' : '#aaa' }}>
              ▲ Seller: ₹{ticket.resalePrice}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-8">
          <button
            onClick={() => onViewSeat(ticket)}
            className="py-3 px-4 rounded text-xs uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5"
            style={{ background: 'transparent', borderColor: isDark ? '#222' : '#ddd', color: isDark ? '#888' : '#666' }}
          >
            <MapPin className="w-3.5 h-3.5" /> View Seat
          </button>
          <AnimatePresence mode="wait">
            {status === 'accepted' ? (
              <motion.button
                key="buy"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleBuy}
                className="flex-1 py-3 rounded font-bold text-sm uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-2"
                style={{ background: '#4ADE80', color: '#000' }}
              >
                <Check className="w-4 h-4" /> Buy — ₹{sliderValue}
              </motion.button>
            ) : status === 'pending' ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 py-3 rounded text-center text-sm font-medium"
                style={{ background: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#888' : '#666' }}
              >
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  Waiting for seller...
                </motion.span>
              </motion.div>
            ) : status === 'sent' ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 py-3 rounded text-center text-sm font-medium"
                style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}
              >
                Offer Sent!
              </motion.div>
            ) : (
              <motion.button
                key="quote"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleQuote}
                className="flex-1 py-3 rounded font-bold text-sm uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
                style={{ background: '#7DA8CF', color: '#000' }}
              >
                <Tag className="w-4 h-4" /> Quote ₹{sliderValue}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResaleMarketplace() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [viewingTicket, setViewingTicket] = useState(null);
  const [listings, setListings] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resaleRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/api/resale`),
          fetch(`${API_BASE}/api/events`)
        ]);

        const resaleData = await resaleRes.json();
        const eventsData = await eventsRes.json();

        // Create map of eventId -> event for easy lookup
        const eventMap = {};
        (eventsData.events || []).forEach(e => {
          eventMap[e.eventId] = e;
        });

        // Map listings to include event info
        const enrichedListings = (resaleData.listings || []).map(l => ({
          ...l,
          id: l.listingId,
          resalePrice: l.price,          // backend stores as `price`, card expects `resalePrice`
          originalPrice: l.originalPrice,
          seller: l.sellerName || `Seller #${(l.sellerId || '').slice(0, 6)}`,
          eventTitle: eventMap[l.eventId]?.title || 'Unknown Event',
          image: eventMap[l.eventId]?.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
          seat: (l.seats || []).join(', '),
          tier: 'Resale',
        }));

        setEvents(eventMap);
        setListings(enrichedListings);
      } catch (err) {
        toast.error('Failed to load marketplace data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
          Marketplace
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold font-heading"
          style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
        >
          Resale Tickets
        </h2>
        <p className="text-sm mt-3 max-w-lg" style={{ color: isDark ? '#666' : '#999' }}>
          Browse available resale tickets. Click any ticket to see the exact seat location on the venue map. Use the slider to set your offer price.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
           <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p style={{ color: isDark ? '#555' : '#888' }}>No tickets available for resale right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {listings.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <ResaleTicketCard ticket={ticket} onViewSeat={setViewingTicket} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Seat Map Modal */}
      <AnimatePresence>
        {viewingTicket && (
          <SeatMapModal
            ticket={viewingTicket}
            onClose={() => setViewingTicket(null)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
