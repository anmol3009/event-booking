import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useStore();
  const { event, seats, tier, total, holdExpiry } = location.state || {};
  const [timeLeft, setTimeLeft] = useState(300);
  const [processing, setProcessing] = useState(false);
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    if (!holdExpiry) return;
    const expiry = new Date(holdExpiry).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiry]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleConfirm = async () => {
    if (!user?.token) return toast.error('Authentication expired. Please login again.');
    
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE}/api/bookings/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          seatIds: seats.map(s => s.toString()),
          totalAmount: total
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment confirmation failed');

      navigate(`/confirmation/${data.bookingId}`, { 
        state: { 
          event, 
          seats, 
          tier, 
          total,
          bookingId: data.bookingId
        } 
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 style={{ color: isDark ? '#fff' : '#111' }}>No booking data. Please select seats first.</h2>
      </div>
    );
  }

  const serviceFee = Math.round(total * 0.05);
  const grandTotal = total + serviceFee;
  const timerColor = timeLeft < 60 ? '#EF4444' : timeLeft < 180 ? '#F59E0B' : '#7DA8CF';

  const inputStyle = {
    background: isDark ? '#0a0a0a' : '#fff',
    borderColor: isDark ? '#222' : '#e5e5e5',
    color: isDark ? '#fff' : '#333',
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <button onClick={() => navigate(-1)} className="link-more mb-6 text-sm bg-transparent border-none cursor-pointer flex items-center gap-1" style={{ color: '#7DA8CF' }}>
        <ArrowLeft className="w-4 h-4" /> Back to event
      </button>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3 mb-8 py-3 rounded-lg border"
        style={{ borderColor: isDark ? '#222' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}
      >
        <Clock className="w-5 h-5" style={{ color: timerColor }} />
        <span className="font-mono font-bold text-xl" style={{ color: timerColor }}>{formatTime(timeLeft)}</span>
        <span className="text-sm" style={{ color: isDark ? '#666' : '#999' }}>remaining to complete</span>
      </motion.div>

      <h2 className="text-3xl font-bold font-heading mb-8" style={{ color: isDark ? '#fff' : '#111' }}>Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Payment Form */}
        <div className="rounded-lg border p-6" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
          <h3 className="text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2" style={{ color: '#7DA8CF' }}>
            <CreditCard className="w-4 h-4" /> Payment Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Cardholder Name</label>
              <input type="text" placeholder="John Doe" className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Card Number</label>
              <input type="text" placeholder="4242 4242 4242 4242" className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Expiry</label>
                <input type="text" placeholder="MM/YY" className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>CVV</label>
                <input type="text" placeholder="123" className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Email</label>
              <input type="email" placeholder="you@email.com" className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-lg border p-6 h-fit sticky top-20" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
          <h3 className="text-xs uppercase tracking-widest font-bold mb-5" style={{ color: '#7DA8CF' }}>Order Summary</h3>

          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
            <img src={event.image} alt="" className="w-14 h-14 rounded object-cover" style={{ filter: isDark ? 'brightness(0.8)' : 'none' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>{event.title}</p>
              <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>{event.date}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#666' : '#999' }}>{tier} × {seats.length}</span>
              <span className="font-mono" style={{ color: isDark ? '#fff' : '#111' }}>₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#666' : '#999' }}>Service Fee</span>
              <span className="font-mono" style={{ color: isDark ? '#fff' : '#111' }}>₹{serviceFee.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between items-baseline" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
            <span className="font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>Total</span>
            <span className="text-2xl font-bold font-mono" style={{ color: '#7DA8CF' }}>₹{grandTotal.toLocaleString()}</span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={processing || timeLeft === 0}
            className="w-full mt-5 py-3.5 rounded font-bold text-sm uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#7DA8CF', color: '#000' }}
          >
            {processing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <><Lock className="w-4 h-4" /> Confirm Booking</>
            )}
          </button>

          <p className="text-xs text-center mt-3" style={{ color: isDark ? '#444' : '#bbb' }}>
            Seats held for {formatTime(timeLeft)}
          </p>
        </div>
      </div>
    </div>
  );
}
