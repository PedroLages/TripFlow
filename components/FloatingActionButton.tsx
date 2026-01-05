/**
 * Floating Action Button (FAB)
 *
 * Modern FAB with triggered scroll animations and micro-interactions
 * Following 2025-2026 UX trends for constructive actions
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  className
}) => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  // Track scroll for triggered animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate visibility based on scroll (subtle triggered animation)
  // Show after scrolling 100px, fade in gradually
  const opacity = Math.min(scrollY / 100, 1);
  const scale = 0.8 + (opacity * 0.2); // Scale from 0.8 to 1.0

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/create');
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      aria-label="Create new trip"
      className={`${className} fixed bottom-24 right-4 z-[90] lg:hidden`}
      style={{
        opacity,
        transform: `scale(${isPressed ? scale * 0.9 : scale})`,
        transition: isPressed ? 'transform 0.1s ease-out' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
        pointerEvents: opacity > 0.3 ? 'auto' : 'none',
      }}
    >
      <div
        className="relative w-14 h-14 bg-brand-primary rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.16)] transition-shadow duration-300"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Ripple effect background */}
        <div
          className="absolute inset-0 bg-white rounded-full opacity-0 hover:opacity-10 active:opacity-20 transition-opacity duration-200"
        />

        {/* Icon with rotation animation */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: isPressed ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <Plus
            size={28}
            className="text-white"
            strokeWidth={2.5}
          />
        </div>
      </div>
    </button>
  );
};
