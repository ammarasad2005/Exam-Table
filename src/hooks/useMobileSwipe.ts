'use client';

import { useEffect, useRef } from 'react';

interface SwipeOptions {
  onClose: () => void;
  defaultHeightStr: string; // e.g. '85dvh' or '60dvh'
}

export function useMobileSwipe({ onClose, defaultHeightStr }: SwipeOptions) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const drawer = drawerRef.current;
    const handle = handleRef.current;
    if (!drawer || !handle) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let state: 'default' | 'full' = 'default';

    // To cleanly calculate height we need to convert defaultHeightStr to a number of pixels or just use CSS calc
    // But since CSS calc is great, we'll use it!

    const setTransition = (enabled: boolean) => {
      drawer.style.transition = enabled
        ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
        : 'none';
    };

    const updateHeight = () => {
      if (window.innerWidth >= 768) {
        drawer.style.height = '';
        drawer.style.transform = '';
        drawer.style.maxHeight = '';
        return;
      }
      
      // Remove max-height constraints during drag/expanded states to allow full height
      drawer.style.maxHeight = 'none';

      if (state === 'default') {
        drawer.style.height = defaultHeightStr;
        drawer.style.transform = 'translateY(0px)';
      } else {
        drawer.style.height = '100dvh';
        drawer.style.transform = 'translateY(0px)';
      }
    };

    const onTouchStart = (e: TouchEvent | MouseEvent) => {
      if (window.innerWidth >= 768) return;
      isDragging = true;
      startY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      currentY = 0;
      setTransition(false);
    };

    const onTouchMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      // Prevent default scrolling when dragging the handle
      if (e.cancelable) e.preventDefault();
      
      const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      currentY = y - startY;

      if (state === 'default') {
        if (currentY < 0) {
          // Swiping up -> increase height
          drawer.style.height = `calc(${defaultHeightStr} + ${-currentY}px)`;
          drawer.style.transform = `translateY(0px)`;
        } else {
          // Swiping down -> slide down via transform
          drawer.style.transform = `translateY(${currentY}px)`;
        }
      } else if (state === 'full') {
        if (currentY > 0) {
          // Swiping down from full -> decrease height
          drawer.style.height = `calc(100dvh - ${currentY}px)`;
          drawer.style.transform = `translateY(0px)`;
        } else {
          // Swiping up from full -> add resistance
          drawer.style.transform = `translateY(${currentY * 0.2}px)`;
        }
      }
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      setTransition(true);

      const threshold = 60; // px
      
      if (state === 'default') {
        if (currentY < -threshold) {
          state = 'full';
        } else if (currentY > threshold) {
          onClose();
          return;
        }
      } else if (state === 'full') {
        if (currentY > threshold) {
          state = 'default';
        }
      }

      updateHeight();
    };

    const options = { passive: false };
    
    handle.addEventListener('touchstart', onTouchStart, options);
    handle.addEventListener('touchmove', onTouchMove, options);
    handle.addEventListener('touchend', onTouchEnd);
    handle.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);
    window.addEventListener('resize', updateHeight);

    // Initial setup
    // Use setTimeout to avoid interfering with the entry animation
    const initTimer = setTimeout(() => {
        updateHeight();
    }, 300);

    return () => {
      clearTimeout(initTimer);
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
      handle.removeEventListener('mousedown', onTouchStart);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);
      window.removeEventListener('resize', updateHeight);
      
      // Cleanup styles
      drawer.style.transition = '';
      drawer.style.height = '';
      drawer.style.transform = '';
      drawer.style.maxHeight = '';
    };
  }, [onClose, defaultHeightStr]);

  return { drawerRef, handleRef };
}
