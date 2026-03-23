import { useRef, useCallback } from 'react';

export default function useTilt(maxTilt = 8) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(600px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale3d(1.02, 1.02, 1.02)`;
  }, [maxTilt]);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
