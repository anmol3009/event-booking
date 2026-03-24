import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_BASE, { autoConnect: false });

const useStore = create((set, get) => ({
  // Socket — access point for components
  socket,

  // Seat state update for live sync (can be called by sockets or HTTP)
  setSeatStatus: (seatId, status, holdExpiry) => set((state) => {
    const numericId = Number(seatId);
    if (isNaN(numericId)) return {};

    const newState = { ...state.seatStates, [numericId]: status };
    
    // If a hold is starting, schedule a client-side release as fallback
    if (status === 'held') {
      const remainingMs = holdExpiry ? (new Date(holdExpiry) - new Date()) : 120000;
      if (remainingMs > 0) {
        setTimeout(() => {
          // Only release if it's STILL in 'held' state (hasn't been booked or updated)
          const current = get().seatStates[numericId];
          if (current === 'held') {
            set((s) => ({
              seatStates: { ...s.seatStates, [numericId]: 'available' },
              selectedSeats: s.selectedSeats.filter(id => Number(id) !== numericId)
            }));
          }
        }, remainingMs);
      }
    }
    
    return { seatStates: newState };
  }),

  // Auth — user shape: { userId, name, email, token (Firebase ID token) }
  user: null,
  isLoggedIn: false,
  login: (userData) => set({ user: userData, isLoggedIn: true }),
  updateUser: (updates) => set((state) => ({ 
    user: state.user ? { ...state.user, ...updates } : null 
  })),
  logout: () => {
    // Sign out from Firebase so the token is invalidated
    signOut(auth).catch(() => {});
    set({ user: null, isLoggedIn: false });
  },

  // Seat selection
  selectedSeats: [],
  selectedTier: null,
  selectSeat: (seatIndex) => {
    const num = Number(seatIndex);
    if (isNaN(num)) return;

    const { selectedSeats } = get();
    if (selectedSeats.includes(num)) {
      set({ selectedSeats: selectedSeats.filter((s) => s !== num) });
    } else {
      // Enforce 4-seat limit per user per booking
      if (selectedSeats.length >= 4) {
        return; // Silently ignore, or toast will handle it in component
      }
      set({ selectedSeats: [...selectedSeats, num] });
    }
  },
  clearSeats: () => set({ selectedSeats: [], selectedTier: null }),
  setSelectedTier: (tier) => set({ selectedTier: tier }),

  // Seat states for an event (map of seatIndex -> status)
  seatStates: {},
  initializeSeats: (totalSeats, seatData = []) => {
    const states = {};
    // First, fill all with "available"
    for (let i = 0; i < totalSeats; i++) {
      states[i] = 'available';
    }
    // Then, overlay with real statuses if provided (seatData is array of { seatId (index), status, etc. })
    if (Array.isArray(seatData)) {
      seatData.forEach(s => {
        const idx = Number(s.seatId);
        if (!isNaN(idx)) states[idx] = s.status;
      });
    }
    set({ seatStates: states, selectedSeats: [] });
  },

  // Cart
  cartTotal: 0,
  setCartTotal: (total) => set({ cartTotal: total }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export default useStore;
