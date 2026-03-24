import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, X, Calendar, MapPin, Clock, QrCode, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const statusConfig = {
  upcoming: { color: '#7DA8CF', bg: 'rgba(125,168,207,0.12)', label: 'UPCOMING' },
  completed: { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', label: 'COMPLETED' },
  failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'CANCELLED' },
};

function TicketQRModal({ booking, isDark, onClose }) {
  const ticketUrl = `${window.location.origin}/ticket/${booking.id}`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        className="rounded-xl border p-8 max-w-sm w-full text-center"
        style={{ background: isDark ? '#0a0a0a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#eee' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#7DA8CF' }}>CookMyShow</p>
        <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>{booking.eventTitle}</h3>
        <p className="text-xs mb-5" style={{ color: isDark ? '#555' : '#999' }}>
          {booking.date} &middot; {booking.location}
        </p>

        <div className="flex justify-center mb-5">
          <div className="p-4 rounded-lg" style={{ background: isDark ? '#111' : '#f5f5f5' }}>
            <QRCodeSVG
              value={ticketUrl}
              size={160}
              level="M"
              bgColor="transparent"
              fgColor={isDark ? '#fff' : '#111'}
            />
          </div>
        </div>

        <p className="text-xs font-mono font-bold mb-1" style={{ color: isDark ? '#ccc' : '#333' }}>{booking.id}</p>
        <p className="text-xs mb-4" style={{ color: isDark ? '#444' : '#bbb' }}>
          {booking.tier} &middot; {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''} &middot; Seats: {booking.seats.join(', ')}
        </p>

        <div className="flex gap-2 justify-center text-xs" style={{ color: isDark ? '#555' : '#999' }}>
          <span className="px-3 py-1 rounded-full font-mono" style={{ background: isDark ? '#111' : '#f5f5f5' }}>
            ₹{booking.total.toLocaleString()}
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider border-none cursor-pointer"
          style={{ background: '#7DA8CF', color: '#000' }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function ResellModal({ booking, isDark, onClose, onRefresh }) {
  const totalSeats = booking.seats.length;
  const originalPerSeat = Math.round(booking.total / totalSeats);
  const [seatCount, setSeatCount] = useState(totalSeats);
  const [pricePerSeat, setPricePerSeat] = useState(originalPerSeat);
  const [processing, setProcessing] = useState(false);
  const { user } = useStore();

  const minPerSeat = Math.round(originalPerSeat * 0.5);
  const maxPerSeat = Math.round(originalPerSeat * 2);
  const totalResellPrice = pricePerSeat * seatCount;
  const seatsToList = booking.seats.slice(0, seatCount);
  const percent = ((pricePerSeat - minPerSeat) / (maxPerSeat - minPerSeat)) * 100;

  const handleList = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE}/api/resale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          bookingId: booking.id,
          price: totalResellPrice,
          seats: seatsToList,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to list ticket');

      toast.success(`${seatCount} seat${seatCount > 1 ? 's' : ''} listed for ₹${totalResellPrice.toLocaleString()}`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        className="rounded-xl border p-6 max-w-md w-full"
        style={{ background: isDark ? '#0a0a0a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#eee' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" style={{ color: '#7DA8CF' }} />
            <h3 className="text-lg font-bold font-heading" style={{ color: isDark ? '#fff' : '#111' }}>Resell Ticket</h3>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: isDark ? '#555' : '#999' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-lg p-4 mb-5" style={{ background: isDark ? '#111' : '#f5f5f5' }}>
          <p className="font-semibold text-sm mb-1" style={{ color: isDark ? '#fff' : '#111' }}>{booking.eventTitle}</p>
          <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>
            {booking.tier} &middot; All seats: {booking.seats.join(', ')} &middot; Bought at ₹{booking.total.toLocaleString()}
          </p>
        </div>

        {/* Seat count selector */}
        {totalSeats > 1 && (
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-wider mb-3" style={{ color: isDark ? '#555' : '#aaa' }}>
              Seats to resell
            </label>
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setSeatCount(c => Math.max(1, c - 1))}
                disabled={seatCount <= 1}
                className="w-9 h-9 rounded-full border font-bold text-lg flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ background: isDark ? '#111' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#fff' : '#111' }}
              >−</button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold font-mono" style={{ color: '#7DA8CF' }}>{seatCount}</span>
                <span className="text-sm ml-1" style={{ color: isDark ? '#555' : '#999' }}>/ {totalSeats} seat{totalSeats > 1 ? 's' : ''}</span>
                <p className="text-[11px] mt-1 font-mono" style={{ color: isDark ? '#444' : '#bbb' }}>
                  Listing: {seatsToList.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setSeatCount(c => Math.min(totalSeats, c + 1))}
                disabled={seatCount >= totalSeats}
                className="w-9 h-9 rounded-full border font-bold text-lg flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ background: isDark ? '#111' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#fff' : '#111' }}
              >+</button>
            </div>
          </div>
        )}

        {/* Price input */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: isDark ? '#555' : '#aaa' }}>
            Price per seat
          </label>
          <div className="text-center mb-1">
            <span className="text-3xl font-bold font-mono" style={{ color: '#7DA8CF' }}>
              ₹{pricePerSeat.toLocaleString()}
            </span>
            <span className="text-sm ml-2" style={{ color: isDark ? '#555' : '#999' }}>/ seat</span>
          </div>
          {seatCount > 1 && (
            <p className="text-center text-sm font-mono mb-3" style={{ color: isDark ? '#666' : '#888' }}>
              Total: ₹{totalResellPrice.toLocaleString()} for {seatCount} seats
            </p>
          )}

          {/* Slider */}
          <div className="relative mb-2">
            <div className="w-full h-2 rounded-full" style={{ background: isDark ? '#1a1a1a' : '#e5e5e5' }} />
            <div
              className="absolute top-0 left-0 h-2 rounded-full transition-all duration-100"
              style={{ width: `${percent}%`, background: pricePerSeat > originalPerSeat ? '#F59E0B' : '#4ADE80' }}
            />
            <input
              type="range"
              min={minPerSeat}
              max={maxPerSeat}
              step={5}
              value={pricePerSeat}
              onChange={(e) => setPricePerSeat(Number(e.target.value))}
              className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
              style={{ margin: 0 }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all duration-100"
              style={{
                left: `calc(${percent}% - 10px)`,
                background: isDark ? '#000' : '#fff',
                borderColor: pricePerSeat > originalPerSeat ? '#F59E0B' : '#4ADE80',
                top: '4px',
              }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono" style={{ color: isDark ? '#444' : '#bbb' }}>
            <span>₹{minPerSeat}/seat</span>
            <span>Original: ₹{originalPerSeat}/seat</span>
            <span>Max: ₹{maxPerSeat}/seat</span>
          </div>
        </div>

        {/* Price cap notice */}
        <div className="rounded-lg p-3 mb-5 flex items-start gap-2" style={{ background: 'rgba(125,168,207,0.08)' }}>
          <span className="text-xs" style={{ color: '#7DA8CF' }}>ℹ</span>
          <p className="text-xs" style={{ color: isDark ? '#888' : '#666' }}>
            Max price is 2× per seat (₹{maxPerSeat}/seat). Listing {seatCount} seat{seatCount > 1 ? 's' : ''} · Total ₹{totalResellPrice.toLocaleString()}.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer border"
            style={{ background: 'transparent', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#ccc' : '#444' }}
          >
            Cancel
          </button>
          <button
            onClick={handleList}
            disabled={processing}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider border-none cursor-pointer disabled:opacity-50"
            style={{ background: '#7DA8CF', color: '#000' }}
          >
            {processing ? 'Listing...' : `List ${seatCount} seat${seatCount > 1 ? 's' : ''} · ₹${totalResellPrice.toLocaleString()}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BookingCard({ booking, isDark, onCancel, onQR, onResell, resaleListing, resaleOffers, onOfferAction, offerActionLoading }) {
  const [offersOpen, setOffersOpen] = useState(false);
  const status = statusConfig[booking.status] || statusConfig.upcoming;
  const hasSoldTransfer = booking.resoldTo != null;

  const offersList = Array.isArray(resaleOffers) ? resaleOffers : [];
  const activeOffers = offersList.filter((o) => o.status !== 'rejected');
  const pendingOffers = activeOffers.filter((o) => o.status === 'pending');
  const bestOffer = activeOffers.length > 0 ? Math.max(...activeOffers.map((o) => o.offerPrice || 0)) : null;
  const isListingSold = resaleListing?.status === 'sold';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      className="rounded-xl border overflow-hidden group"
      style={{
        background: isDark ? '#0a0a0a' : '#fff',
        borderColor: isDark ? '#1a1a1a' : '#eee',
      }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-52 h-40 md:h-auto shrink-0 overflow-hidden">
          <img
            src={booking.image}
            alt=""
            className="w-full h-full object-cover transition-all duration-700"
            style={{ filter: isDark ? 'grayscale(60%) brightness(0.7)' : 'grayscale(20%)' }}
            onMouseOver={(e) => { e.currentTarget.style.filter = 'grayscale(0%) brightness(1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = isDark ? 'grayscale(60%) brightness(0.7)' : 'grayscale(20%)'; e.currentTarget.style.transform = 'scale(1)'; }}
          />
          <div className="absolute top-3 left-3">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm"
              style={{ background: status.bg, color: status.color, backdropFilter: 'blur(8px)' }}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-bold font-heading mb-2" style={{ color: isDark ? '#fff' : '#111' }}>
              {booking.eventTitle}
            </h4>
            <div className="flex flex-wrap gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: isDark ? '#666' : '#999' }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#7DA8CF' }} /> {booking.date}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: isDark ? '#666' : '#999' }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: '#7DA8CF' }} /> {booking.location}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs px-3 py-1 rounded-full font-mono" style={{ background: isDark ? '#111' : '#f5f5f5', color: isDark ? '#ccc' : '#444' }}>
                {booking.tier}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-mono" style={{ background: isDark ? '#111' : '#f5f5f5', color: isDark ? '#ccc' : '#444' }}>
                {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-mono font-bold" style={{ background: 'rgba(125,168,207,0.1)', color: '#7DA8CF' }}>
                ₹{booking.total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3" style={{ borderTop: `1px solid ${isDark ? '#1a1a1a' : '#f0f0f0'}` }}>
            {booking.status === 'upcoming' && (
              <>
            {booking.status === 'upcoming' && (
              <>
                <button
                  onClick={() => onQR(booking)}
                  className="text-xs uppercase tracking-wider py-2 px-4 rounded-lg border-none cursor-pointer font-bold flex items-center gap-1.5 transition-all hover:opacity-80"
                  style={{ background: '#7DA8CF', color: '#000' }}
                >
                  <QrCode className="w-3.5 h-3.5" /> View Ticket
                </button>
                {booking.isReselling && !isListingSold ? (
                   <>
                     <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border" style={{ borderColor: '#F59E0B', color: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}>
                       Listing Active
                     </span>
                     {resaleListing?.price != null && (
                       <span className="text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                         Seller price: ₹{Number(resaleListing.price).toLocaleString()}
                       </span>
                     )}
                     <span className="text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
                       {pendingOffers.length} offer(s)
                     </span>
                     {bestOffer !== null && (
                       <span className="text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg" style={{ background: 'rgba(125,168,207,0.12)', color: '#7DA8CF' }}>
                         Best ₹{bestOffer.toLocaleString()}
                       </span>
                     )}
                     <button
                       onClick={() => setOffersOpen((prev) => !prev)}
                       className="text-xs uppercase tracking-wider py-2 px-4 rounded-lg border cursor-pointer font-bold"
                       style={{ background: '#222', color: '#fff' }}
                     >
                       {offersOpen ? 'Hide Offers' : 'View Offers'}
                     </button>
                   </>
                ) : !booking.fromResale ? (
                  <button
                    onClick={() => onResell(booking)}
                    className="text-xs uppercase tracking-wider py-2 px-4 rounded-lg border cursor-pointer font-bold flex items-center gap-1.5 transition-all hover:bg-white/5"
                    style={{ background: 'transparent', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#ccc' : '#444' }}
                  >
                    <Tag className="w-3.5 h-3.5" /> Resell
                  </button>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                    Resale not allowed
                  </span>
                )}
                <button
                  onClick={() => onCancel(booking.id)}
                  className="text-xs uppercase tracking-wider py-2 px-4 rounded-lg border cursor-pointer font-bold transition-all hover:bg-red-500/10"
                  style={{ background: 'transparent', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}
                >
                  Cancel
                </button>
              </>
            )}
              </>
            )}
            {booking.status === 'completed' && !hasSoldTransfer && (
              <button
                onClick={() => onQR(booking)}
                className="text-xs uppercase tracking-wider py-2 px-4 rounded-lg border-none cursor-pointer font-bold flex items-center gap-1.5"
                style={{ background: '#7DA8CF', color: '#000' }}
              >
                <Ticket className="w-3.5 h-3.5" /> e-Ticket
              </button>
            )}
            {booking.status === 'completed' && hasSoldTransfer && (
              <span className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
                ✓ Ticket Sold
              </span>
            )}
            {booking.status === 'failed' && (
              <span className="text-xs italic" style={{ color: isDark ? '#555' : '#bbb' }}>
                Refund processed
              </span>
            )}
          </div>

          {resaleListing && isListingSold && offersOpen && (
            <div className="border-t pt-3 mt-3" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                ✓ Sold to buyer
              </span>
            </div>
          )}
          {resaleListing && offersOpen && !isListingSold && (
            <div className="border-t pt-3 mt-3" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7DA8CF' }}>
                Offers for resale listing
              </p>
              {activeOffers && activeOffers.length > 0 ? (
                activeOffers.map((offer) => (
                  <div key={offer.offerId} className="rounded-lg p-3 mb-2" style={{ background: isDark ? '#111' : '#f9f9f9' }}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>
                          Buyer: {offer.buyerId}
                        </p>
                        <p className="text-xs" style={{ color: isDark ? '#aaa' : '#777' }}>
                          Offer: ₹{offer.offerPrice.toLocaleString()} • {offer.status}
                        </p>
                      </div>
                      {offer.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onOfferAction(offer.offerId, 'accept')}
                            disabled={offerActionLoading === offer.offerId}
                            className="text-xs py-1 px-3 rounded-lg font-bold"
                            style={{ background: '#4ADE80', color: '#000' }}
                          >
                            {offerActionLoading === offer.offerId ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => onOfferAction(offer.offerId, 'reject')}
                            disabled={offerActionLoading === offer.offerId}
                            className="text-xs py-1 px-3 rounded-lg font-bold"
                            style={{ background: '#EF4444', color: '#fff' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {offer.status !== 'pending' && (
                        <span className="text-[10px] font-bold uppercase" style={{ color: isDark ? '#aaa' : '#777' }}>
                          {offer.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs" style={{ color: isDark ? '#aaa' : '#777' }}>
                  No offers yet for this listing.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [cancelModal, setCancelModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [resellModal, setResellModal] = useState(null);
  const navigate = useNavigate();
  const [sellerListings, setSellerListings] = useState([]);
  const [sellerOffers, setSellerOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offerActionLoading, setOfferActionLoading] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshFn, setRefreshFn] = useState(null);
  const { mode } = useTheme();
  const { user, logout } = useStore();
  const isDark = mode === 'dark';

  // Fetch real bookings from the backend on mount
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!user?.token) return;

      const headers = { Authorization: `Bearer ${user.token}` };
      setOffersLoading(true);

      try {
        const [listRes, offerRes] = await Promise.all([
          fetch(`${API_BASE}/api/resale/my`, { headers }),
          fetch(`${API_BASE}/api/offers?role=seller`, { headers }),
        ]);

        if (!listRes.ok) throw new Error('Failed to fetch seller resale listings');
        if (!offerRes.ok) throw new Error('Failed to fetch seller offers');

        const listData = await listRes.json();
        const offerData = await offerRes.json();

        console.log('[MyBookings] Seller listings:', listData.listings);
        console.log('[MyBookings] Seller offers:', offerData.offers);

        setSellerListings(listData.listings || []);
        setSellerOffers(offerData.offers || []);
      } catch (err) {
        console.warn('[MyBookings] fetch seller data error:', err.message);
      } finally {
        setOffersLoading(false);
      }
    };

    const fetchBookings = async () => {
      if (!user?.token) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // user.token is the Firebase ID token stored after login
        const token = user?.token;
        const res = await fetch(`${API_BASE}/api/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errText = await res.text();
          const status = res.status;

          if (status === 401 || status === 403) {
            // Force logout and redirect to login for re-auth
            logout();
            navigate('/auth/login');
            throw new Error('Unauthorized: login required. Redirecting to login.');
          }

          throw new Error(`Failed to fetch bookings (${status})` + (errText ? `: ${errText}` : ''));
        }

        const data = await res.json();

        // Normalise backend shape → shape the UI expects
        const normalised = (data.bookings || []).map((b) => ({
          id:         b.bookingId,
          eventId:    b.eventId,
          eventTitle: b.event?.title  || 'Event',
          date:       b.event?.date   || '',
          location:   b.event?.venue  || '',
          seats:      b.seats || [],
          tier:       b.seatDetails?.[0]?.category || 'General',
          total:      b.totalAmount || 0,
          isReselling: b.isReselling || false,
          fromResale:  b.fromResale || false,
          resoldTo:   b.resoldTo || null,
          // Map backend status → UI status keys
          status:     b.status === 'confirmed' ? 'upcoming' : b.status === 'cancelled' ? 'failed' : b.status === 'resold' ? 'completed' : 'completed',
          image:      b.event?.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        }));
        setBookings(normalised);
      } catch (err) {
        console.warn('[MyBookings] fetch error:', err.message);
        toast.error('Could not load bookings. Is the backend running?');
        setBookings([]); // show empty state, not mock data
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
    fetchSellerData();
    setRefreshFn(() => {
      fetchBookings();
      fetchSellerData();
    });
  }, [user]);

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);


  const handleCancel = async (id) => {
    if (!user?.token) { toast.error('Please login to cancel'); return; }
    try {
      setCancelling(true);
      const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel booking');
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'failed' } : b)));
      setCancelModal(null);
      toast.success('Booking cancelled. Refund will be processed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleOfferAction = async (offerId, action) => {
    if (!user?.token) {
      toast.error('Please login to manage offers');
      return;
    }

    setOfferActionLoading(offerId);

    try {
      const res = await fetch(`${API_BASE}/api/offers/${offerId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Offer update failed');

      toast.success(`Offer ${action}ed successfully`);
      // refresh data after action
      if (typeof refreshFn === 'function') refreshFn();
    } catch (err) {
      console.warn('[MyBookings] offer action failed:', err);
      toast.error(err.message || 'Failed to update the offer');
    } finally {
      setOfferActionLoading(null);
    }
  };

  const listingByTicketId = Object.fromEntries(sellerListings.map((l) => [l.ticketId, l]));
  const offersByListingId = sellerOffers.reduce((acc, offer) => {
    if (!acc[offer.listingId]) acc[offer.listingId] = [];
    acc[offer.listingId].push(offer);
    return acc;
  }, {});

  console.log('[MyBookings] listingByTicketId:', listingByTicketId);
  console.log('[MyBookings] offersByListingId:', offersByListingId);
  console.log('[MyBookings] Bookings:', bookings);
  console.log('[MyBookings] Total offers to display:', sellerOffers.length, 'across', Object.keys(offersByListingId).length, 'listings');

  const tabCounts = {
    all: bookings.length,
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    failed: bookings.filter((b) => b.status === 'failed').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>Account</p>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading" style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}>
              My Bookings
            </h2>
            <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#999' }}>Manage your tickets and reservations</p>
          </div>
          <button
            onClick={() => refreshFn?.()}
            className="text-xs uppercase tracking-wider py-2 px-4 rounded-lg border cursor-pointer font-bold"
            style={{ background: '#7DA8CF', color: '#000' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Loading state while fetching from backend */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-transparent"
            style={{ borderTopColor: '#7DA8CF' }}
          />
          <p className="text-sm" style={{ color: isDark ? '#555' : '#aaa' }}>Loading your bookings…</p>
        </div>
      )}

      {!loading && (
        <>


      <div className="flex gap-1 mb-8 p-1 rounded-lg" style={{ background: isDark ? '#0a0a0a' : '#f5f5f5' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'failed', label: 'Cancelled' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="text-xs uppercase tracking-wider px-5 py-2.5 rounded-md cursor-pointer transition-all border-none flex items-center gap-2"
            style={{
              background: tab === t.key ? (isDark ? '#141414' : '#fff') : 'transparent',
              color: tab === t.key ? (isDark ? '#fff' : '#111') : (isDark ? '#666' : '#999'),
              fontWeight: tab === t.key ? 700 : 500,
              boxShadow: tab === t.key ? (isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)') : 'none',
            }}
          >
            {t.label}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: tab === t.key ? 'rgba(125,168,207,0.15)' : 'transparent', color: tab === t.key ? '#7DA8CF' : (isDark ? '#444' : '#ccc') }}>
              {tabCounts[t.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((booking) => {
            const resaleListing = listingByTicketId[booking.id];
            const resaleOffersForListing = resaleListing ? offersByListingId[resaleListing.listingId] || [] : [];
            
            if (resaleListing) {
              console.log(`[BookingCard] booking.id=${booking.id}, listing.ticketId=${resaleListing.ticketId}, listing.listingId=${resaleListing.listingId}, offers count=${resaleOffersForListing.length}`);
            }

            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                isDark={isDark}
                onCancel={setCancelModal}
                onQR={setQrModal}
                onResell={setResellModal}
                resaleListing={resaleListing}
                resaleOffers={resaleOffersForListing}
                onOfferAction={handleOfferAction}
                offerActionLoading={offerActionLoading}
              />
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 rounded-xl border" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
            <Ticket className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? '#1a1a1a' : '#e5e5e5' }} />
            <p className="text-lg font-heading font-bold mb-1" style={{ color: isDark ? '#444' : '#bbb' }}>No bookings found</p>
            <p className="text-sm" style={{ color: isDark ? '#333' : '#ccc' }}>Your tickets will appear here</p>
          </div>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {qrModal && <TicketQRModal booking={qrModal} isDark={isDark} onClose={() => setQrModal(null)} />}
      </AnimatePresence>

      {/* Resell Modal */}
      <AnimatePresence>
        {resellModal && (
          <ResellModal
            booking={resellModal}
            isDark={isDark}
            onClose={() => setResellModal(null)}
            onRefresh={refreshFn}
          />
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="rounded-xl border p-6 max-w-md w-full"
              style={{ background: isDark ? '#0a0a0a' : '#fff', borderColor: isDark ? '#1a1a1a' : '#eee' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-heading" style={{ color: isDark ? '#fff' : '#111' }}>Cancel Booking</h3>
                <button onClick={() => setCancelModal(null)} className="bg-transparent border-none cursor-pointer" style={{ color: isDark ? '#555' : '#999' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-lg p-4 mb-5" style={{ background: isDark ? '#111' : '#f5f5f5' }}>
                <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: isDark ? '#555' : '#999' }}>Refund Policy</p>
                <ul className="text-xs space-y-1 list-disc pl-4" style={{ color: isDark ? '#888' : '#666' }}>
                  <li>Full refund if cancelled 48+ hours before event</li>
                  <li>50% refund if cancelled 24-48 hours before</li>
                  <li>No refund within 24 hours of the event</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCancelModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer border" style={{ background: 'transparent', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#ccc' : '#444' }}>
                  Keep
                </button>
                <button onClick={() => handleCancel(cancelModal)} disabled={cancelling} className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider border-none cursor-pointer disabled:opacity-60" style={{ background: '#EF4444', color: '#fff' }}>
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
