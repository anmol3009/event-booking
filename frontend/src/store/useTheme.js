import { create } from 'zustand';

const useTheme = create((set) => ({
  mode: localStorage.getItem('theme') || 'dark',
  toggle: () =>
    set((state) => {
      const next = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return { mode: next };
    }),
}));

export default useTheme;
