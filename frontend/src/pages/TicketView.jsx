import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, ShieldCheck, ArrowLeft, Download, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useTheme from '../store/useTheme';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function TicketView() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        // We fetching by ID. This endpoint shouldn't necessarily require Auth 
        // if it's meant to be scanned by an usher, but for now we try public fetch 
        // or redirect to login. Actually, usually ticket views are public but signed.
        // For simplicity, we'll fetch from a generic booking endpoint if available, 
        // or reuse /api/bookings/:id (which might require auth).
        // Let's assume we need a public endpoint for ticket validation.
        
        const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Ticket not found');
        const data = await res.json();
        setBooking(data.booking);
      } catch (err) {
        toast.error('Invalid or expired ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#7DA8CF]"
        />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Ticket className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">This ticket may have been cancelled or is invalid.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#7DA8CF] text-black font-bold rounded-lg">Go Home</button>
      </div>
    );
  }

  const event = booking.event || {};

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="max-w-md mx-auto px-6 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase">e-Ticket</h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="max-w-md mx-auto px-6">
        {/* The Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: isDark ? '#111' : '#fff' }}
        >
          {/* Top Section: Image & Basic Info */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src={event.images?.[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600'} 
              className="w-full h-full object-cover"
              alt=""
              style={{ filter: 'brightness(0.7)' }}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#111] to-transparent">
              <h2 className="text-2xl font-bold font-heading text-white">{event.title}</h2>
            </div>
            {/* Status Ribbon */}
            <div className="absolute top-4 right-4">
              {booking.status === 'confirmed' ? (
                <span className="px-3 py-1 rounded-full bg-green-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              ) : booking.status === 'resold' ? (
                <span className="px-3 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <Share2 className="w-3 h-3" /> Transferred
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <X className="w-3 h-3" /> {booking.status?.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6">
            {booking.status === 'resold' && (
              <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold text-center">
                This ticket has been resold and is no longer valid for the original owner.
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#7DA8CF]" />
                  <span className="text-sm font-bold">{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Time</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7DA8CF]" />
                  <span className="text-sm font-bold">07:00 PM</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Venue</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#7DA8CF]" />
                <span className="text-sm font-bold">{event.venue}</span>
              </div>
            </div>

            {/* Dash border separator */}
            <div className="relative my-8 h-px">
              <div className="absolute -left-10 -top-4 w-8 h-8 rounded-full bg-[#050505]" />
              <div className="absolute -right-10 -top-4 w-8 h-8 rounded-full bg-[#050505]" />
              <div className="border-t border-dashed border-gray-800 w-full" />
            </div>

            {/* Seat Information */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className="text-[8px] uppercase tracking-tighter text-gray-500 mb-1">Row</p>
                <p className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {booking.seatDetails?.[0]?.row || (booking.seats?.[0]?.match(/^[A-Z]+/)?.[0] || '?')}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className="text-[8px] uppercase tracking-tighter text-gray-500 mb-1">Seat</p>
                <p className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {booking.seats?.join(', ')}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className="text-[8px] uppercase tracking-tighter text-gray-500 mb-1">Tier</p>
                <p className={`text-lg font-black font-mono uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {booking.seatDetails?.[0]?.category || 'GEN'}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="p-6 rounded-[2rem] bg-white shadow-xl">
                <QRCodeSVG 
                  value={`${window.location.origin}/ticket/${bookingId}`} 
                  size={180}
                  level="H"
                />
              </div>
              <p className="mt-6 text-[10px] font-mono text-gray-500 tracking-wider">REF: {bookingId.toUpperCase()}</p>
            </div>
          </div>

          {/* Bottom Footer Section */}
          <div className={`p-6 border-t ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} flex items-center justify-between`}>
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-[#7DA8CF]/10">
                 <Ticket className="w-5 h-5 text-[#7DA8CF]" />
               </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Customer</p>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{booking.userName || 'Unknown'}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Price</p>
                <p className="text-sm font-black text-[#7DA8CF]">₹{booking.totalAmount?.toLocaleString()}</p>
             </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
           <button className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm shadow-xl transition-all ${
             isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
           }`}>
             <Download className="w-4 h-4" /> Save PDF
           </button>
           <button className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm shadow-xl transition-all ${
             isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
           }`}>
             <Share2 className="w-4 h-4" /> Share
           </button>
        </div>

        {/* Notice */}
        <p className="mt-10 text-center text-[10px] text-gray-600 leading-relaxed px-10">
          This is an official digital ticket. Please present the QR code at the venue gate for entry. 
          Each ticket admits one person only.
        </p>
      </div>
    </div>
  );
}

// Helper icons (replacing Lucide if needed but Lucide is preferred)
function Clock({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
