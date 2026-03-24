import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CreditCard, Lock, ArrowLeft, Smartphone, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser, clearSeats } = useStore();
  const { event, seats, tier, total, holdExpiry } = location.state || {};
  const [timeLeft, setTimeLeft] = useState(300);
  const [processing, setProcessing] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [form, setForm] = useState({ 
    name: 'John Doe', 
    card: '4242 4242 4242 4242', 
    expiry: '12/30', 
    cvv: '123', 
    email: 'test@email.com' 
  });
  const [errors, setErrors] = useState({});
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const userCoins = user?.coins || 0;
  const coinDiscount = Math.min(userCoins, coinsToUse, total);
  const finalTotal = total - coinDiscount;

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

  const setField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    if (paymentMethod === 'upi') return true; // UPI is "I Have Paid" flow
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const cardDigits = form.card.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardDigits)) e.card = 'Enter a valid 16-digit card number';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) e.expiry = 'Use MM/YY format';
    if (!/^\d{3,4}$/.test(form.cvv)) e.cvv = 'Enter a valid CVV';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    if (!user?.token) return toast.error('Authentication expired. Please login again.');
    
    try {
      setProcessing(true);
      // Simulate payment delay as requested (1.5s)
      await new Promise(r => setTimeout(r, 1500));

      const res = await fetch(`${API_BASE}/api/bookings/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          seatIds: seats.map(s => s.toString()),
          totalAmount: total,
          coinsToUse: coinDiscount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment confirmation failed');

      // Sync coins in store
      if (data.newCoins !== undefined) {
        updateUser({ coins: data.newCoins });
      }

      // Clear selection
      clearSeats();

      toast.success('Payment successful! Booking confirmed.');

      navigate(`/confirmation/${data.bookingId}`, { 
        state: { 
          event, 
          seats, 
          tier, 
          total: finalTotal,
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
  const grandTotal = finalTotal + serviceFee;
  const timerColor = timeLeft < 60 ? '#EF4444' : timeLeft < 180 ? '#F59E0B' : '#7DA8CF';

  const inputStyle = {
    background: isDark ? '#0a0a0a' : '#fff',
    borderColor: isDark ? '#222' : '#e5e5e5',
    color: isDark ? '#fff' : '#333',
  };

  const upiLink = `upi://pay?pa=shardulaher@oksbi&pn=CookMyShow&am=1&cu=INR`;

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
        <div className="space-y-6">
          {/* Payment Method Selector */}
          <div className="rounded-lg border p-6" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
            <h3 className="text-xs uppercase tracking-widest font-bold mb-5 flex items-center gap-2" style={{ color: '#7DA8CF' }}>
              Select Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === 'card' ? 'border-[#7DA8CF] bg-[#7DA8CF]/5' : 'border-transparent bg-white/5'}`}
                style={{ color: paymentMethod === 'card' ? '#7DA8CF' : (isDark ? '#666' : '#999') }}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === 'upi' ? 'border-[#7DA8CF] bg-[#7DA8CF]/5' : 'border-transparent bg-white/5'}`}
                style={{ color: paymentMethod === 'upi' ? '#7DA8CF' : (isDark ? '#666' : '#999') }}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">UPI QR</span>
              </button>
            </div>
          </div>

          {/* Dynamic Payment Details */}
          <div className="rounded-lg border p-6 min-h-[400px]" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
            <AnimatePresence mode="wait">
              {paymentMethod === 'card' ? (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2" style={{ color: '#7DA8CF' }}>
                    <CreditCard className="w-4 h-4" /> Card Details (Demo Mode)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Cardholder Name</label>
                      <input
                        type="text" value={form.name}
                        onChange={e => setField('name', e.target.value)}
                        className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none"
                        style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : inputStyle.borderColor }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Card Number</label>
                      <input
                        type="text" value={form.card} maxLength={19}
                        onChange={e => setField('card', e.target.value.replace(/[^\d\s]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19))}
                        className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none font-mono"
                        style={{ ...inputStyle, borderColor: errors.card ? '#EF4444' : inputStyle.borderColor }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Expiry</label>
                      <input
                        type="text" value={form.expiry} maxLength={5}
                        onChange={e => setField('expiry', e.target.value)}
                        className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none font-mono"
                        style={{ ...inputStyle, borderColor: errors.expiry ? '#EF4444' : inputStyle.borderColor }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>CVV</label>
                      <input
                        type="text" value={form.cvv} maxLength={4}
                        onChange={e => setField('cvv', e.target.value)}
                        className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none font-mono"
                        style={{ ...inputStyle, borderColor: errors.cvv ? '#EF4444' : inputStyle.borderColor }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#555' : '#aaa' }}>Email</label>
                      <input
                        type="email" value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        className="w-full rounded border px-4 py-2.5 text-sm focus:outline-none"
                        style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : inputStyle.borderColor }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-8 flex items-center gap-2" style={{ color: '#7DA8CF' }}>
                    <Smartphone className="w-4 h-4" /> Scan to Pay
                  </h3>
                  
                  <div className="p-6 rounded-[2rem] bg-white shadow-2xl mb-6">
                    <QRCodeSVG 
                      value={upiLink} 
                      size={200}
                      level="H"
                    />
                  </div>
                  
                  <p className="text-xl font-bold mb-2" style={{ color: isDark ? '#fff' : '#111' }}>
                    Scan to Pay ₹1 via UPI
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Use any UPI app (GPay, PhonePe, PayTM)
                  </p>
                  
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs mb-8">
                    upiId: cookmyshow@bank
                  </div>

                  <div className="flex items-center gap-2 text-xs text-green-500 font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Instant Verification Enabled
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-lg border p-6 h-fit sticky top-20" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
          <h3 className="text-xs uppercase tracking-widest font-bold mb-5" style={{ color: '#7DA8CF' }}>Order Summary</h3>

          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
            <img src={event.image || (event.images?.[0])} alt="" className="w-14 h-14 rounded object-cover" style={{ filter: isDark ? 'brightness(0.8)' : 'none' }} />
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
            {coinDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#7DA8CF' }}>Coin Discount</span>
                <span className="font-mono" style={{ color: '#7DA8CF' }}>-₹{coinDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#666' : '#999' }}>Service Fee</span>
              <span className="font-mono" style={{ color: isDark ? '#fff' : '#111' }}>₹{serviceFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Coin Redemption UI */}
          {userCoins > 0 && (
            <div className="mb-6 p-3 rounded border" style={{ borderColor: '#7DA8CF33', background: '#7DA8CF08' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7DA8CF' }}>Use Coins</span>
                <span className="text-xs" style={{ color: isDark ? '#555' : '#aaa' }}>Available: {userCoins}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={userCoins}
                  value={coinsToUse}
                  onChange={(e) => setCoinsToUse(Math.min(userCoins, parseInt(e.target.value) || 0))}
                  className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none"
                  style={{ background: isDark ? '#000' : '#fff', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#fff' : '#333' }}
                />
                <button 
                  onClick={() => setCoinsToUse(userCoins)}
                  className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-transparent border cursor-pointer hover:bg-[#7DA8CF11]"
                  style={{ color: '#7DA8CF', borderColor: '#7DA8CF' }}
                >
                  Max
                </button>
              </div>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between items-baseline" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
            <span className="font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>Total Amount</span>
            <span className="text-2xl font-bold font-mono" style={{ color: '#7DA8CF' }}>₹{grandTotal.toLocaleString()}</span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={processing || timeLeft === 0}
            className="w-full mt-5 py-3.5 rounded font-bold text-sm uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#7DA8CF', color: '#000' }}
          >
            {processing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
            ) : paymentMethod === 'upi' ? (
              <>I Have Paid</>
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
