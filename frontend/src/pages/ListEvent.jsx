import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, Trash2, Eye, ChevronRight, ChevronLeft, Check, Music, MapPin, Users, Tag, Image, Loader2 } from 'lucide-react';
import useTheme from '../store/useTheme';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STEPS = [
  { id: 1, label: 'Event Details', icon: Music },
  { id: 2, label: 'Date & Venue', icon: MapPin },
  { id: 3, label: 'Capacity & Layout', icon: Users },
  { id: 4, label: 'Pricing Tiers', icon: Tag },
  { id: 5, label: 'Media & Review', icon: Image },
];

function SeatLayoutPreview({ count, isDark }) {
  const cols = Math.min(16, Math.ceil(Math.sqrt(count)));
  if (count <= 0) return null;

  return (
    <div className="rounded-lg p-5 border backdrop-blur-sm transition-all" style={{ 
      background: isDark ? 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)' : 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)',
      borderColor: isDark ? '#1a1a1a' : '#eee',
      boxShadow: `0 4px 15px ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'}`
    }}>
      <div className="mb-4">
        <p className="text-sm font-bold mb-2" style={{ color: isDark ? '#fff' : '#111' }}>Preview</p>
        <p className="text-xs" style={{ color: isDark ? '#666' : '#999' }}>
          {count} seats — {Math.ceil(count / cols)} rows × {cols} cols
        </p>
      </div>
      <div
        className="grid gap-1.5 justify-center mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, 
          maxWidth: `${cols * 26}px`
        }}
      >
        {Array.from({ length: Math.min(count, 300) }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: i * 0.003,
              duration: 0.3,
              type: 'spring',
              stiffness: 200
            }}
            whileHover={{ scale: 1.3, zIndex: 10, y: -2 }}
            className="rounded-sm"
            style={{ 
              width: 18,
              height: 18,
              background: 'linear-gradient(135deg, #2DD4BF 0%, #13B0A7 100%)',
              boxShadow: '0 2px 8px rgba(45, 212, 191, 0.3), 0 0 12px rgba(45, 212, 191, 0.2)',
              cursor: 'pointer',
              borderRadius: 3
            }}
          />
        ))}
      </div>
      {count > 300 && (
        <p className="text-xs mt-4 text-center" style={{ color: isDark ? '#555' : '#bbb' }}>
          Showing first 300 of {count} seats
        </p>
      )}
    </div>
  );
}

function StepIndicator({ steps, currentStep, isDark }) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((step, i) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center relative">
              <motion.div
                animate={{
                  background: isActive ? '#7DA8CF' : isCompleted ? '#4ADE80' : (isDark ? '#1a1a1a' : '#eee'),
                  borderColor: isActive ? '#7DA8CF' : isCompleted ? '#4ADE80' : (isDark ? '#333' : '#ddd'),
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all"
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" style={{ color: '#000' }} />
                ) : (
                  <Icon className="w-5 h-5" style={{ color: isActive ? '#000' : (isDark ? '#555' : '#999') }} />
                )}
              </motion.div>
              <span
                className="text-[10px] uppercase tracking-wider font-bold mt-2 text-center whitespace-nowrap"
                style={{ color: isActive ? '#7DA8CF' : isCompleted ? '#4ADE80' : (isDark ? '#444' : '#bbb') }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-3 mt-[-20px]"
                style={{ background: isCompleted ? '#4ADE80' : (isDark ? '#1a1a1a' : '#eee') }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

export default function ListEvent() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const { user } = useStore();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Live Show',
    artists: '',
    date: '',
    time: '',
    venue: '',
    city: '',
    totalSeats: 200,
    floors: 1,
    aisles: 2,
    imageFiles: [],
    imagePreviews: [],
  });
  const [tiers, setTiers] = useState([
    { name: 'General', price: '', seats: '' },
    { name: 'VIP', price: '', seats: '' },
    { name: 'Premium', price: '', seats: '' },
  ]);

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      updateField('imageFiles', files);
      const previews = files.map(f => URL.createObjectURL(f));
      updateField('imagePreviews', previews);
    }
  };

  const addTier = () => setTiers([...tiers, { name: '', price: '', seats: '' }]);
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i));
  const updateTier = (i, field, value) => setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const goNext = () => {
    if (step < 5) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.token) {
      toast.error('You must be logged in to list an event');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('title', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('date', formData.date);
      data.append('venue', formData.venue);
      data.append('totalSeats', formData.totalSeats);
      data.append('tiers', JSON.stringify(tiers));

      formData.imageFiles.forEach(file => {
        data.append('images', file);
      });

      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: data
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success('Event listed successfully! 🎉');
        setStep(1);
        setFormData({
          name: '', description: '', category: 'Live Show', artists: '',
          date: '', time: '', venue: '', city: '', totalSeats: 200,
          floors: 1, aisles: 2, imageFiles: [], imagePreviews: [],
        });
        setTiers([
          { name: 'General', price: '', seats: '' },
          { name: 'VIP', price: '', seats: '' },
          { name: 'Premium', price: '', seats: '' },
        ]);
      } else {
        throw new Error(resData.message || 'Failed to list event');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while listing the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 1: return formData.name && formData.description && formData.category;
      case 2: return formData.date && formData.time && formData.venue;
      case 3: return formData.totalSeats >= 10;
      case 4: return tiers.length > 0 && tiers.every((t) => t.name && t.price);
      case 5: return true;
      default: return false;
    }
  };

  const inputStyle = {
    background: isDark ? '#0a0a0a' : '#fff',
    borderColor: isDark ? '#222' : '#e5e5e5',
    color: isDark ? '#fff' : '#333',
  };

  const labelStyle = { color: isDark ? '#555' : '#aaa' };
  const cardBg = { background: isDark ? '#0a0a0a' : '#fafafa', borderColor: isDark ? '#1a1a1a' : '#eee' };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#7DA8CF' }}>
          Create
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold font-heading"
          style={{ color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}
        >
          List an Event
        </h2>
        <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#999' }}>
          Complete each step to get your event live on CookMyShow.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} isDark={isDark} />

      <div className="rounded-xl border p-8 mb-8" style={cardBg}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Step 1: Event Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  Tell us about your event
                </h3>
                <p className="text-xs mb-6" style={{ color: isDark ? '#555' : '#999' }}>
                  Name, description, category, and performing artists.
                </p>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Event Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Arijit Singh Live Concert"
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Category *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Live Show', 'Comedy', 'Sports', 'Conference', 'Workshop', 'Festival', 'Theatre'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => updateField('category', cat)}
                        className="text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer transition-all border"
                        style={{
                          background: formData.category === cat ? '#7DA8CF' : 'transparent',
                          color: formData.category === cat ? '#000' : (isDark ? '#888' : '#666'),
                          borderColor: formData.category === cat ? '#7DA8CF' : (isDark ? '#222' : '#ddd'),
                          fontWeight: formData.category === cat ? 700 : 500,
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Artists / Performers</label>
                  <input
                    type="text"
                    value={formData.artists}
                    onChange={(e) => updateField('artists', e.target.value)}
                    placeholder="e.g., Arijit Singh, Shreya Ghoshal"
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Description *</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe your event in detail..."
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none resize-none"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Date & Venue */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  When & Where
                </h3>
                <p className="text-xs mb-6" style={{ color: isDark ? '#555' : '#999' }}>
                  Set the date, time, and venue for your event.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Time *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => updateField('time', e.target.value)}
                      className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Venue *</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => updateField('venue', e.target.value)}
                    placeholder="e.g., Mumbai Stadium"
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g., Mumbai"
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>

                {/* Venue preview */}
                {formData.venue && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border p-4 flex items-center gap-3"
                    style={cardBg}
                  >
                    <MapPin className="w-5 h-5" style={{ color: '#7DA8CF' }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#111' }}>{formData.venue}</p>
                      {formData.city && <p className="text-xs" style={{ color: isDark ? '#555' : '#999' }}>{formData.city}</p>}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 3: Capacity & Layout */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  Capacity & Seating
                </h3>
                <p className="text-xs mb-6" style={{ color: isDark ? '#555' : '#999' }}>
                  Configure total seats and venue layout.
                </p>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Total Seats *</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={formData.totalSeats}
                    onChange={(e) => updateField('totalSeats', Number(e.target.value))}
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Floors</label>
                    <select
                      value={formData.floors}
                      onChange={(e) => updateField('floors', Number(e.target.value))}
                      className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                      style={inputStyle}
                    >
                      {[1, 2, 3].map((n) => <option key={n} value={n}>{n} Floor{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Aisles</label>
                    <select
                      value={formData.aisles}
                      onChange={(e) => updateField('aisles', Number(e.target.value))}
                      className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                      style={inputStyle}
                    >
                      {[1, 2, 3].map((n) => <option key={n} value={n}>{n} Aisle{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3" style={{ color: '#7DA8CF' }}>
                    <Eye className="w-4 h-4" /> Seat Layout Preview
                  </h4>
                  <SeatLayoutPreview count={formData.totalSeats} isDark={isDark} />
                </div>
              </div>
            )}

            {/* Step 4: Pricing Tiers */}
            {step === 4 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  Ticket Pricing
                </h3>
                <p className="text-xs mb-6" style={{ color: isDark ? '#555' : '#999' }}>
                  Define your ticket tiers with names, prices, and seat allocation.
                </p>

                <div className="space-y-3">
                  {tiers.map((tier, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border p-4"
                      style={cardBg}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase tracking-wider font-bold" style={{ color: '#7DA8CF' }}>
                          Tier {i + 1}
                        </span>
                        {tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTier(i)}
                            className="bg-transparent border-none cursor-pointer transition-colors"
                            style={{ color: isDark ? '#555' : '#bbb' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = isDark ? '#555' : '#bbb'; }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider mb-1" style={labelStyle}>Name *</label>
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => updateTier(i, 'name', e.target.value)}
                            placeholder="e.g., VIP"
                            className="w-full rounded border px-3 py-2 text-sm focus:outline-none"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider mb-1" style={labelStyle}>Price (₹) *</label>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => updateTier(i, 'price', e.target.value)}
                            placeholder="999"
                            className="w-full rounded border px-3 py-2 text-sm focus:outline-none"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider mb-1" style={labelStyle}>Seats</label>
                          <input
                            type="number"
                            value={tier.seats}
                            onChange={(e) => updateTier(i, 'seats', e.target.value)}
                            placeholder="50"
                            className="w-full rounded border px-3 py-2 text-sm focus:outline-none"
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addTier}
                  className="text-xs uppercase tracking-wider flex items-center gap-1 bg-transparent border-none cursor-pointer font-bold"
                  style={{ color: '#7DA8CF' }}
                >
                  <Plus className="w-4 h-4" /> Add Another Tier
                </button>
              </div>
            )}

            {/* Step 5: Media & Review */}
            {step === 5 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold font-heading mb-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  Upload Media & Review
                </h3>
                <p className="text-xs mb-6" style={{ color: isDark ? '#555' : '#999' }}>
                  Add a cover image and review all your event details.
                </p>

                {/* Image upload */}
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 font-bold" style={labelStyle}>Cover Image</label>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors relative"
                    style={{ borderColor: isDark ? '#222' : '#ddd' }}
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {formData.imagePreviews.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {formData.imagePreviews.map((p, i) => (
                          <img key={i} src={p} alt="" className="w-20 h-20 object-cover rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: isDark ? '#444' : '#bbb' }} />
                        <p className="text-sm" style={{ color: isDark ? '#555' : '#999' }}>Drag & drop or click to upload</p>
                        <p className="text-xs mt-1" style={{ color: isDark ? '#444' : '#bbb' }}>PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Review summary */}
                <div className="rounded-lg border p-5 space-y-4" style={cardBg}>
                  <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#7DA8CF' }}>
                    Event Summary
                  </h4>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <ReviewItem label="Event Name" value={formData.name} isDark={isDark} />
                    <ReviewItem label="Category" value={formData.category} isDark={isDark} />
                    <ReviewItem label="Artists" value={formData.artists || '—'} isDark={isDark} />
                    <ReviewItem label="Date" value={formData.date || '—'} isDark={isDark} />
                    <ReviewItem label="Time" value={formData.time || '—'} isDark={isDark} />
                    <ReviewItem label="Venue" value={formData.venue || '—'} isDark={isDark} />
                    <ReviewItem label="City" value={formData.city || '—'} isDark={isDark} />
                    <ReviewItem label="Total Seats" value={String(formData.totalSeats)} isDark={isDark} />
                  </div>

                  <div className="border-t pt-3 mt-3" style={{ borderColor: isDark ? '#1a1a1a' : '#eee' }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={labelStyle}>Pricing Tiers</p>
                    <div className="space-y-1">
                      {tiers.map((t, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span style={{ color: isDark ? '#ccc' : '#444' }}>{t.name}</span>
                          <span className="font-mono font-bold" style={{ color: '#7DA8CF' }}>₹{t.price || '0'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={step === 1}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider cursor-pointer bg-transparent border-none transition-opacity"
          style={{ color: isDark ? '#888' : '#666', opacity: step === 1 ? 0.3 : 1 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: step === s.id ? '#7DA8CF' : step > s.id ? '#4ADE80' : (isDark ? '#222' : '#ddd'),
                transform: step === s.id ? 'scale(1.5)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {step < 5 ? (
          <button
            onClick={goNext}
            disabled={!canNext()}
            className="flex items-center gap-2 py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer border-none transition-all"
            style={{
              background: canNext() ? '#7DA8CF' : (isDark ? '#1a1a1a' : '#eee'),
              color: canNext() ? '#000' : (isDark ? '#444' : '#bbb'),
              opacity: canNext() ? 1 : 0.6,
            }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 py-3 px-8 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer border-none transition-all"
            style={{ background: '#4ADE80', color: '#000' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isSubmitting ? 'Publishing...' : 'Publish Event'}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value, isDark }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: isDark ? '#444' : '#bbb' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: isDark ? '#ccc' : '#333' }}>{value}</p>
    </div>
  );
}
