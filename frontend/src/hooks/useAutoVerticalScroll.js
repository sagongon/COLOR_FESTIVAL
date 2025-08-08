import { useEffect, useRef } from 'react';

export function useAutoVerticalScroll(containerRef, options = {}) {
  const { speed = 30, pauseMs = 1200 } = options;
  const pausedRef = useRef(false);
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onEnter = () => { pausedRef.current = true; };
    const onLeave = () => { pausedRef.current = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    let lastTs = 0;
    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (!pausedRef.current && el) {
        el.scrollTop += speed * dt;
        const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
        if (atBottom) {
          pausedRef.current = true;
          timeoutRef.current = setTimeout(() => {
            if (el) el.scrollTop = 0;
            pausedRef.current = false;
          }, pauseMs);
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [containerRef, speed, pauseMs]);
}


