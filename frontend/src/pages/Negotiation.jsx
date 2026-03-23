import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function MessageBubble({ message, isDark }) {
  const isBuyer = message.sender === 'buyer';
  return (
    <motion.div
      initial={{ opacity: 0, x: isBuyer ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isBuyer ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div
        className="max-w-[70%] rounded-2xl px-4 py-3"
        style={{
          background: isBuyer
            ? (isDark ? '#111' : '#f0f0f0')
            : (isDark ? 'rgba(125,168,207,0.15)' : 'rgba(125,168,207,0.1)'),
        }}
      >
        <p className="text-xs mb-1 font-bold uppercase tracking-wider" style={{ color: isBuyer ? (isDark ? '#555' : '#999') : '#7DA8CF' }}>
          {message.sender}
        </p>
        <p className="text-sm" style={{ color: isDark ? '#fff' : '#111' }}>{message.text}</p>
        <p className="text-[10px] mt-1" style={{ color: isDark ? '#444' : '#bbb' }}>{message.timestamp}</p>
        {message.status && (
          <div className="mt-2">
            <StatusBadge status={message.status} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Negotiation() {
  const { ticketId } = useParams();
  const { user } = useStore();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [dealDone, setDealDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  useEffect(() => {
    const token = user?.token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Fetch the resale listing
    fetch(`${API_BASE}/api/resale`, { headers })
      .then((r) => r.json())
      .then((data) => {
        const found = (data.listings || []).find((t) => t.listingId === ticketId);
        setTicket(found || null);
      })
      .catch(() => setTicket(null));
    // Fetch offer messages
    fetch(`${API_BASE}/api/offers/${ticketId}`, { headers })
      .then((r) => r.json())
      .then((data) => setMessages(data.offers || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [ticketId, user]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      sender: 'buyer',
      text: input,
      timestamp: 'just now',
    };
    setMessages([...messages, newMsg]);
    setInput('');

    setTimeout(() => {
      const amount = parseInt(input.replace(/\D/g, ''));
      if (amount && amount >= 820) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'seller',
            text: `Deal! ₹${amount} works for me.`,
            timestamp: 'just now',
            status: 'completed',
          },
        ]);
        setDealDone(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'seller',
            text: 'I need at least ₹820. Can you do better?',
            timestamp: 'just now',
          },
        ]);
      }
    }, 1500);
  };

  const handleAction = (action) => {
    if (action === 'accept') {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, sender: 'seller', text: 'Deal accepted!', timestamp: 'just now', status: 'completed' },
      ]);
      setDealDone(true);
    } else if (action === 'reject') {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, sender: 'seller', text: 'Offer rejected.', timestamp: 'just now', status: 'failed' },
      ]);
    } else {
      setInput('I can do ₹825.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
          Marketplace
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold font-heading"
          style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
        >
          Negotiation
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7DA8CF' }} />
        </div>
      ) : !ticket ? (
        <p className="text-center py-20" style={{ color: isDark ? '#555' : '#aaa' }}>Ticket listing not found.</p>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">

        {/* Ticket Details */}
        <div className="rounded-lg border p-6" style={{ borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}>
          <img
            src={ticket.image}
            alt={ticket.eventTitle}
            className="w-full aspect-[3/2] object-cover rounded-lg mb-4"
            style={{ filter: isDark ? 'brightness(0.8)' : 'none' }}
          />
          <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>{ticket.eventTitle}</h3>
          <p className="text-xs uppercase tracking-wider mb-4" style={{ color: isDark ? '#555' : '#999' }}>
            Seat {ticket.seat} &middot; {ticket.tier}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#555' : '#999' }}>Original Price</span>
              <span className="line-through" style={{ color: isDark ? '#555' : '#bbb' }}>₹{ticket.originalPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: isDark ? '#555' : '#999' }}>Resale Price</span>
              <span className="font-bold font-mono text-lg" style={{ color: '#7DA8CF' }}>₹{ticket.resalePrice}</span>
            </div>
          </div>

          <p className="text-xs uppercase tracking-wider" style={{ color: isDark ? '#444' : '#bbb' }}>
            Seller: {ticket.seller}
          </p>
        </div>

        {/* Chat */}
        <div className="flex flex-col">
          <div
            className="rounded-lg border flex-1 flex flex-col"
            style={{ minHeight: '400px', borderColor: isDark ? '#1a1a1a' : '#eee', background: isDark ? '#0a0a0a' : '#fafafa' }}
          >
            {/* Chat header */}
            <div className="p-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ADE80' }} />
              <span className="text-xs uppercase tracking-wider" style={{ color: isDark ? '#555' : '#999' }}>Real-time</span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-0">
              <AnimatePresence>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isDark={isDark} />
                ))}
              </AnimatePresence>

              {dealDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <p className="font-bold text-lg" style={{ color: '#4ADE80' }}>Deal Confirmed!</p>
                </motion.div>
              )}
            </div>

            {/* Action buttons */}
            {!dealDone && (
              <div className="p-4 flex gap-2" style={{ borderTop: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
                <button
                  onClick={() => handleAction('accept')}
                  className="flex-1 py-2.5 rounded text-xs uppercase tracking-wider font-bold border-none cursor-pointer"
                  style={{ background: '#4ADE80', color: '#000' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="flex-1 py-2.5 rounded text-xs uppercase tracking-wider font-bold border-none cursor-pointer"
                  style={{ background: '#EF4444', color: '#fff' }}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction('counter')}
                  className="flex-1 py-2.5 rounded text-xs uppercase tracking-wider font-bold border-none cursor-pointer"
                  style={{ background: '#F59E0B', color: '#000' }}
                >
                  Counter Offer
                </button>
              </div>
            )}

            {/* Message input */}
            <div className="p-4 flex gap-2" style={{ borderTop: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                disabled={dealDone}
                className="flex-1 rounded border px-4 py-2.5 text-sm focus:outline-none disabled:opacity-50"
                style={{
                  background: isDark ? '#111' : '#fff',
                  borderColor: isDark ? '#222' : '#e5e5e5',
                  color: isDark ? '#fff' : '#333',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={dealDone || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#7DA8CF', color: '#000' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
