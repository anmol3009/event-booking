import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const useStore = create((set, get) => ({
  // Auth — user shape: { userId, name, email, token (Firebase ID token) }
  user: null,
  isLoggedIn: false,
  login: (userData) => set({ user: userData, isLoggedIn: true }),
  logout: () => {
    // Sign out from Firebase so the token is invalidated
    signOut(auth).catch(() => {});
    set({ user: null, isLoggedIn: false });
  },

  // Seat selection
  selectedSeats: [],
  selectedTier: null,
  selectSeat: (seatIndex) => {
    const { selectedSeats } = get();
    if (selectedSeats.includes(seatIndex)) {
      set({ selectedSeats: selectedSeats.filter((s) => s !== seatIndex) });
    } else {
      set({ selectedSeats: [...selectedSeats, seatIndex] });
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
        const idx = typeof s.seatId === 'number' ? s.seatId : parseInt(s.seatId);
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
