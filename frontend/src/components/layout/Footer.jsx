import { Flame, Mail, Phone, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTheme from '../../store/useTheme';

export default function Footer() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <footer
      className="border-t mt-auto transition-colors duration-300 relative"
      style={{
        background: isDark ? '#000' : '#fafafa',
        borderColor: isDark ? '#1a1a1a' : '#e5e5e5',
      }}
    >
      {/* List Your Show Banner (BookMyShow style) */}
      <div
        className="border-b"
        style={{
          borderColor: isDark ? '#1a1a1a' : '#e5e5e5',
          background: isDark ? '#0a0a0a' : '#f5f5f5',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(125,168,207,0.1)' }}>
              <span className="text-lg">🏠</span>
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: isDark ? '#fff' : '#111' }}>List your Show</span>
              <span className="text-sm ml-2" style={{ color: isDark ? '#666' : '#999' }}>
                Got a show, event, activity or a great experience? Partner with us & get listed on CookMyShow
              </span>
            </div>
          </div>
          <Link
            to="/list-event"
            className="no-underline shrink-0 py-2.5 px-6 rounded-lg font-bold text-sm uppercase tracking-wider transition-all"
            style={{
              background: '#E11D48',
              color: '#fff',
            }}
          >
            Contact today!
          </Link>
        </div>
      </div>

      {/* Services strip */}
      <div
        className="border-b"
        style={{ borderColor: isDark ? '#1a1a1a' : '#e5e5e5' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🎧', label: '24/7 CUSTOMER CARE' },
            { icon: '📧', label: 'RESEND BOOKING CONFIRMATION' },
            { icon: '📰', label: 'SUBSCRIBE TO THE NEWSLETTER' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 group cursor-pointer">
              <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: isDark ? '#666' : '#999' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6" style={{ color: '#7DA8CF' }} />
              <span className="font-heading font-bold text-lg" style={{ color: isDark ? '#fff' : '#111' }}>
                CookMyShow
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: isDark ? '#666' : '#999' }}>
              A smart ticketing platform with real-time seat booking,
              controlled resale, and automated waitlist management.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: isDark ? '#555' : '#aaa' }}>
              Contact
            </h4>
            <ul className="space-y-3 text-sm list-none p-0 m-0" style={{ color: isDark ? '#888' : '#666' }}>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" style={{ color: '#7DA8CF' }} /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" style={{ color: '#7DA8CF' }} /> hello@cookmyshow.com</li>
              <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" style={{ color: '#7DA8CF' }} /> cookmyshow.com</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: isDark ? '#555' : '#aaa' }}>
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm list-none p-0 m-0">
              {[
                { to: '/', label: 'Browse Events' },
                { to: '/resell-tickets', label: 'Resale Market' },
                { to: '/my-bookings', label: 'My Bookings' },
                { to: '/list-event', label: 'List an Event' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="no-underline transition-colors duration-300 hover:opacity-100"
                    style={{ color: isDark ? '#666' : '#888' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: isDark ? '#555' : '#aaa' }}>
              Follow Us
            </h4>
            <div className="flex gap-3">
              {[
                { name: 'Facebook', color: '#1877F2' },
                { name: 'Instagram', color: '#E4405F' },
                { name: 'LinkedIn', color: '#A78BFA' },
              ].map((s) => (
                <a
                  key={s.name}
                  href="#"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 no-underline text-sm font-bold"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${isDark ? '#222' : '#ddd'}`,
                    color: isDark ? '#666' : '#999',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = s.color; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = s.color; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#666' : '#999'; e.currentTarget.style.borderColor = isDark ? '#222' : '#ddd'; }}
                >
                  {s.name[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderColor: isDark ? '#1a1a1a' : '#e5e5e5' }}
        >
          <p className="text-xs" style={{ color: isDark ? '#444' : '#bbb' }}>
            &copy; 2026 CookMyShow. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: isDark ? '#333' : '#ccc' }}>
            Built with passion for live experiences.
          </p>
        </div>
      </div>
    </footer>
  );
}
